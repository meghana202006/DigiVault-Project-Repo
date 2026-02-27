const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const Busboy = require('busboy');
const File = require('../../models/file');
const User = require('../../models/userModel');
const { cacheMethods, redis } = require('../../utils/redisCache');
const redisService = require('../../utils/redisService');
const { notifyClients } = require('../../utils/socket');
const fsPromises = require('fs').promises;

const SECTION_TO_FILE_TYPE = { 'Documents': 'document', 'Images': 'image', 'Videos': 'video', 'Audio': 'audio', 'Private': 'private' };
const TEMP_DIR = path.join(__dirname, '../temp');
const UPLOAD_META_PREFIX = 'upload:meta:';
const UPLOAD_META_TTL = 3600;
const UPLOAD_STATUS_PREFIX = 'upload:status:';
const UPLOAD_STATUS_TTL = 300;
const { getMegaCmdPath, getMegaCmdPathForSpawn, quotePathForShell } = require('../../utils/megaCmdPath');

async function setUploadError(fileId, errorMessage) {
    try {
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: errorMessage }), 'EX', UPLOAD_STATUS_TTL);
    } catch (e) {
        console.error('[Upload] Failed to set error status:', e.message);
    }
}

async function safeUnlink(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
}

/** Remove upload temp dir (used when we reassemble into uploadDir/originalName). */
function safeRmUploadDir(dirPath) {
    try {
        if (dirPath && fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true });
    } catch (_) {}
}

/** Remove all chunk .tmp files for this upload from TEMP_DIR (call after successful reassembly). */
function cleanupChunksForUpload(safeFileId) {
    try {
        const names = fs.readdirSync(TEMP_DIR);
        for (const name of names) {
            if (name.startsWith(`chunk_${safeFileId}_`) && name.endsWith('.tmp')) {
                fs.unlinkSync(path.join(TEMP_DIR, name));
            }
        }
    } catch (e) {
        console.warn('[Upload] Chunk cleanup warning:', e.message);
    }
}

/**
 * Background Process: Reassemble Chunks -> MEGA-PUT -> MEGA-EXPORT -> DB SAVE
 */
