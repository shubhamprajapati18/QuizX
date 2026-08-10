const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/auth');

// Public route for students to join quiz by code
router.get('/public/code/:quizCode', quizController.getQuizByCodePublic);

// Faculty Authenticated routes
router.use(authMiddleware);

router.get('/dashboard-stats', quizController.getFacultyDashboardStats);
router.get('/', quizController.getFacultyQuizzes);
router.get('/:id', quizController.getQuizById);
router.post('/', quizController.createQuiz);
router.put('/:id', quizController.updateQuiz);
router.post('/:id/duplicate', quizController.duplicateQuiz);
router.patch('/:id/publish', quizController.toggleQuizPublishStatus);
router.delete('/:id', quizController.deleteQuiz);

module.exports = router;
