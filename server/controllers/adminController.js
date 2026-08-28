const adminService = require('../services/adminService');

const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getSystemStats();
    res.status(200).json({ success: true, message: 'Stats compiled successfully', data: stats });
  } catch (err) {
    next(err);
  }
};

// Students
const listStudents = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const data = await adminService.getStudents({
      search: search || '',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.status(200).json({ success: true, message: 'Students list fetched', data });
  } catch (err) {
    next(err);
  }
};

const addStudent = async (req, res, next) => {
  try {
    const student = await adminService.createStudent(req.body);
    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (err) {
    next(err);
  }
};

const editStudent = async (req, res, next) => {
  try {
    const student = await adminService.updateStudent(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Student updated successfully', data: student });
  } catch (err) {
    next(err);
  }
};

const removeStudent = async (req, res, next) => {
  try {
    await adminService.deleteStudent(req.params.id);
    res.status(200).json({ success: true, message: 'Student deleted successfully', data: null });
  } catch (err) {
    next(err);
  }
};

// Faculty
const listFaculties = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const data = await adminService.getFaculties({
      search: search || '',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.status(200).json({ success: true, message: 'Faculty list fetched', data });
  } catch (err) {
    next(err);
  }
};

const addFaculty = async (req, res, next) => {
  try {
    const faculty = await adminService.createFaculty(req.body);
    res.status(201).json({ success: true, message: 'Faculty created successfully', data: faculty });
  } catch (err) {
    next(err);
  }
};

const editFaculty = async (req, res, next) => {
  try {
    const faculty = await adminService.updateFaculty(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Faculty updated successfully', data: faculty });
  } catch (err) {
    next(err);
  }
};

const removeFaculty = async (req, res, next) => {
  try {
    await adminService.deleteFaculty(req.params.id);
    res.status(200).json({ success: true, message: 'Faculty deleted successfully', data: null });
  } catch (err) {
    next(err);
  }
};

// Courses
const listCourses = async (req, res, next) => {
  try {
    const { search, semester, page, limit } = req.query;
    const data = await adminService.getCourses({
      search: search || '',
      semester: semester || '',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.status(200).json({ success: true, message: 'Courses list fetched', data });
  } catch (err) {
    next(err);
  }
};

const addCourse = async (req, res, next) => {
  try {
    const course = await adminService.createCourse(req.body);
    res.status(201).json({ success: true, message: 'Course created successfully', data: course });
  } catch (err) {
    next(err);
  }
};

const editCourse = async (req, res, next) => {
  try {
    const course = await adminService.updateCourse(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Course updated successfully', data: course });
  } catch (err) {
    next(err);
  }
};

const removeCourse = async (req, res, next) => {
  try {
    await adminService.deleteCourse(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted successfully', data: null });
  } catch (err) {
    next(err);
  }
};

// Enrollments
const listEnrollments = async (req, res, next) => {
  try {
    const { courseId, studentId, page, limit } = req.query;
    const data = await adminService.getEnrollments({
      courseId: courseId || '',
      studentId: studentId || '',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 15
    });
    res.status(200).json({ success: true, message: 'Enrollments list fetched', data });
  } catch (err) {
    next(err);
  }
};

const addEnrollment = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.body;
    const enrollment = await adminService.createEnrollment(studentId, courseId);
    res.status(201).json({ success: true, message: 'Student enrolled successfully', data: enrollment });
  } catch (err) {
    next(err);
  }
};

const removeEnrollment = async (req, res, next) => {
  try {
    await adminService.deleteEnrollment(req.params.id);
    res.status(200).json({ success: true, message: 'Student removed from course successfully', data: null });
  } catch (err) {
    next(err);
  }
};

// Questions
const listQuestions = async (req, res, next) => {
  try {
    const data = await adminService.getQuestions();
    res.status(200).json({ success: true, message: 'Questions list fetched', data });
  } catch (err) {
    next(err);
  }
};

const addQuestion = async (req, res, next) => {
  try {
    const q = await adminService.createQuestion(req.body.text);
    res.status(201).json({ success: true, message: 'Question created successfully', data: q });
  } catch (err) {
    next(err);
  }
};

const editQuestion = async (req, res, next) => {
  try {
    const q = await adminService.updateQuestion(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Question updated successfully', data: q });
  } catch (err) {
    next(err);
  }
};

const removeQuestion = async (req, res, next) => {
  try {
    await adminService.deleteQuestion(req.params.id);
    res.status(200).json({ success: true, message: 'Question deleted successfully', data: null });
  } catch (err) {
    next(err);
  }
};

// Windows
const listWindows = async (req, res, next) => {
  try {
    const data = await adminService.getWindows();
    res.status(200).json({ success: true, message: 'Windows list fetched', data });
  } catch (err) {
    next(err);
  }
};

const addWindow = async (req, res, next) => {
  try {
    const w = await adminService.createWindow(req.body);
    res.status(201).json({ success: true, message: 'Feedback window created', data: w });
  } catch (err) {
    next(err);
  }
};

const editWindow = async (req, res, next) => {
  try {
    const w = await adminService.updateWindow(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Feedback window updated', data: w });
  } catch (err) {
    next(err);
  }
};

const removeWindow = async (req, res, next) => {
  try {
    await adminService.deleteWindow(req.params.id);
    res.status(200).json({ success: true, message: 'Feedback window deleted', data: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  listStudents,
  addStudent,
  editStudent,
  removeStudent,
  listFaculties,
  addFaculty,
  editFaculty,
  removeFaculty,
  listCourses,
  addCourse,
  editCourse,
  removeCourse,
  listEnrollments,
  addEnrollment,
  removeEnrollment,
  listQuestions,
  addQuestion,
  editQuestion,
  removeQuestion,
  listWindows,
  addWindow,
  editWindow,
  removeWindow
};
