const multer = require('multer');
const storage = multer.memoryStorage();

const fileFilter = (req,file,cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|pdf|plain/;
    const isMimeValid = allowedTypes.test(file.mimetype);

    if (isMimeValid) {
        cb(null,true);
    } else {
        cb(new Error('Unsupported file type! only Image, videos, and pdf are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
        fieldSize: 10 * 1024 * 1024, // 10MB for other fields
    },
    fileFilter: fileFilter
});

module.exports = upload;