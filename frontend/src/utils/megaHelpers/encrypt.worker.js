/**
 * Web Worker: AES-GCM encryption using raw key (CryptoKey cannot be transferred to workers).
 * Main thread exports file key as raw and sends it once per worker; worker imports and caches it.
 * Message format: init → ready/error; encrypt → success(encryptedBuffer, chunkIndex) / error(message, chunkIndex).
 */

let cryptoKey = null;

self.onmessage = async (e) => {
  const { type, rawKey, chunk, currentIV, chunkIndex } = e.data;

  if (type === 'init') {
    try {
      cryptoKey = await self.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
    return;
  }

  if (type === 'encrypt') {
    try {
      const iv = new Uint8Array(currentIV);
      const encryptedBuffer = await self.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        chunk
      );
      self.postMessage({ type: 'success', encryptedBuffer, chunkIndex }, [encryptedBuffer]);
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message, chunkIndex });
    }
  }
};
