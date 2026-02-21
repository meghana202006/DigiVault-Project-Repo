const express = require('express');
const router = express.Router();

const upload = require('../config/multer');
const uploadMegaCmd = require('../config/multerMegaCmd');
const uploadChunk = require('../config/multerChunk');

const requireAuth = require('../middleware/requireAuth');

const { uploadFile, getUploadStatus } = require('../controllers/files/fileController');
const { uploadFileMegaCmd, uploadChunkMegaCmd } = require('../controllers/files/megaCmdUploadController');
const { getAllFiles } = require('../controllers/files/dashboardController');
const { streamFile } = require('../controllers/files/streamController');
const { deleteFile } = require('../controllers/files/deleteController');
const { createFolder } = require('../controllers/files/folderControllers/createFolderController');
const { getFolders } = require('../controllers/files/folderControllers/getFoldersController');
const { checkFolderExists } = require('../controllers/files/folderControllers/checkFolderExistsController');
const { deleteFolder } = require('../controllers/files/folderControllers/deleteFolderController');
const { getRecentFiles, getGlobalRecentFiles } = require('../controllers/files/recentFilesController');

// upload route (chunked: save to disk, reassemble on last chunk, then MEGAcmd mega-put)
// http://localhost:5000/api/files/upload
router.post('/upload', requireAuth, uploadFile);

// upload via MEGAcmd: store to disk then mega-put (single file, parallel transfer)
// http://localhost:5000/api/files/upload-mega-cmd
router.post('/upload-mega-cmd', requireAuth, uploadMegaCmd.single('file'), uploadFileMegaCmd);

// encrypted chunked upload: write each chunk at offset (order-safe), then hand off to MEGAcmd on last chunk
// body: fileId, chunkIndex, offset, isLastChunk; file field: chunkData
// http://localhost:5000/api/files/upload-chunk
router.post('/upload-chunk', requireAuth, uploadChunk.single('chunkData'), uploadChunkMegaCmd);

// dashboard route to see user list of data
// you can acess this api by going to "http://localhost:5000/api/files/dashboard"
router.get('/dashboard', requireAuth, getAllFiles);

// stream route to see user data
// you can acess this api by going to "http://localhost:5000/api/files/stream"
router.get('/stream/:id', requireAuth, streamFile);

// upload status (polling) - must be before /:id
// GET http://localhost:5000/api/files/status/:fileId
router.get('/status/:fileId', requireAuth, getUploadStatus);

// delete route to delete user data
// you can acess this api by going to "http://localhost:5000/api/files/:id"
router.delete('/:id', requireAuth, deleteFile);

// create folder route to create a new folder
// you can acess this api by going to "http://localhost:5000/api/files/create-folder"
router.post('/create-folder', requireAuth, createFolder);

// get folders route to get folders for a section
// you can acess this api by going to "http://localhost:5000/api/files/folders?sectionType=document"
router.get('/folders', requireAuth, getFolders);

// check folder exists route to check if folder name already exists
// you can acess this api by going to "http://localhost:5000/api/files/check-folder?name=foldername&sectionType=document"
router.get('/check-folder', requireAuth, checkFolderExists);

// delete folder route to delete a folder
// you can access this api by going to "http://localhost:5000/api/files/folder/:id"
router.delete('/folder/:id', requireAuth, deleteFolder);

// recent files route - fetches from Redis sorted sets (user-specific, 10 most recent)
// GET http://localhost:5000/api/files/recent?section=document&limit=10
router.get('/recent', requireAuth, getRecentFiles);

// global recent files route (across all users, for admin/public)
// GET http://localhost:5000/api/files/recent-global?section=document&limit=10
router.get('/recent-global', getGlobalRecentFiles);

module.exports = router;
