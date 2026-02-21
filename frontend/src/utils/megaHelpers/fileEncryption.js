/**
 * Fast file encryption using Web Workers (hardware-accelerated AES-GCM in separate threads).
 * Chunk size: 5MB (≤100MB), 10MB (100–600MB), 20MB (≥600MB).
 * Raw key is sent to workers (CryptoKey cannot be transferred); upload concurrency limited to 3.
 */

import axiosInstance from "../axiosInstance";

const UPLOAD_CONCURRENCY = 3;
const MAX_WORKERS = 4;
/** First N chunks carry metadata so the server can start MEGA from whichever arrives first (First-Arrival Initialization). */
const METADATA_CHUNK_LIMIT = 3;

function getChunkIV(masterIV, chunkIndex) {
  const chunkIV = new Uint8Array(masterIV);
  const view = new DataView(chunkIV.buffer);
  const currentCounter = view.getUint32(8);
  view.setUint32(8, currentCounter + chunkIndex);
  return chunkIV;
}

/** Upload chunk to BullMQ flow (POST /files/upload). */
const uploadChunk = async (encryptedChunk, fileId, chunkIndex, masterIV, isLastChunk, wrappedKey, metadata, totalEncryptedSize) => {
  const formData = new FormData();
  formData.append('fileId', fileId);
  formData.append('chunkId', chunkIndex);
  formData.append('isLastChunk', isLastChunk);

  // Omni-metadata: send metadata with first METADATA_CHUNK_LIMIT chunks so server can init from any of them (no race).
  if (chunkIndex < METADATA_CHUNK_LIMIT && metadata) {
    formData.append('sectionType', metadata.sectionType);
    if (totalEncryptedSize != null) formData.append('totalSize', totalEncryptedSize);
    if (masterIV) formData.append('masterIV', btoa(String.fromCharCode(...masterIV)));
    if (wrappedKey) formData.append('wrappedKey', btoa(String.fromCharCode(...new Uint8Array(wrappedKey))));
    formData.append('metadata', JSON.stringify(metadata));
  }

  formData.append('chunkedData', new Blob([encryptedChunk], { type: 'application/octet-stream' }));

  const response = await axiosInstance.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000
  });
  return response.data;
};

/**
 * Upload one encrypted chunk to MEGAcmd flow (POST /files/upload-chunk).
 * Sends offset so server can write at the correct position and chunk order cannot get messed up.
 * Safe to call in parallel; server writes at offset = chunkIndex * chunkSize.
 */
export const uploadChunkWithOffset = async (encryptedChunk, fileId, chunkIndex, chunkSize, isLastChunk) => {
  const formData = new FormData();
  formData.append('fileId', fileId);
  formData.append('chunkIndex', chunkIndex);
  formData.append('offset', chunkIndex * chunkSize);
  formData.append('isLastChunk', isLastChunk);
  formData.append('chunkData', new Blob([encryptedChunk], { type: 'application/octet-stream' }));

  const response = await axiosInstance.post('/files/upload-chunk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000
  });
  return response.data;
};

/**
 * Poll GET /files/status/:fileId until the backend (BullMQ worker or in-process job) has finished
 * the MEGA transfer. Keeps the upload "alive" until the file is confirmed in MEGA.
 */
async function waitForFinalSync(fileId, onProgress) {
  const POLL_INTERVAL_MS = 2000;
  const MAX_ATTEMPTS = 300; // ~10 min
  onProgress?.(50);

  for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
    try {
      const response = await axiosInstance.get(`/files/status/${fileId}`);
      const { status, file, error } = response.data;

      if (status === 'completed') {
        return file;
      }
      if (status === 'error') {
        throw new Error(error || 'Server-to-MEGA transfer failed.');
      }

      const megaPhaseProgress = 50 + Math.min(attempts * 2, 49);
      onProgress?.(megaPhaseProgress);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    } catch (err) {
      if (err.response?.status === 404) {
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Upload timed out during final sync.');
}

/**
 * Encrypt one chunk in a worker. Worker must already be initialised with rawKey.
 */
function encryptInWorker(worker, file, masterIV, chunkIndex, currentChunkSize) {
  const start = chunkIndex * currentChunkSize;
  const end = Math.min(start + currentChunkSize, file.size);
  return file.slice(start, end).arrayBuffer().then((chunkBuffer) => {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        worker.removeEventListener('message', handler);
        const d = e.data;
        if (d.type === 'success') resolve(d.encryptedBuffer);
        else reject(new Error(d.message || d.error || 'Encryption failed'));
      };
      worker.addEventListener('message', handler);
      worker.postMessage(
        {
          type: 'encrypt',
          chunk: chunkBuffer,
          currentIV: Array.from(getChunkIV(masterIV, chunkIndex)),
          chunkIndex
        },
        [chunkBuffer]
      );
    });
  });
}

