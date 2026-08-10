const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');
const authMiddleware = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authMiddleware);
router.post('/upload', upload.single('file'), importController.parseDocumentFile);

module.exports = router;
