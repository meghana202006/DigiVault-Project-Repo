const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../controllers/temp_uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '') || '';
        const safe = (uniqueSuffix + ext).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, safe);
    }
});

const uploadMegaCmd = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 600 }
});

module.exports = uploadMegaCmd;
