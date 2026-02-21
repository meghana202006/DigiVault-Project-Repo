const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const Busboy = require('busboy');
const File = require('../../models/file');
const User = require('../../models/userModel');
const { cacheMethods, redis } = require('../../utils/redisCache');
const redisService = require('../../utils/redisService');

const SECTION_TO_FILE_TYPE = { 'Documents': 'document', 'Images': 'image', 'Videos': 'video', 'Audio': 'audio', 'Private': 'private' };

const TEMP_DIR = path.join(__dirname, '../temp');
const UPLOAD_META_PREFIX = 'upload:meta:';
const UPLOAD_META_TTL = 3600;
const UPLOAD_STATUS_PREFIX = 'upload:status:';
const UPLOAD_STATUS_TTL = 300;

const { getMegaCmdPath } = require('../../utils/megaCmdPath');

/**
 * Reassemble all chunks for fileId into one file, then hand off to MEGAcmd (mega-put).
 * Uses 6-connection MEGAcmd engine. Runs in background after last chunk is saved.
 */
async function reassembleAndMegaPut(fileId) {
    const safeFileId = String(fileId).replace(/[^a-zA-Z0-9-_]/g, '_');

    let metaRaw;
    try {
        metaRaw = await redis.get(UPLOAD_META_PREFIX + fileId);
    } catch (e) {
        console.error('[Upload] Redis get meta error:', e.message);
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: 'Failed to read metadata' }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }

    if (!metaRaw) {
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: 'Upload metadata not found' }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }

    let meta;
    try {
        meta = JSON.parse(metaRaw);
    } catch (e) {
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: 'Invalid metadata' }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }

    const { sectionType, metadata, wrappedKey, masterIV, userEmail } = meta;

    let user;
    try {
        user = await User.findOne({ email: (userEmail || '').toLowerCase().trim() }).select('_id megaStorage');
    } catch (e) {
        console.error('[Upload] User lookup error:', e.message);
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: 'User lookup failed' }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }
    if (!user) {
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: 'User not found for path construction' }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }
    if (!user.megaStorage || !user.megaStorage.uuid) {
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: 'User MEGA storage UUID not found' }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }

    const userFolderName = `u_${user.megaStorage.uuid}`;
    const section = (sectionType || 'Private').trim().replace(/^\/+|\/+$/g, '') || 'Private';
    const remoteFolder = `/${userFolderName}/${section}/`;
    console.log(`[Upload] Targeting path: ${remoteFolder}`);

    // Use original filename so MEGA and DB store the correct name (e.g. vacation_video.mp4), not final_uuid.enc
    // Strip Windows-invalid and bracket chars so MEGAcmd can open the path (e.g. avoid trailing ])
    const originalName = (metadata && metadata.name)
        ? path.basename(String(metadata.name)).replace(/[<>:"/\\|?*\[\]]/g, '_').trim() || 'upload.enc'
        : 'upload.enc';
    const finalFilePath = path.join(TEMP_DIR, originalName);

    let chunkFiles;
    try {
        chunkFiles = fs.readdirSync(TEMP_DIR)
            .filter((f) => f.startsWith(`chunk_${safeFileId}_`) && f.endsWith('.tmp'))
            .map((f) => {
                const m = f.match(/chunk_.+_(\d+)\.tmp$/);
                return { path: path.join(TEMP_DIR, f), index: m ? parseInt(m[1], 10) : 0 };
            })
            .sort((a, b) => a.index - b.index);
    } catch (err) {
        console.error('[Upload] List chunks error:', err.message);
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: err.message }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }

    if (chunkFiles.length === 0) {
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: 'No chunks found' }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }

    try {
        if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
        for (const { path: chunkPath } of chunkFiles) {
            fs.appendFileSync(finalFilePath, fs.readFileSync(chunkPath));
            try { fs.unlinkSync(chunkPath); } catch (_) {}
        }
    } catch (err) {
        console.error('[Upload] Reassemble error:', err.message);
        for (const { path: chunkPath } of chunkFiles) {
            try { fs.unlinkSync(chunkPath); } catch (_) {}
        }
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: err.message }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }

    // Ensure file is fully closed and released before MEGAcmd opens it (avoids "Unable to open local path")
    await new Promise((r) => setImmediate(r));

    const localFilePath = path.resolve(finalFilePath);
    if (!fs.existsSync(localFilePath)) {
        console.error('[Upload] Reassembled file missing:', localFilePath);
        await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: 'Reassembled file not found' }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
        return;
    }

    console.log(`[Upload] File ${fileId} assembled as ${originalName}. Handing to MEGAcmd...`);

    await new Promise((resolve) => {
        const megaPutPath = getMegaCmdPath('mega-put');
        // -c: create parent (user folder) and child (section folder) if they don't exist
        // Quote local path so Windows shell doesn't misinterpret spaces/dashes (e.g. NBA-PROJECT-2)
        const quotedLocalPath = '"' + localFilePath.replace(/"/g, '""') + '"';
        const mega = spawn(megaPutPath, ['-c', quotedLocalPath, remoteFolder], { shell: true });

        mega.stdout.on('data', (data) => console.log('[MEGA-PUT]', data.toString().trim()));
        mega.stderr.on('data', (data) => console.error('[MEGA-ERR]', data.toString().trim()));

        mega.on('close', async (code) => {
            if (code !== 0) {
                console.error(`[Upload] MEGAcmd exited with code ${code}`);
                try { fs.unlinkSync(finalFilePath); } catch (_) {}
                await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: `MEGAcmd exited with code ${code}` }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
                return resolve();
            }

            console.log(`[Upload] ${fileId} uploaded to MEGA via MEGAcmd.`);

            // Same nested path for export: /userId/Section/filename
            const remoteFilePath = path.posix.join(remoteFolder.replace(/\/$/, ''), originalName);

            let megaLink = null;
            try {
                megaLink = await new Promise((resLink, rejLink) => {
                    const megaExportPath = getMegaCmdPath('mega-export');
                    const exp = spawn(megaExportPath, ['-a', remoteFilePath], { shell: true });
                    let out = '';
                    exp.stdout.on('data', (d) => { out += d.toString(); });
                    exp.stderr.on('data', (d) => { out += d.toString(); });
                    exp.on('close', () => {
                        const linkMatch = out.match(/https:\/\/mega\.nz\/file\/[^\s#]+(?:\?[^\s#]+)?/);
                        if (linkMatch) resLink(linkMatch[0]);
                        else rejLink(new Error('Link not found in output'));
                    });
                    exp.on('error', rejLink);
                });
            } catch (e) {
                console.warn('[Upload] mega-export failed (link optional):', e.message);
            }

            try {
                fs.unlinkSync(finalFilePath);
            } catch (_) {}

            try {
                if (user && megaLink) {
                    const data = { sectionType: sectionType || 'Private', metadata: metadata || {}, totalSize: meta.totalSize, wrappedKey, masterIV };
                    const savedFile = await saveFileAndInvalidateCache({ user, data, megaLink });
                    // Redis cache (full list + recent10) is already updated in saveFileAndInvalidateCache; clients can refetch when they see status 'completed'
                    const fileObj = savedFile && typeof savedFile.toObject === 'function' ? savedFile.toObject() : savedFile;
                    await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'completed', file: fileObj }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
                } else {
                    await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'completed', file: null }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
                }
            } catch (err) {
                console.error('[Upload] Save to DB error:', err.message);
                await redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: err.message }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
            }
            await redis.del(UPLOAD_META_PREFIX + fileId).catch(() => {});
            resolve();
        });

        mega.on('error', (err) => {
            try { fs.unlinkSync(finalFilePath); } catch (_) {}
            console.error('[Upload] MEGAcmd spawn error:', err.message);
            redis.set(UPLOAD_STATUS_PREFIX + fileId, JSON.stringify({ status: 'error', error: err.message }), 'EX', UPLOAD_STATUS_TTL).catch(() => {});
            resolve();
        });
    });
}

