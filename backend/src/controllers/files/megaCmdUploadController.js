const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getMegaCmdPath } = require('../../utils/megaCmdPath');

const REMOTE_FOLDER = process.env.MEGA_CMD_REMOTE_PATH || '/MyUploads/';
const CHUNK_TEMP_DIR = path.join(__dirname, 'temp_uploads');

/**
 * Hand off the assembled file to MEGAcmd (mega-put). MEGAcmd can use multiple upload connections
 * (e.g. speedlimit --upload-connections 6) to upload the file in parallel. Cleans up the temp file after.
 */
function handleMegaHandOff(localPath, res, fileId = '') {
    const megaPutPath = getMegaCmdPath('mega-put');
    const resolved = path.resolve(localPath);
    const quotedPath = '"' + resolved.replace(/"/g, '""') + '"';
    const mega = spawn(megaPutPath, [quotedPath, REMOTE_FOLDER], { shell: true });
    let errorData = '';

    mega.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    mega.on('close', (code) => {
        try {
            fs.unlinkSync(localPath);
        } catch (e) {
            console.error('[MEGAcmd Chunk] Cleanup error:', e.message);
        }

        if (code === 0) {
            console.log(`[MEGAcmd Chunk] Uploaded to MEGA: ${fileId || localPath}`);
            return res.status(200).json({ status: 'completed', fileId: fileId || null });
        }
        console.error(`[MEGAcmd Chunk] Transfer failed (${code}): ${errorData}`);
        return res.status(500).json({ status: 'error', details: errorData || `Exit code ${code}` });
    });

    mega.on('error', (err) => {
        try {
            fs.unlinkSync(localPath);
        } catch (_) {}
        console.error('[MEGAcmd Chunk] Spawn error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ status: 'error', details: err.message });
        }
    });
}

/**
 * Store file to disk (via multer), then send to MEGA using MEGAcmd (mega-put).
 * Upload runs in a child process so it doesn't block the API; response is sent after MEGAcmd finishes.
 */
async function uploadFileMegaCmd(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const localPath = path.resolve(req.file.path);

    console.log(`[MEGAcmd] Uploading ${req.file.originalname} to MEGA...`);

    const megaPutPath = getMegaCmdPath('mega-put');
    const quotedPath = '"' + localPath.replace(/"/g, '""') + '"';
    const mega = spawn(megaPutPath, [quotedPath, REMOTE_FOLDER], { shell: true });

    let errorData = '';

    mega.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    mega.on('close', (code) => {
        fs.unlink(localPath, (err) => {
            if (err) console.error('[MEGAcmd] Cleanup error:', err.message);
        });

        if (code === 0) {
            console.log(`[MEGAcmd] Success: ${req.file.originalname}`);
            return res.status(200).json({ message: 'Success!', filename: req.file.originalname });
        }

        console.error(`[MEGAcmd] Exit code ${code}: ${errorData}`);
        return res.status(500).json({
            error: 'MEGAcmd transfer failed',
            details: errorData || `Exit code ${code}`
        });
    });

    mega.on('error', (err) => {
        fs.unlink(localPath, () => {});
        console.error('[MEGAcmd] Spawn error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'MEGAcmd not available', details: err.message });
        }
    });
}

/**
 * Collect encrypted chunks: write each at the exact offset from the frontend so chunks assemble
 * in the right order even if they arrive out of order. Uses fs.open (r+ or w) + fs.write at offset.
 * When isLastChunk is true, hands off the complete file to MEGAcmd via handleMegaHandOff.
 * Expects: body fileId, chunkIndex, offset, isLastChunk; file field name 'chunkData'.
 */
function uploadChunkMegaCmd(req, res) {
    const { fileId, chunkIndex, offset, isLastChunk } = req.body;

    if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: 'No chunk data received.' });
    }
    if (!fileId || chunkIndex === undefined || chunkIndex === '') {
        return res.status(400).json({ message: 'Missing fileId or chunkIndex.' });
    }

    const writeOffset = offset != null && offset !== '' ? parseInt(offset, 10) : 0;
    if (isNaN(writeOffset) || writeOffset < 0) {
        return res.status(400).json({ message: 'Invalid offset.' });
    }

    const safeFileId = String(fileId).replace(/[^a-zA-Z0-9-_]/g, '_');
    if (!fs.existsSync(CHUNK_TEMP_DIR)) {
        fs.mkdirSync(CHUNK_TEMP_DIR, { recursive: true });
    }

    const filePath = path.join(CHUNK_TEMP_DIR, `${safeFileId}.enc`);
    const mode = fs.existsSync(filePath) ? 'r+' : 'w';

    fs.open(filePath, mode, (err, fd) => {
        if (err) {
            console.error('[MEGAcmd Chunk] File open error:', err.message);
            return res.status(500).json({ message: 'File open error', error: err.message });
        }

        const buffer = req.file.buffer;
        fs.write(fd, buffer, 0, buffer.length, writeOffset, (writeErr) => {
            fs.close(fd, () => {
                if (writeErr) {
                    console.error('[MEGAcmd Chunk] Write error:', writeErr.message);
                    return res.status(500).json({ message: 'Write error', error: writeErr.message });
                }

                if (isLastChunk === 'true' || isLastChunk === true) {
                    console.log(`[MEGAcmd Chunk] File ${fileId} complete. Handing to MEGAcmd...`);
                    handleMegaHandOff(filePath, res, fileId);
                } else {
                    res.status(200).json({ message: `Chunk ${chunkIndex} saved at ${writeOffset}` });
                }
            });
        });
    });
}

module.exports = { uploadFileMegaCmd, uploadChunkMegaCmd };
