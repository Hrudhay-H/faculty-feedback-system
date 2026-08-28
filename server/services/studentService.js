const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Feedback = require('../models/Feedback');
const FeedbackWindow = require('../models/FeedbackWindow');
const Question = require('../models/Question');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// =========================================================================
// 1. RETRIEVE STUDENT ENROLLED COURSES & WINDOW STATUS
// =========================================================================

const getStudentCourses = async (studentId) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new AppError('Invalid Student ID format', 400);
  }

  // 1. Locate current active evaluation window
  const now = new Date();
  const activeWindow = await FeedbackWindow.findOne({
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  if (!activeWindow) {
    return {
      windowActive: false,
      semester: null,
      courses: []
    };
  }

  // 2. Fetch Enrollments matching student + semester
  const enrollments = await Enrollment.find({
    studentId,
    semester: activeWindow.semester
  }).populate({
    path: 'courseId',
    populate: {
      path: 'facultyId',
      select: 'name' // email removed — students don't need faculty email (M-06)
    }
  });

  // 3. For each course, check if feedback is already submitted
  const courseList = await Promise.all(
    enrollments.map(async (en) => {
      const course = en.courseId;
      if (!course) return null;

      const hasSubmitted = await Feedback.findOne({
        studentId,
        courseId: course._id,
        facultyId: course.facultyId?._id,
        semester: activeWindow.semester
      });

      return {
        enrollmentId: en._id,
        courseId: course._id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        credits: course.credits,
        faculty: course.facultyId
          ? {
              id: course.facultyId._id,
              name: course.facultyId.name
              // email deliberately omitted (M-06 — students don't need faculty email)
            }
          : null,
        semester: course.semester,
        status: hasSubmitted ? 'Submitted' : 'Pending'
      };
    })
  );

  return {
    windowActive: true,
    semester: activeWindow.semester,
    courses: courseList.filter(Boolean)
  };
};

// =========================================================================
// 2. CHECK FEEDBACK STATUS FOR A SELECTED COURSE
// =========================================================================

const getFeedbackStatus = async (studentId, courseId) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new AppError('Invalid Student ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError('Invalid Course ID format', 400);
  }

  const now = new Date();
  const activeWindow = await FeedbackWindow.findOne({
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  if (!activeWindow) {
    throw new AppError('Evaluation feedback window is closed', 400);
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Verify student enrollment in this course for this semester
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    semester: activeWindow.semester
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course, access forbidden', 403);
  }

  const hasSubmitted = await Feedback.findOne({
    studentId,
    courseId,
    facultyId: course.facultyId,
    semester: activeWindow.semester
  });

  return {
    submitted: !!hasSubmitted,
    semester: activeWindow.semester
  };
};

// =========================================================================
// 3. SUBMIT FEEDBACK Survey response
// =========================================================================

const submitFeedback = async (studentId, { courseId, ratings, comment }) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new AppError('Invalid Student ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError('Invalid Course ID format', 400);
  }

  // 1. Locate current active window
  const now = new Date();
  const activeWindow = await FeedbackWindow.findOne({
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  if (!activeWindow) {
    throw new AppError('Feedback submission failed: Evaluation window is closed', 400);
  }

  // 2. Fetch target Course
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Target course not found', 404);
  }

  if (course.semester !== activeWindow.semester) {
    throw new AppError('This course is not configured for the active semester', 400);
  }

  if (!course.facultyId) {
    throw new AppError('No instructor is assigned to this course, cannot submit feedback', 400);
  }

  // 3. Verify student enrollment in this course for this semester
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    semester: activeWindow.semester
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course, access forbidden', 403);
  }

  // 4. Verify unique feedback submission (prevent duplicates)
  const existingFeedback = await Feedback.findOne({
    studentId,
    courseId,
    facultyId: course.facultyId,
    semester: activeWindow.semester
  });

  if (existingFeedback) {
    throw new AppError('Feedback has already been submitted for this course. Evaluation is immutable.', 400);
  }

  // 5. Verify that all active questions are rated
  const activeQuestions = await Question.find({ isActive: true });
  const activeQuestionIds = activeQuestions.map((q) => q._id.toString());

  // Ratings must be an array of objects containing questionId and rating
  if (!Array.isArray(ratings)) {
    throw new AppError('Invalid ratings submission payload', 400);
  }

  const ratingQuestionIds = ratings.map((r) => r.questionId.toString());

  // Confirm every active question has a rating entry
  const missingQuestions = activeQuestionIds.filter((qid) => !ratingQuestionIds.includes(qid));
  if (missingQuestions.length > 0) {
    throw new AppError('All active evaluation questions must be rated', 400);
  }

  // Verify ratings values are integers between 1 and 5
  ratings.forEach((r) => {
    const val = parseInt(r.rating);
    if (isNaN(val) || val < 1 || val > 5) {
      throw new AppError('Question ratings must be integers between 1 and 5', 400);
    }
  });

  // Validate comment length (M-07)
  if (comment && comment.length > 1000) {
    throw new AppError('Comment must not exceed 1000 characters', 400);
  }

  // 6. Save the immutable feedback record
  const feedback = await Feedback.create({
    studentId,
    courseId,
    facultyId: course.facultyId,
    semester: activeWindow.semester,
    ratings: ratings.map((r) => ({
      questionId: r.questionId,
      rating: parseInt(r.rating)
    })),
    comment: comment ? comment.trim() : ''
  });

  return {
    success: true,
    message: 'Feedback submitted successfully',
    data: {
      feedbackId: feedback._id
    }
  };
};

// =========================================================================
// 4. FEEDBACK HISTORY — submitted courses without requiring active window (H-06)
// =========================================================================

const getFeedbackHistory = async (studentId) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new AppError('Invalid Student ID format', 400);
  }

  // Fetch all feedback records for this student across all semesters
  const feedbacks = await Feedback.find({ studentId })
    .populate('courseId', 'courseName courseCode credits semester')
    .populate('facultyId', 'name') // name only — no email
    .sort({ createdAt: -1 })
    .lean();

  // Return anonymized view — no ratings or comments exposed back to student
  return feedbacks.map((fb) => ({
    feedbackId: fb._id,
    course: fb.courseId
      ? {
          courseId: fb.courseId._id,
          courseName: fb.courseId.courseName,
          courseCode: fb.courseId.courseCode,
          credits: fb.courseId.credits,
          semester: fb.courseId.semester
        }
      : null,
    faculty: fb.facultyId ? { name: fb.facultyId.name } : null,
    semester: fb.semester,
    submittedAt: fb.createdAt
  }));
};

module.exports = {
  getStudentCourses,
  getFeedbackStatus,
  submitFeedback,
  getFeedbackHistory
};