/**
 * Save chunk to disk; store metadata in Redis when present. On last chunk, reassemble and hand off to MEGAcmd in background.
 */
const uploadFile = async (req, res) => {
    let responded = false;
    const safeSend = (status, body) => {
        if (responded) return;
        responded = true;
        try {
            if (!res.headersSent) res.status(status).json(body);
        } catch (e) {
            console.error('safeSend failed:', e.message);
        }
    };

    const uploadData = {};
    try {
        const busboy = Busboy({ headers: req.headers });

        busboy.on('field', (name, value) => {
            if (name === 'fileId') uploadData.fileId = value;
            if (name === 'chunkId') uploadData.chunkId = value;
            if (name === 'isLastChunk') uploadData.isLastChunk = value === 'true';
            if (name === 'totalSize') uploadData.totalSize = value;
            if (name === 'sectionType') uploadData.sectionType = value;
            if (name === 'metadata') {
                try {
                    uploadData.metadata = value ? JSON.parse(value) : null;
                } catch (_) {
                    uploadData.metadata = null;
                }
            }
            if (name === 'wrappedKey') uploadData.wrappedKey = value;
            if (name === 'masterIV') uploadData.masterIV = value;
        });

        busboy.on('file', (fieldname, fileStream) => {
            const { fileId, chunkId, totalSize } = uploadData;

            if (!fileId || chunkId === undefined || chunkId === '') {
                fileStream.resume();
                safeSend(400, { message: 'Missing fileId or chunkId' });
                return;
            }

            const chunkIdNum = parseInt(chunkId, 10);
            if (isNaN(chunkIdNum) || chunkIdNum < 0) {
                fileStream.resume();
                safeSend(400, { message: 'Invalid chunkId' });
                return;
            }

            fs.mkdirSync(TEMP_DIR, { recursive: true });
            const safeFileId = String(fileId).replace(/[^a-zA-Z0-9-_]/g, '_');
            const tempPath = path.join(TEMP_DIR, `chunk_${safeFileId}_${chunkIdNum}.tmp`);
            const writeStream = fs.createWriteStream(tempPath);

            fileStream.pipe(writeStream);

            fileStream.on('error', (err) => {
                try { fs.unlinkSync(tempPath); } catch (_) {}
                safeSend(500, { message: 'Chunk stream error', error: err.message });
            });
            writeStream.on('error', (err) => {
                try { fs.unlinkSync(tempPath); } catch (_) {}
                safeSend(500, { message: 'Write error', error: err.message });
            });

            writeStream.on('finish', () => {
                const isLastChunk = uploadData.isLastChunk === true || uploadData.isLastChunk === 'true';

                if (uploadData.metadata && uploadData.sectionType) {
                    redis.set(
                        UPLOAD_META_PREFIX + fileId,
                        JSON.stringify({
                            totalSize: totalSize != null && totalSize !== '' ? parseInt(totalSize, 10) : undefined,
                            sectionType: uploadData.sectionType,
                            metadata: uploadData.metadata,
                            wrappedKey: uploadData.wrappedKey,
                            masterIV: uploadData.masterIV,
                            userEmail: (req.user && req.user.sub) ? String(req.user.sub).toLowerCase().trim() : ''
                        }),
                        'EX',
                        UPLOAD_META_TTL
                    ).catch((err) => console.error('[Upload] Redis meta set error:', err.message));
                }

                if (isLastChunk) {
                    safeSend(202, { status: 'processing', message: 'Data received, finalizing...', fileId });
                    setImmediate(() => reassembleAndMegaPut(fileId));
                } else {
                    safeSend(200, { message: 'Chunk staged on server' });
                }
            });
        });

        busboy.on('error', (err) => {
            safeSend(400, { message: 'Upload parse error', error: err.message });
        });

        req.on('error', () => busboy.destroy());
        req.on('aborted', () => busboy.destroy());

        req.pipe(busboy);
    } catch (err) {
        console.error('[Upload] Handler error:', err);
        safeSend(500, { message: 'Upload error', error: err.message });
    }
};

