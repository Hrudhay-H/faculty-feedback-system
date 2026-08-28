const mongoose = require('mongoose');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Feedback = require('../models/Feedback');
const Question = require('../models/Question');
const FeedbackWindow = require('../models/FeedbackWindow');
const AppError = require('../utils/AppError');

const validateId = (id, name = 'ID') => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${name} format`, 400);
  }
};


// =========================================================================
// 1. SYSTEM STATS
// =========================================================================

const getSystemStats = async () => {
  const [studentsCount, facultyCount, coursesCount, questionsCount, activeWindow] = await Promise.all([
    User.countDocuments({ role: 'STUDENT' }),
    Faculty.countDocuments({}),
    Course.countDocuments({}),
    Question.countDocuments({ isActive: true }),
    FeedbackWindow.findOne({ startDate: { $lte: new Date() }, endDate: { $gte: new Date() } })
  ]);

  return {
    students: studentsCount,
    faculty: facultyCount,
    courses: coursesCount,
    activeQuestions: questionsCount,
    activeSemester: activeWindow ? activeWindow.semester : 'None'
  };
};

// =========================================================================
// 2. STUDENTS MANAGEMENT (Users with role STUDENT)
// =========================================================================

// Escapes regex metacharacters to prevent ReDoS and unintended matching
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getStudents = async ({ search = '', page = 1, limit = 10 }) => {
  const query = { role: 'STUDENT' };

  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, 100); // Cap to prevent bulk dumps
  const [students, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    User.countDocuments(query)
  ]);

  return {
    records: students,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const createStudent = async (studentData) => {
  // Check duplicate email
  const existing = await User.findOne({ email: studentData.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email address is already in use', 400);
  }

  return await User.create({
    ...studentData,
    role: 'STUDENT'
  });
};

const updateStudent = async (studentId, updateData) => {
  validateId(studentId, 'Student ID');
  const student = await User.findOne({ _id: studentId, role: 'STUDENT' });
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  if (updateData.email && updateData.email.toLowerCase() !== student.email) {
    const existing = await User.findOne({ email: updateData.email.toLowerCase() });
    if (existing) {
      throw new AppError('Email address is already in use', 400);
    }
  }

  // Update password via pre-save hooks if password provided
  if (updateData.password) {
    student.password = updateData.password;
  }
  student.name = updateData.name || student.name;
  student.email = updateData.email || student.email;

  return await student.save();
};

const deleteStudent = async (studentId) => {
  validateId(studentId, 'Student ID');
  const student = await User.findOne({ _id: studentId, role: 'STUDENT' });
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  // Cascade delete enrollments and orphan feedback records (M-11)
  await Promise.all([
    User.deleteOne({ _id: studentId }),
    Enrollment.deleteMany({ studentId }),
    Feedback.deleteMany({ studentId })
  ]);

  return { deleted: true };
};

// =========================================================================
// 3. FACULTY MANAGEMENT (User + Faculty profile)
// =========================================================================

const getFaculties = async ({ search = '', page = 1, limit = 10 }) => {
  const userQuery = { role: 'FACULTY' };
  if (search) {
    const safeSearch = escapeRegex(search);
    userQuery.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, 100);

  const pipeline = [
    { $match: userQuery },
    {
      $lookup: {
        from: 'faculties',
        localField: '_id',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: safeLimit },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              // password is never projected — aggregate does not include it unless projected
              employeeId: '$profile.employeeId',
              department: '$profile.department',
              facultyProfileId: '$profile._id',
              createdAt: 1
            }
          }
        ]
      }
    }
  ];

  const results = await User.aggregate(pipeline);
  const total = results[0]?.metadata[0]?.total || 0;
  const records = results[0]?.data || [];

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const createFaculty = async (facultyData) => {
  // Check email
  const existingEmail = await User.findOne({ email: facultyData.email.toLowerCase() });
  if (existingEmail) {
    throw new AppError('Email address is already in use', 400);
  }

  // Check employeeId
  const existingEmp = await Faculty.findOne({ employeeId: facultyData.employeeId.trim() });
  if (existingEmp) {
    throw new AppError('Employee ID is already in use', 400);
  }

  // Create User
  const user = await User.create({
    name: facultyData.name,
    email: facultyData.email,
    password: facultyData.password,
    role: 'FACULTY'
  });

  // Create Faculty Profile
  const profile = await Faculty.create({
    userId: user._id,
    employeeId: facultyData.employeeId,
    department: facultyData.department
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    employeeId: profile.employeeId,
    department: profile.department
  };
};

const updateFaculty = async (facultyUserId, updateData) => {
  validateId(facultyUserId, 'Faculty User ID');
  const user = await User.findOne({ _id: facultyUserId, role: 'FACULTY' });
  if (!user) {
    throw new AppError('Faculty user not found', 404);
  }

  const profile = await Faculty.findOne({ userId: facultyUserId });
  if (!profile) {
    throw new AppError('Faculty profile not found', 404);
  }

  // Check email conflict
  if (updateData.email && updateData.email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: updateData.email.toLowerCase() });
    if (existing) {
      throw new AppError('Email address is already in use', 400);
    }
  }

  // Check emp ID conflict
  if (updateData.employeeId && updateData.employeeId.trim() !== profile.employeeId) {
    const existing = await Faculty.findOne({ employeeId: updateData.employeeId.trim() });
    if (existing) {
      throw new AppError('Employee ID is already in use', 400);
    }
  }

  // Save updates
  if (updateData.password) {
    user.password = updateData.password;
  }
  user.name = updateData.name || user.name;
  user.email = updateData.email || user.email;
  await user.save();

  profile.employeeId = updateData.employeeId || profile.employeeId;
  profile.department = updateData.department || profile.department;
  await profile.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    employeeId: profile.employeeId,
    department: profile.department
  };
};

const deleteFaculty = async (facultyUserId) => {
  validateId(facultyUserId, 'Faculty User ID');
  const user = await User.findOne({ _id: facultyUserId, role: 'FACULTY' });
  if (!user) {
    throw new AppError('Faculty user not found', 404);
  }

  // Cascade deletes: User, Faculty profile, Course faculty mappings
  await Promise.all([
    User.deleteOne({ _id: facultyUserId }),
    Faculty.deleteOne({ userId: facultyUserId }),
    // Note: Course faculty remains but becomes unassigned/dangling, or delete. Let's keep it but ideally alert.
    // In our case we can clean it or keep. We will delete.
    Course.deleteMany({ facultyId: facultyUserId })
  ]);

  return { deleted: true };
};

// =========================================================================
// 4. COURSES MANAGEMENT
// =========================================================================

const getCourses = async ({ search = '', semester = '', page = 1, limit = 10 }) => {
  const query = {};
  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { courseName: { $regex: safeSearch, $options: 'i' } },
      { courseCode: { $regex: safeSearch, $options: 'i' } }
    ];
  }
  if (semester) {
    query.semester = semester;
  }

  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, 100);
  const [courses, total] = await Promise.all([
    Course.find(query).populate('facultyId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    Course.countDocuments(query)
  ]);

  return {
    records: courses,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const createCourse = async (courseData) => {
  validateId(courseData.facultyId, 'Faculty Instructor ID');
  // Validate duplicate course code
  const existing = await Course.findOne({ courseCode: courseData.courseCode.toUpperCase() });
  if (existing) {
    throw new AppError('Course code is already registered', 400);
  }

  // Verify faculty user is valid faculty role
  const faculty = await User.findOne({ _id: courseData.facultyId, role: 'FACULTY' });
  if (!faculty) {
    throw new AppError('Assigned instructor must be a valid Faculty member', 400);
  }

  return await Course.create(courseData);
};

const updateCourse = async (courseId, updateData) => {
  validateId(courseId, 'Course ID');
  if (updateData.facultyId) {
    validateId(updateData.facultyId, 'Faculty Instructor ID');
  }
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (updateData.courseCode && updateData.courseCode.toUpperCase() !== course.courseCode) {
    const existing = await Course.findOne({ courseCode: updateData.courseCode.toUpperCase() });
    if (existing) {
      throw new AppError('Course code is already registered', 400);
    }
  }

  if (updateData.facultyId) {
    const faculty = await User.findOne({ _id: updateData.facultyId, role: 'FACULTY' });
    if (!faculty) {
      throw new AppError('Assigned instructor must be a valid Faculty member', 400);
    }
  }

  Object.assign(course, updateData);
  return await course.save();
};

const deleteCourse = async (courseId) => {
  validateId(courseId, 'Course ID');
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Cascade delete enrollments
  await Promise.all([
    Course.deleteOne({ _id: courseId }),
    Enrollment.deleteMany({ courseId })
  ]);

  return { deleted: true };
};

// =========================================================================
// 5. ENROLLMENTS MANAGEMENT
// =========================================================================

const getEnrollments = async ({ courseId = '', studentId = '', page = 1, limit = 15 }) => {
  if (courseId) validateId(courseId, 'Course ID');
  if (studentId) validateId(studentId, 'Student ID');
  const query = {};
  if (courseId) query.courseId = courseId;
  if (studentId) query.studentId = studentId;

  const skip = (page - 1) * limit;
  const [enrollments, total] = await Promise.all([
    Enrollment.find(query)
      .populate('studentId', 'name email')
      .populate('courseId', 'courseName courseCode facultyId semester')
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments(query)
  ]);

  return {
    records: enrollments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const createEnrollment = async (studentId, courseId) => {
  validateId(studentId, 'Student ID');
  validateId(courseId, 'Course ID');
  // Validate Student role
  const student = await User.findOne({ _id: studentId, role: 'STUDENT' });
  if (!student) {
    throw new AppError('Invalid Student record', 400);
  }

  // Validate Course
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Unique constraint
  const existing = await Enrollment.findOne({ studentId, courseId, semester: course.semester });
  if (existing) {
    throw new AppError('Student is already enrolled in this course for this semester', 400);
  }

  return await Enrollment.create({
    studentId,
    courseId,
    semester: course.semester
  });
};

const deleteEnrollment = async (enrollmentId) => {
  validateId(enrollmentId, 'Enrollment ID');
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new AppError('Enrollment record not found', 404);
  }

  await Enrollment.deleteOne({ _id: enrollmentId });
  return { deleted: true };
};

// =========================================================================
// 6. QUESTION REGISTRY
// =========================================================================

const getQuestions = async () => {
  return await Question.find({}).sort({ createdAt: 1 });
};

const createQuestion = async (text) => {
  return await Question.create({ text, isActive: true });
};

const updateQuestion = async (id, updateData) => {
  validateId(id, 'Question ID');
  const q = await Question.findById(id);
  if (!q) {
    throw new AppError('Question not found', 404);
  }
  Object.assign(q, updateData);
  return await q.save();
};

const deleteQuestion = async (id) => {
  validateId(id, 'Question ID');
  const q = await Question.findById(id);
  if (!q) {
    throw new AppError('Question not found', 404);
  }
  await Question.deleteOne({ _id: id });
  return { deleted: true };
};

// =========================================================================
// 7. FEEDBACK WINDOWS
// =========================================================================

const getWindows = async () => {
  return await FeedbackWindow.find({}).sort({ endDate: -1 });
};

const createWindow = async (windowData) => {
  const existing = await FeedbackWindow.findOne({ semester: windowData.semester });
  if (existing) {
    throw new AppError('A feedback window for this semester already exists', 400);
  }
  return await FeedbackWindow.create(windowData);
};

const updateWindow = async (id, updateData) => {
  validateId(id, 'Window ID');
  const w = await FeedbackWindow.findById(id);
  if (!w) {
    throw new AppError('Feedback window not found', 404);
  }

  if (updateData.semester && updateData.semester !== w.semester) {
    const existing = await FeedbackWindow.findOne({ semester: updateData.semester });
    if (existing) {
      throw new AppError('A feedback window for this semester already exists', 400);
    }
  }

  Object.assign(w, updateData);
  return await w.save();
};

const deleteWindow = async (id) => {
  validateId(id, 'Window ID');
  const w = await FeedbackWindow.findById(id);
  if (!w) {
    throw new AppError('Feedback window not found', 404);
  }
  await FeedbackWindow.deleteOne({ _id: id });
  return { deleted: true };
};

module.exports = {
  getSystemStats,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getWindows,
  createWindow,
  updateWindow,
  deleteWindow
};