async function reassembleAndMegaPut(fileId) {
    const safeFileId = String(fileId).replace(/[^a-zA-Z0-9-_]/g, '_');

    // 1. Fetch Metadata from Redis
    let metaRaw = await redis.get(UPLOAD_META_PREFIX + fileId).catch(() => null);
    if (!metaRaw) {
        console.error(`[Upload] Metadata missing for ${fileId}`);
        await setUploadError(fileId, 'Upload metadata not found');
        return;
    }

    let meta;
    try {
        meta = JSON.parse(metaRaw);
    } catch (e) {
        console.error('[Upload] Invalid metadata JSON:', e.message);
        await setUploadError(fileId, 'Invalid upload metadata');
        return;
    }

    const { sectionType, metadata, wrappedKey, masterIV, userEmail } = meta;

    // 2. Lookup User
    const user = await User.findOne({ email: (userEmail || '').toLowerCase().trim() }).select('_id megaStorage');
    if (!user || !user.megaStorage?.uuid) {
        console.error(`[Upload] User or Mega UUID missing for ${userEmail}`);
        await setUploadError(fileId, 'Account not ready for upload. Please complete setup.');
        return;
    }

    // 3. Prepare Paths
    const userFolderName = `u_${user.megaStorage.uuid}`;
    const section = (sectionType || 'Private').trim().replace(/^\/+|\/+$/g, '') || 'Private';
    const remoteFolder = `/${userFolderName}/${section}/`;

    const originalName = (metadata && metadata.name)
        ? path.basename(String(metadata.name)).replace(/[<>:"/\\|?*\[\]]/g, '_').trim() || 'upload.enc'
        : 'upload.enc';

    // Reassemble into a subfolder so the file has only originalName (no UUID prefix on MEGA)
    const uploadDir = path.join(TEMP_DIR, safeFileId);
    const finalFilePath = path.join(uploadDir, originalName);

    // 4. Reassemble Chunks
    const chunkFiles = fs.readdirSync(TEMP_DIR)
        .filter((f) => f.startsWith(`chunk_${safeFileId}_`) && f.endsWith('.tmp'))
        .map((f) => {
            const m = f.match(/chunk_.+_(\d+)\.tmp$/);
            return { path: path.join(TEMP_DIR, f), index: m ? parseInt(m[1], 10) : 0 };
        })
        .sort((a, b) => a.index - b.index);

    if (chunkFiles.length === 0) {
        await setUploadError(fileId, 'No upload chunks found');
        return;
    }

    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
        for (const chunk of chunkFiles) {
            await new Promise((resolve, reject) => {
                const reader = fs.createReadStream(chunk.path);
                const writer = fs.createWriteStream(finalFilePath, { flags: 'a' });
                reader.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            fs.unlinkSync(chunk.path);
        }
        // Ensure any remaining chunks for this upload are removed after successful reassembly
        cleanupChunksForUpload(safeFileId);
    } catch (err) {
        console.error('[Upload] Reassembly failed:', err.message);
        await setUploadError(fileId, 'Reassembly failed');
        cleanupChunksForUpload(safeFileId);
        safeUnlink(finalFilePath);
        safeRmUploadDir(uploadDir);
        return;
    }

    // 5. MEGA-PUT: use getMegaCmdPathForSpawn so on Windows we run .bat via cmd.exe with separate args (reliable)
    const { path: megaPutPath, useShell: megaPutUseShell, useCmd: megaPutUseCmd } = getMegaCmdPathForSpawn('mega-put');
    const localPathArg = megaPutUseCmd ? finalFilePath : (megaPutUseShell ? (quotePathForShell(finalFilePath) || finalFilePath) : finalFilePath);
    const megaPutArgs = ['-c', localPathArg, remoteFolder];

    console.log(`[Upload] Starting MEGA-PUT for ${originalName}`);
    const mega = megaPutUseCmd
        ? spawn(process.env.ComSpec || 'cmd.exe', ['/c', megaPutPath, ...megaPutArgs], { windowsHide: true })
        : spawn(megaPutPath, megaPutArgs, { shell: megaPutUseShell, windowsHide: true });

    let megaStderr = '';

    mega.stderr.on('data', (data) => {
        megaStderr += data.toString();
    });

    mega.on('error', async (err) => {
        console.error('[Upload] MEGAcmd spawn error:', err.message);
        await setUploadError(fileId, err.code === 'ENOENT'
            ? 'MEGAcmd not found. Install MEGAcmd and set MEGA_CMD_PATH in .env, or add it to system PATH.'
            : `MEGAcmd failed to start: ${err.message}`);
        await safeUnlink(finalFilePath);
        safeRmUploadDir(uploadDir);
        await redis.del(UPLOAD_META_PREFIX + fileId).catch(() => {});
    });

    mega.on('close', async (code) => {
        if (code !== 0) {
            const errSnippet = megaStderr.trim().slice(-600).replace(/\r?\n/g, ' ') || 'Unknown error';
            console.error(`[Upload] mega-put failed code=${code} stderr=`, megaStderr.trim().slice(-500));
            let userMessage = 'MEGA sync failed.';
            if (/not logged in|login|session|invalid session/i.test(megaStderr)) {
                userMessage = 'MEGAcmd is not logged in. Open MEGAcmd and run: mega-login your@email password';
            } else if (/command not found|not recognized|ENOENT/i.test(megaStderr)) {
                userMessage = 'MEGAcmd not found. Install MEGAcmd and set MEGA_CMD_PATH in .env.';
            } else if (errSnippet.length > 0 && errSnippet.length <= 200) {
                userMessage = errSnippet;
            } else if (errSnippet.length > 200) {
                userMessage = errSnippet.slice(-200);
            }
            await setUploadError(fileId, userMessage);
            await safeUnlink(finalFilePath);
            safeRmUploadDir(uploadDir);
            await redis.del(UPLOAD_META_PREFIX + fileId).catch(() => {});
            return;
        }

        // 6. Link generation with path normalization and retry logic
        let remoteFilePath = path.posix.join(remoteFolder, originalName)
            .replace(/\/+/g, '/');
        console.log(`[Upload] Generating link for normalized path: ${remoteFilePath}`);

        let megaLink = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !megaLink) {
            attempts++;
            await new Promise(r => setTimeout(r, 3000 * attempts));

            megaLink = await new Promise((resolveExport) => {
                const rawPath = getMegaCmdPath('mega-export');
                const megaExportPath = process.platform === 'win32'
                    ? `"${String(rawPath).replace(/"/g, '""')}"`
                    : rawPath;
                const quotedRemotePath = `"${remoteFilePath.replace(/"/g, '""')}"`;
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[Upload] Running: ${megaExportPath} -a ${quotedRemotePath}`);
                }
                const exporter = spawn(megaExportPath, ['-a', quotedRemotePath], {
                    shell: true,
                    windowsHide: true
                });
                let out = '';
                exporter.stdout.on('data', (d) => { out += d.toString(); });
                exporter.stderr.on('data', (d) => { out += d.toString(); });
                exporter.on('close', () => {
                    const match = out.match(/https:\/\/mega\.nz\/file\/[^\s'"]+/);
                    if (match) resolveExport(match[0].trim());
                    else {
                        console.warn(`[Upload] Export attempt ${attempts} output: ${out.trim().slice(-300)}`);
                        resolveExport(null);
                    }
                });
            });
        }

        if (megaLink) console.log(`[Upload] Link generated: ${megaLink}`);
        else console.error(`[Upload] Link generation failed after retries`);

        try {
            if (megaLink) {
                const data = { sectionType, metadata, totalSize: meta.totalSize, wrappedKey, masterIV };
                const savedFile = await saveFileAndInvalidateCache({ user, data, megaLink, remoteFilePath });
                const fileObj = savedFile.toObject ? savedFile.toObject() : savedFile;
                await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'completed', file: fileObj }), 'EX', UPLOAD_STATUS_TTL);
            } else {
                await setUploadError(fileId, 'Upload succeeded but link generation failed.');
            }
        } catch (err) {
            console.error('[Upload] DB/Post-process Error:', err.message);
            await setUploadError(fileId, err.message);
        } finally {
            await safeUnlink(finalFilePath);
            safeRmUploadDir(uploadDir);
            await redis.del(UPLOAD_META_PREFIX + fileId).catch(() => {});
        }
    });
}

const uploadFile = async (req, res) => {
    let responded = false;
    const safeSend = (status, body) => {
        if (responded) return;
        responded = true;
        res.status(status).json(body);
    };

    const uploadData = {};
    const busboy = Busboy({ headers: req.headers });

    busboy.on('field', (name, value) => {
        if (name === 'metadata') {
            try { uploadData.metadata = JSON.parse(value); } catch (e) { uploadData.metadata = null; }
        } else if (name === 'isLastChunk') {
            uploadData.isLastChunk = (value === 'true' || value === true);
        } else {
            uploadData[name] = value;
        }
    });

    busboy.on('file', (fieldname, fileStream) => {
        const { fileId, chunkId } = uploadData;
        if (!fileId || chunkId === undefined) {
            fileStream.resume();
            return;
        }

        fs.mkdirSync(TEMP_DIR, { recursive: true });
        const safeId = String(fileId).replace(/[^a-zA-Z0-9-_]/g, '_');
        const tempPath = path.join(TEMP_DIR, `chunk_${safeId}_${chunkId}.tmp`);
        const writeStream = fs.createWriteStream(tempPath);
        fileStream.pipe(writeStream);

        writeStream.on('finish', async () => {
            if (uploadData.metadata && uploadData.sectionType) {
                const metaPayload = {
                    totalSize: uploadData.totalSize,
                    sectionType: uploadData.sectionType,
                    metadata: uploadData.metadata,
                    wrappedKey: uploadData.wrappedKey,
                    masterIV: uploadData.masterIV,
                    userEmail: req.user?.sub?.toLowerCase().trim() || ''
                };
                await redis.set(UPLOAD_META_PREFIX + fileId, JSON.stringify(metaPayload), 'EX', UPLOAD_META_TTL);
            }

            if (uploadData.isLastChunk) {
                safeSend(202, { status: 'processing', fileId });
                setTimeout(() => reassembleAndMegaPut(fileId), 200);
            } else {
                safeSend(200, { message: 'Chunk Staged' });
            }
        });
    });

    req.pipe(busboy);
};

async function saveFileAndInvalidateCache({ user, data, megaLink, remoteFilePath }) {
    const fileType = SECTION_TO_FILE_TYPE[data.sectionType] || 'private';
    const wrappedKeyArr = data.wrappedKey ? Array.from(Buffer.from(data.wrappedKey, 'base64')) : [];
    const masterIVArr = data.masterIV ? Array.from(Buffer.from(data.masterIV, 'base64')) : [];

    const newFile = await File.create({
        user: user._id,
        name: data.metadata.name,
        originalName: data.metadata.name,
        size: data.metadata.size ?? data.totalSize,
        mimeType: data.metadata.type || 'application/octet-stream',
        fileType,
        url: megaLink,
        remotePath: remoteFilePath,
        security: {
            wrappedKey: wrappedKeyArr,
            masterIV: masterIVArr.length ? masterIVArr : undefined
        }
    });

    const userIdString = user._id.toString();
    await cacheMethods.del(userIdString);

    try {
        await redisService.addFileToRecent(userIdString, newFile.toObject(), data.sectionType || 'Private');
    } catch (err) {
        console.error('[RecentFiles] Error:', err.message);
    }

    notifyClients({ type: 'REFRESH_FILES', userId: userIdString, section: data.sectionType });

    return newFile;
}

async function getUploadStatus(req, res) {
    const { fileId } = req.params;
    try {
        const raw = await redis.get(UPLOAD_STATUS_PREFIX + fileId);
        if (!raw) return res.json({ status: 'processing', message: 'Finalizing...' });
        return res.json(JSON.parse(raw));
    } catch (err) {
        return res.status(500).json({ status: 'error', error: err.message });
    }
}

module.exports = {
    uploadFile,
    getUploadStatus,
    saveFileAndInvalidateCache,
    UPLOAD_STATUS_PREFIX,
    UPLOAD_STATUS_TTL
};
