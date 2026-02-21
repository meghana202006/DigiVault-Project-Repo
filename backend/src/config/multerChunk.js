const multer = require('multer');

/**
 * In-memory upload for a single encrypted chunk (field name: chunkData).
 * Controller writes at offset so chunk order cannot get messed up; limit per chunk e.g. 25MB.
 */
const uploadChunk = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }
});

module.exports = uploadChunk;
