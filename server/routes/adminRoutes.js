const express = require('express');
const adminController = require('../controllers/adminController');
const analyticsController = require('../controllers/adminAnalyticsController');
const { validateBody } = require('../middleware/validationMiddleware');
const authenticate = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const {
  studentCreateSchema,
  studentUpdateSchema,
  facultyCreateSchema,
  facultyUpdateSchema,
  courseCreateSchema,
  courseUpdateSchema,
  enrollmentCreateSchema,
  questionCreateSchema,
  questionUpdateSchema,
  windowCreateSchema
} = require('../controllers/adminValidation');

const router = express.Router();

// Apply global gates to protect all Admin routes
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// 1. Stats Summary
router.get('/stats', adminController.getStats);

// 2. Student Registry CRUD
router.get('/students', adminController.listStudents);
router.post('/students', validateBody(studentCreateSchema), adminController.addStudent);
router.put('/students/:id', validateBody(studentUpdateSchema), adminController.editStudent);
router.delete('/students/:id', adminController.removeStudent);

// 3. Faculty Registry CRUD
router.get('/faculties', adminController.listFaculties);
router.post('/faculties', validateBody(facultyCreateSchema), adminController.addFaculty);
router.put('/faculties/:id', validateBody(facultyUpdateSchema), adminController.editFaculty);
router.delete('/faculties/:id', adminController.removeFaculty);

// 4. Course Management CRUD
router.get('/courses', adminController.listCourses);
router.post('/courses', validateBody(courseCreateSchema), adminController.addCourse);
router.put('/courses/:id', validateBody(courseUpdateSchema), adminController.editCourse);
router.delete('/courses/:id', adminController.removeCourse);

// 5. Enrollments mapping
router.get('/enrollments', adminController.listEnrollments);
router.post('/enrollments', validateBody(enrollmentCreateSchema), adminController.addEnrollment);
router.delete('/enrollments/:id', adminController.removeEnrollment);

// 6. Feedback Questions Bank
router.get('/questions', adminController.listQuestions);
router.post('/questions', validateBody(questionCreateSchema), adminController.addQuestion);
router.put('/questions/:id', validateBody(questionUpdateSchema), adminController.editQuestion);
router.delete('/questions/:id', adminController.removeQuestion);

// 7. Active Feedback Windows
router.get('/windows', adminController.listWindows);
router.post('/windows', validateBody(windowCreateSchema), adminController.addWindow);
router.put('/windows/:id', validateBody(windowCreateSchema), adminController.editWindow);
router.delete('/windows/:id', adminController.removeWindow);

// 8. System-wide Analytics (Phase 7)
router.get('/analytics/headline', analyticsController.getHeadlineMetrics);
router.get('/analytics/trends', analyticsController.getSemesterTrends);
router.get('/analytics/departments', analyticsController.getDepartmentAverages);
router.get('/analytics/faculty', analyticsController.getFacultyPerformance);
router.get('/analytics/courses', analyticsController.getCoursePerformance);
router.get('/analytics/distribution', analyticsController.getRatingDistribution);
router.get('/analytics/filters', analyticsController.getFilterOptions);

module.exports = router;

