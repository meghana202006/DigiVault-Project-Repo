const express = require('express');
const router = express.Router();

const upload = require('../config/multer');
const requireAuth = require('../middleware/requireAuth');
const { uploadFile } = require('../controllers/files/fileController');
const { getAllFiles } = require('../controllers/files/dashboardController');

// upload route
// you can acess this api by going to "http://localhost:5000/api/files/upload"
router.post('/upload', requireAuth, upload.array('files', 5), uploadFile);

// dashboard route to see user list of data
// you can acess this api by going to "http://localhost:5000/api/files/dashboard"
router.post('/dashboard', requireAuth, getAllFiles);


module.exports = router;
