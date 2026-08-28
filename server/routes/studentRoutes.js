const express = require('express');
const studentController = require('../controllers/studentController');
const authenticate = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply global gates to restrict endpoints to matching STUDENT roles
router.use(authenticate);
router.use(requireRole(['STUDENT']));

router.get('/courses', studentController.getCourses);
router.get('/questions', studentController.listQuestions);
router.get('/feedback/status/:courseId', studentController.getStatus);
router.post('/feedback/submit', studentController.submitFeedback);
router.get('/history', studentController.getHistory);

module.exports = router;
