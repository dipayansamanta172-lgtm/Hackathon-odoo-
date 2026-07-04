const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Mount upload endpoint
router.post('/', authMiddleware, upload.single('file'), uploadController.uploadFile);

module.exports = router;