const RECENT10_KEY_SUFFIX = ':recent10';

async function saveFileAndInvalidateCache({ user, data, megaLink }) {
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
        security: {
            wrappedKey: wrappedKeyArr,
            masterIV: masterIVArr.length ? masterIVArr : undefined
        }
    });

    const userIdString = user._id.toString();
    // New file in same shape as dashboard cache (no url) for prepending to cache
    let newFileForCache;
    try {
        const doc = await File.findById(newFile._id).select('-url -key').lean();
        newFileForCache = doc;
    } catch (e) {
        newFileForCache = null;
    }

    try {
        if (newFileForCache) {
            // Update full list cache: prepend new file instead of invalidating
            const cached = await cacheMethods.get(userIdString);
            if (cached !== null && Array.isArray(cached)) {
                cached.unshift(newFileForCache);
                await cacheMethods.set(userIdString, cached);
                console.log(`[Cache] Prepend new file to list (${cached.length} files) for user: ${userIdString}`);
            } else {
                await cacheMethods.del(userIdString);
                console.log(`[Cache] No list in cache; invalidated for user: ${userIdString}`);
            }

            // Update recent10 cache: drop last of 10, add new at front
            const recent10 = await cacheMethods.get(userIdString + RECENT10_KEY_SUFFIX);
            if (recent10 !== null && Array.isArray(recent10)) {
                const updated = [newFileForCache, ...recent10];
                if (updated.length > 10) updated.pop();
                await cacheMethods.set(userIdString + RECENT10_KEY_SUFFIX, updated);
                console.log(`[Cache] Updated recent10 for user: ${userIdString} (dropped last, added new)`);
            } else {
                await cacheMethods.set(userIdString + RECENT10_KEY_SUFFIX, [newFileForCache]);
                console.log(`[Cache] Set recent10 to [new file] for user: ${userIdString}`);
            }
        } else {
            await cacheMethods.del(userIdString);
            await cacheMethods.del(userIdString + RECENT10_KEY_SUFFIX);
            console.log(`[Cache] Invalidated file + recent10 cache for user: ${userIdString}`);
        }
    } catch (cacheError) {
        console.error('[Cache] Error updating cache after upload:', cacheError);
        // Invalidate so next dashboard request gets fresh data from DB instead of stale cache
        try {
            await cacheMethods.del(userIdString);
            await cacheMethods.del(userIdString + RECENT10_KEY_SUFFIX);
            console.log(`[Cache] Invalidated file + recent10 after error for user: ${userIdString}`);
        } catch (delErr) {
            console.error('[Cache] Invalidation after error failed:', delErr);
        }
    }

    // Add to global/section/user recent files lists (sorted sets, auto-trims to 10)
    try {
        await redisService.addFile(newFile, fileType, userIdString);
    } catch (recentError) {
        console.error('[RecentFiles] Error adding to recent files:', recentError);
    }

    return newFile;
}

async function getUploadStatus(req, res) {
    const { fileId } = req.params;
    if (!fileId) {
        return res.status(400).json({ status: 'error', error: 'fileId required' });
    }
    try {
        const raw = await redis.get(UPLOAD_STATUS_PREFIX + fileId);
        if (!raw) {
            return res.json({ status: 'processing', message: 'Finalizing on cloud...' });
        }
        const data = JSON.parse(raw);
        return res.json(data);
    } catch (err) {
        console.error('[Upload] Status check error:', err.message);
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