/**
 * Run one worker over its assigned chunk indices; write results into encryptedChunks.
 */
async function runWorker(worker, indices, file, masterIV, currentChunkSize, encryptedChunks) {
  for (const i of indices) {
    const enc = await encryptInWorker(worker, file, masterIV, i, currentChunkSize);
    encryptedChunks[i] = enc;
  }
}

export async function encryptFile(file, masterKey, section, onProgress, displayName) {
  const MB = 1024 * 1024;
  const SIZE_100_MB = 100 * MB;
  const SIZE_600_MB = 600 * MB;
  let currentChunkSize;
  if (file.size >= SIZE_600_MB) {
    currentChunkSize = 20 * MB;
  } else if (file.size > SIZE_100_MB) {
    currentChunkSize = 10 * MB;
  } else {
    currentChunkSize = 5 * MB;
  }

  const totalChunks = Math.ceil(file.size / currentChunkSize);
  const totalEncryptedSize = file.size + totalChunks * 16;

  const fileKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
  const masterIV = window.crypto.getRandomValues(new Uint8Array(12));
  const wrappedKey = await window.crypto.subtle.wrapKey(
    "raw", fileKey, masterKey, { name: "AES-GCM", iv: masterIV }
  );

  const rawKey = await window.crypto.subtle.exportKey("raw", fileKey);

  const fileId = crypto.randomUUID();
  const metadata = {
    name: displayName != null && displayName.trim() !== '' ? displayName.trim() : file.name,
    size: file.size,
    type: file.type,
    sectionType: section
  };

  const workerCount = Math.min(MAX_WORKERS, navigator.hardwareConcurrency || 4, totalChunks);
  const workers = Array.from({ length: workerCount }, () =>
    new Worker(new URL('./encrypt.worker.js', import.meta.url))
  );

  try {
    await Promise.all(workers.map((worker) => {
      return new Promise((resolve, reject) => {
        const handler = (e) => {
          worker.removeEventListener('message', handler);
          if (e.data.type === 'ready') resolve();
          else if (e.data.type === 'error') reject(new Error(e.data.message));
        };
        worker.addEventListener('message', handler);
        worker.postMessage({ type: 'init', rawKey });
      });
    }));

    const encryptedChunks = new Array(totalChunks);
    const indicesPerWorker = Array.from({ length: workerCount }, () => []);
    for (let i = 0; i < totalChunks; i++) {
      indicesPerWorker[i % workerCount].push(i);
    }

    await Promise.all(
      workers.map((w, idx) => runWorker(w, indicesPerWorker[idx], file, masterIV, currentChunkSize, encryptedChunks))
    );

    let uploadedCount = 0;
    const uploadChunkAtIndex = async (i) => {
      await uploadChunk(
        encryptedChunks[i],
        fileId,
        i,
        i < METADATA_CHUNK_LIMIT ? masterIV : null,
        i === totalChunks - 1,
        i < METADATA_CHUNK_LIMIT ? wrappedKey : null,
        i < METADATA_CHUNK_LIMIT ? metadata : null,
        i < METADATA_CHUNK_LIMIT ? totalEncryptedSize : undefined
      ).catch((err) => {
        console.error(`Upload error at chunk ${i}:`, err);
        throw new Error(err.response?.data?.message || `Upload failed at chunk ${i}`);
      });
      uploadedCount++;
      onProgress?.(Math.round((uploadedCount / totalChunks) * 50));
    };

    const uploadIndices = Array.from({ length: UPLOAD_CONCURRENCY }, (_, t) =>
      Array.from({ length: Math.ceil((totalChunks - t) / UPLOAD_CONCURRENCY) }, (_, k) => t + k * UPLOAD_CONCURRENCY).filter((i) => i < totalChunks)
    );
    await Promise.all(uploadIndices.map((indices) => Promise.all(indices.map((i) => uploadChunkAtIndex(i)))));

    const finalFile = await waitForFinalSync(fileId, onProgress);
    onProgress?.(100);
    return { success: true, file: finalFile };
  } finally {
    workers.forEach((w) => w.terminate());
  }
}
