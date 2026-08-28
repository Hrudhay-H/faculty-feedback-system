const express = require('express');
const facultyController = require('../controllers/facultyController');
const authenticate = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['FACULTY']));

// Dashboard summary
router.get('/summary', facultyController.getSummary);

// Courses list with aggregated stats
router.get('/courses', facultyController.getCourses);

// Full analytics for one course
router.get('/courses/:courseId/analytics', facultyController.getCourseAnalytics);

// Global (all courses) analytics endpoints
router.get('/analytics/distribution', facultyController.getRatingDistribution);
router.get('/analytics/questions', facultyController.getQuestionAverages);
router.get('/analytics/performance', facultyController.getCoursePerformance);
router.get('/analytics/trends', facultyController.getSemesterTrends);
router.get('/analytics/comments', facultyController.getComments);

module.exports = router;
