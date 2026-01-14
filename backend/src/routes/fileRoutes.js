const express = require('express');
const router = express.Router();

const upload = require('../config/multer');

const requireAuth = require('../middleware/requireAuth');

const { uploadFile } = require('../controllers/files/fileController');
const { getAllFiles } = require('../controllers/files/dashboardController');
const { streamFile } = require('../controllers/files/streamController');
const { deleteFile } = require('../controllers/files/deleteController');

// upload route
// you can acess this api by going to "http://localhost:5000/api/files/upload"
router.post('/upload', requireAuth, upload.array('files', 5), uploadFile);

// dashboard route to see user list of data
// you can acess this api by going to "http://localhost:5000/api/files/dashboard"
router.get('/dashboard', requireAuth, getAllFiles);

// stream route to see user data
// you can acess this api by going to "http://localhost:5000/api/files/stream"
router.get('/stream/:id', requireAuth, streamFile);

// delete route to delete user data
// you can acess this api by going to "http://localhost:5000/api/files/:id"
router.delete('/:id', requireAuth, deleteFile);

module.exports = router;
