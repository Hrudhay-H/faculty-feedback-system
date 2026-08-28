/**
 * adminAnalyticsService.js
 *
 * All system-wide analytics aggregation pipelines.
 * Every pipeline is executed inside MongoDB — no in-memory calculation.
 * Sensitive student fields (email, password hash, rollNumber) are never projected.
 */

const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const FeedbackWindow = require('../models/FeedbackWindow');
const Question = require('../models/Question');
const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build a $match stage from optional filter params
// ─────────────────────────────────────────────────────────────────────────────
function buildFeedbackMatch({ semester, courseId, facultyId } = {}) {
  const match = {};
  if (semester) match.semester = semester;
  if (courseId && mongoose.isValidObjectId(courseId))
    match.courseId = new mongoose.Types.ObjectId(courseId);
  if (facultyId && mongoose.isValidObjectId(facultyId))
    match.facultyId = new mongoose.Types.ObjectId(facultyId);
  return match;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEADLINE METRICS — counts + completion rate  (no filters needed)
// ─────────────────────────────────────────────────────────────────────────────
async function getHeadlineMetrics() {
  const [
    totalStudents,
    totalFaculty,
    totalCourses,
    totalFeedback,
    totalEnrollments,
    activeWindow,
    activeQuestions
  ] = await Promise.all([
    User.countDocuments({ role: 'STUDENT' }),
    Faculty.countDocuments({}),
    Course.countDocuments({}),
    Feedback.countDocuments({}),
    Enrollment.countDocuments({}),
    FeedbackWindow.findOne({ startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }),
    Question.countDocuments({ isActive: true })
  ]);

  // Completion rate = submitted / enrolled (only meaningful when there's a window)
  const completionRate =
    totalEnrollments > 0 ? Math.round((totalFeedback / totalEnrollments) * 100) : 0;

  return {
    totalStudents,
    totalFaculty,
    totalCourses,
    totalFeedback,
    totalEnrollments,
    completionRate,
    activeQuestions,
    activeSemester: activeWindow ? activeWindow.semester : null
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEMESTER TRENDS — avg rating + submission count per semester
// ─────────────────────────────────────────────────────────────────────────────
async function getSemesterTrends(filters = {}) {
  const match = buildFeedbackMatch(filters);
  // Remove semester from match so we group by it
  delete match.semester;

  const results = await Feedback.aggregate([
    { $match: match },
    { $unwind: '$ratings' },
    {
      $group: {
        _id: '$semester',
        avgRating: { $avg: '$ratings.rating' },
        submissions: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        _id: 0,
        semester: '$_id',
        avgRating: { $round: ['$avgRating', 2] },
        submissions: { $size: '$submissions' }
      }
    },
    { $sort: { semester: 1 } }
  ]);

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DEPARTMENT AVERAGES — avg rating grouped by faculty department
// ─────────────────────────────────────────────────────────────────────────────
async function getDepartmentAverages(filters = {}) {
  const match = buildFeedbackMatch(filters);

  const results = await Feedback.aggregate([
    { $match: match },
    { $unwind: '$ratings' },
    // Join to Faculty to get department
    {
      $lookup: {
        from: 'faculties',
        localField: 'facultyId',
        foreignField: 'userId',
        as: 'facultyProfile'
      }
    },
    { $unwind: { path: '$facultyProfile', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$facultyProfile.department', 'Unknown'] },
        avgRating: { $avg: '$ratings.rating' },
        submissions: { $addToSet: '$_id' },
        facultyIds: { $addToSet: '$facultyId' }
      }
    },
    {
      $project: {
        _id: 0,
        department: '$_id',
        avgRating: { $round: ['$avgRating', 2] },
        submissions: { $size: '$submissions' },
        facultyCount: { $size: '$facultyIds' }
      }
    },
    { $sort: { avgRating: -1 } }
  ]);

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FACULTY PERFORMANCE — avg rating per faculty member (filterable)
// ─────────────────────────────────────────────────────────────────────────────
async function getFacultyPerformance(filters = {}) {
  const match = buildFeedbackMatch(filters);

  // Optional department filter — handled by post-lookup $match
  const { department } = filters;

  const results = await Feedback.aggregate([
    { $match: match },
    { $unwind: '$ratings' },
    {
      $group: {
        _id: '$facultyId',
        avgRating: { $avg: '$ratings.rating' },
        submissions: { $addToSet: '$_id' }
      }
    },
    // Lookup User for faculty name (no email/password projected)
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    // Lookup Faculty profile for department
    {
      $lookup: {
        from: 'faculties',
        localField: '_id',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    // Filter by department if supplied
    ...(department ? [{ $match: { 'profile.department': department } }] : []),
    {
      $project: {
        _id: 0,
        facultyId: '$_id',
        name: '$user.name',          // name only — no email, no password
        department: '$profile.department',
        employeeId: '$profile.employeeId',
        avgRating: { $round: ['$avgRating', 2] },
        submissions: { $size: '$submissions' }
      }
    },
    { $sort: { avgRating: -1 } }
  ]);

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. COURSE PERFORMANCE — avg rating + completion rate per course
// ─────────────────────────────────────────────────────────────────────────────
async function getCoursePerformance(filters = {}) {
  const match = buildFeedbackMatch(filters);
  const { department } = filters;

  const results = await Feedback.aggregate([
    { $match: match },
    { $unwind: '$ratings' },
    {
      $group: {
        _id: '$courseId',
        avgRating: { $avg: '$ratings.rating' },
        submissions: { $addToSet: '$_id' }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
    // Lookup faculty name for course context
    {
      $lookup: {
        from: 'users',
        localField: 'course.facultyId',
        foreignField: '_id',
        as: 'facultyUser'
      }
    },
    { $unwind: { path: '$facultyUser', preserveNullAndEmptyArrays: true } },
    // Lookup faculty profile for department filter
    {
      $lookup: {
        from: 'faculties',
        localField: 'course.facultyId',
        foreignField: 'userId',
        as: 'facultyProfile'
      }
    },
    { $unwind: { path: '$facultyProfile', preserveNullAndEmptyArrays: true } },
    ...(department ? [{ $match: { 'facultyProfile.department': department } }] : []),
    {
      $project: {
        _id: 0,
        courseId: '$_id',
        courseCode: '$course.courseCode',
        courseName: '$course.courseName',
        semester: '$course.semester',
        credits: '$course.credits',
        facultyName: '$facultyUser.name', // name only
        department: '$facultyProfile.department',
        avgRating: { $round: ['$avgRating', 2] },
        submissions: { $size: '$submissions' }
      }
    },
    { $sort: { avgRating: -1 } }
  ]);

  // Enrich with enrollment count for completion rate
  const enriched = await Promise.all(
    results.map(async (r) => {
      const enrolled = await Enrollment.countDocuments({
        courseId: r.courseId,
        ...(r.semester ? { semester: r.semester } : {})
      });
      return {
        ...r,
        enrollmentCount: enrolled,
        completionRate: enrolled > 0 ? Math.round((r.submissions / enrolled) * 100) : 0
      };
    })
  );

  return enriched;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. RATING DISTRIBUTION — system-wide 1★–5★ breakdown (filterable)
// ─────────────────────────────────────────────────────────────────────────────
async function getRatingDistribution(filters = {}) {
  const match = buildFeedbackMatch(filters);

  const raw = await Feedback.aggregate([
    { $match: match },
    { $unwind: '$ratings' },
    {
      $group: {
        _id: '$ratings.rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return [1, 2, 3, 4, 5].map((star) => {
    const found = raw.find((r) => r._id === star);
    return { rating: star, label: `${star}★`, count: found ? found.count : 0 };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. FILTER OPTION LISTS — available semesters, departments, faculty
// ─────────────────────────────────────────────────────────────────────────────
async function getFilterOptions() {
  const [feedbackSemesters, courseSemesters, departments, facultyList, courseList] = await Promise.all([
    // Distinct semesters from submitted feedback
    Feedback.distinct('semester'),
    // Distinct semesters from course catalog (shows even when no feedback yet)
    Course.distinct('semester'),
    // Distinct departments from Faculty profiles
    Faculty.distinct('department'),
    // Faculty with name only
    User.find({ role: 'FACULTY' }, { _id: 1, name: 1 }).sort({ name: 1 }),
    // Courses
    Course.find({}, { _id: 1, courseCode: 1, courseName: 1, semester: 1 }).sort({ courseCode: 1 })
  ]);

  // Union both semester sources and deduplicate
  const allSemesters = [...new Set([...feedbackSemesters, ...courseSemesters])];

  return {
    semesters: allSemesters.sort(),
    departments: departments.sort(),
    faculty: facultyList.map((f) => ({ id: f._id, name: f.name })),
    courses: courseList.map((c) => ({
      id: c._id,
      courseCode: c.courseCode,
      courseName: c.courseName,
      semester: c.semester
    }))
  };
}

module.exports = {
  getHeadlineMetrics,
  getSemesterTrends,
  getDepartmentAverages,
  getFacultyPerformance,
  getCoursePerformance,
  getRatingDistribution,
  getFilterOptions
};
