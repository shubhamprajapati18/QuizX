const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');

// Public routes for student quiz taking
router.post('/start', attemptController.startAttempt);
router.get('/:attemptId/active', attemptController.getActiveAttempt);
router.post('/:attemptId/save-response', attemptController.saveResponse);
router.post('/:attemptId/sync-batch', attemptController.syncBatch);
router.post('/:attemptId/submit', attemptController.submitAttempt);
router.get('/:attemptId/result', attemptController.getStudentResult);

module.exports = router;
