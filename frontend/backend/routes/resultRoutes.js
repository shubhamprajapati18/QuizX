const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', resultController.getFacultyResults);
router.get('/submission/:attemptId', resultController.getSubmissionDetail);
router.get('/analytics/:quizId', resultController.getQuizAnalytics);

module.exports = router;
