/**
 * facultyAnalyticsService.js
 *
 * All MongoDB aggregation pipelines for faculty analytics.
 * PRIVACY INVARIANT: No pipeline at any stage ever returns or exposes
 *   studentId, student name, student email, roll number, or any student identifier.
 */

const Feedback = require('../models/Feedback');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Question = require('../models/Question');
const AppError = require('../utils/AppError');

// ---------------------------------------------------------------------------
// HELPER: Fisher-Yates shuffle (anonymises comment ordering)
// ---------------------------------------------------------------------------
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// HELPER: Resolve faculty profile → get facultyUserId from req.user.id
// ---------------------------------------------------------------------------
async function resolveFacultyUserId(userId) {
  // req.user.id IS the userId (User._id), which is also Feedback.facultyId
  return userId;
}

// ---------------------------------------------------------------------------
// 1. SUMMARY STATS  ─ overall rating, total responses, active courses
// ---------------------------------------------------------------------------
async function getSummaryStats(facultyUserId) {
  const facultyId = await resolveFacultyUserId(facultyUserId);

  const [aggregation, courseCount] = await Promise.all([
    Feedback.aggregate([
      { $match: { facultyId: facultyId } },
      { $unwind: '$ratings' },
      {
        $group: {
          _id: null,
          totalResponses: { $addToSet: '$_id' }, // unique feedback docs
          avgRating: { $avg: '$ratings.rating' },
          totalRatingEntries: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalResponses: { $size: '$totalResponses' },
          avgRating: { $round: ['$avgRating', 2] },
          totalRatingEntries: 1
        }
      }
    ]),
    Course.countDocuments({ facultyId: facultyId })
  ]);

  const stats = aggregation[0] || { totalResponses: 0, avgRating: 0 };
  return {
    overallAvgRating: stats.avgRating || 0,
    totalResponses: stats.totalResponses || 0,
    totalCoursesAssigned: courseCount
  };
}

// ---------------------------------------------------------------------------
// 2. RATING DISTRIBUTION  ─ how many responses are 1 / 2 / 3 / 4 / 5
// ---------------------------------------------------------------------------
async function getRatingDistribution(facultyUserId, courseId = null) {
  if (courseId) {
    const course = await Course.findOne({ _id: courseId, facultyId: facultyUserId });
    if (!course) {
      throw new AppError('Course not found or not assigned to you', 403);
    }
  }

  const match = { facultyId: facultyUserId };
  if (courseId) match.courseId = courseId;

  // Anonymity privacy threshold check: total responses must be >= 3
  const totalResponses = await Feedback.countDocuments(match);
  if (totalResponses < 3) {
    return [1, 2, 3, 4, 5].map((star) => ({ rating: star, count: 0 }));
  }

  const results = await Feedback.aggregate([
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

  // Fill in any missing star levels (1-5)
  const distribution = [1, 2, 3, 4, 5].map((star) => {
    const found = results.find((r) => r._id === star);
    return { rating: star, count: found ? found.count : 0 };
  });

  return distribution;
}

// ---------------------------------------------------------------------------
// 3. QUESTION-WISE AVERAGES  ─ avg rating per question for this faculty
// ---------------------------------------------------------------------------
async function getQuestionWiseAverages(facultyUserId, courseId = null) {
  if (courseId) {
    const course = await Course.findOne({ _id: courseId, facultyId: facultyUserId });
    if (!course) {
      throw new AppError('Course not found or not assigned to you', 403);
    }
  }

  const match = { facultyId: facultyUserId };
  if (courseId) match.courseId = courseId;

  // Anonymity privacy threshold check: total responses must be >= 3
  const totalResponses = await Feedback.countDocuments(match);
  if (totalResponses < 3) {
    return [];
  }

  const results = await Feedback.aggregate([
    { $match: match },
    { $unwind: '$ratings' },
    {
      $group: {
        _id: '$ratings.questionId',
        avgRating: { $avg: '$ratings.rating' },
        responseCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'questions',
        localField: '_id',
        foreignField: '_id',
        as: 'question'
      }
    },
    { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        questionId: '$_id',
        questionText: '$question.text',
        avgRating: { $round: ['$avgRating', 2] },
        responseCount: 1
      }
    },
    { $sort: { questionText: 1 } }
  ]);

  return results;
}

// ---------------------------------------------------------------------------
// 4. COURSE-WISE PERFORMANCE  ─ per-course avg rating and response count
// ---------------------------------------------------------------------------
async function getCoursePerformance(facultyUserId) {
  const results = await Feedback.aggregate([
    { $match: { facultyId: facultyUserId } },
    {
      $group: {
        _id: '$courseId',
        avgRating: { $avg: { $avg: '$ratings.rating' } },
        responseCount: { $sum: 1 }
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
    {
      $project: {
        _id: 0,
        courseId: '$_id',
        courseName: '$course.courseName',
        courseCode: '$course.courseCode',
        semester: '$course.semester',
        avgRating: { $round: ['$avgRating', 2] },
        responseCount: 1
      }
    },
    { $sort: { semester: -1, courseCode: 1 } }
  ]);

  return results;
}

// ---------------------------------------------------------------------------
// 5. SEMESTER TRENDS  ─ avg rating per semester (time-series for chart)
// ---------------------------------------------------------------------------
async function getSemesterTrends(facultyUserId) {
  const results = await Feedback.aggregate([
    { $match: { facultyId: facultyUserId } },
    { $unwind: '$ratings' },
    {
      $group: {
        _id: '$semester',
        avgRating: { $avg: '$ratings.rating' },
        responseCount: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        _id: 0,
        semester: '$_id',
        avgRating: { $round: ['$avgRating', 2] },
        responseCount: { $size: '$responseCount' }
      }
    },
    { $sort: { semester: 1 } }
  ]);

  return results;
}

// ---------------------------------------------------------------------------
// 6. ANONYMIZED COMMENTS  ─ text-only, Fisher-Yates shuffled, no student info
// ---------------------------------------------------------------------------
async function getAnonymizedComments(facultyUserId, courseId = null) {
  if (courseId) {
    const course = await Course.findOne({ _id: courseId, facultyId: facultyUserId });
    if (!course) {
      throw new AppError('Course not found or not assigned to you', 403);
    }
  }

  const match = { facultyId: facultyUserId, comment: { $exists: true, $ne: '' } };
  if (courseId) match.courseId = courseId;

  // Anonymity privacy threshold check: total responses must be >= 3
  const countMatch = { facultyId: facultyUserId };
  if (courseId) countMatch.courseId = courseId;
  const totalResponses = await Feedback.countDocuments(countMatch);
  if (totalResponses < 3) {
    return [];
  }

  // CRITICAL: project ONLY the comment field. studentId is NEVER included.
  const results = await Feedback.aggregate([
    { $match: match },
    {
      $project: {
        _id: 0,
        comment: 1,
        courseId: 1,
        semester: 1
        // studentId deliberately omitted
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        comment: 1,
        semester: 1,
        courseCode: '$course.courseCode',
        courseName: '$course.courseName'
        // No student fields
      }
    }
  ]);

  // Fisher-Yates shuffle to prevent timing-correlation attacks
  return shuffleArray(results);
}

// ---------------------------------------------------------------------------
// 7. COURSE DETAIL  ─ full analytics for a single course
// ---------------------------------------------------------------------------
async function getCourseAnalytics(facultyUserId, courseId) {
  // Verify this course actually belongs to this faculty
  const course = await Course.findOne({ _id: courseId, facultyId: facultyUserId });
  if (!course) {
    throw new AppError('Course not found or not assigned to you', 404);
  }

  const [distribution, questionAverages, comments, totalResponses] = await Promise.all([
    getRatingDistribution(facultyUserId, courseId),
    getQuestionWiseAverages(facultyUserId, courseId),
    getAnonymizedComments(facultyUserId, courseId),
    Feedback.countDocuments({ facultyId: facultyUserId, courseId })
  ]);

  // Compute overall avg from distribution
  let totalRatingSum = 0;
  let totalRatingCount = 0;
  distribution.forEach((d) => {
    totalRatingSum += d.rating * d.count;
    totalRatingCount += d.count;
  });
  const overallAvg = totalRatingCount > 0 ? Math.round((totalRatingSum / totalRatingCount) * 100) / 100 : 0;

  return {
    course: {
      id: course._id,
      courseName: course.courseName,
      courseCode: course.courseCode,
      semester: course.semester
    },
    totalResponses,
    overallAvgRating: overallAvg,
    ratingDistribution: distribution,
    questionAverages,
    comments
  };
}

// ---------------------------------------------------------------------------
// 8. COURSES LIST  ─ faculty's assigned courses with response summary
// ---------------------------------------------------------------------------
async function getFacultyCourses(facultyUserId) {
  const courses = await Course.find({ facultyId: facultyUserId }).sort({ semester: -1 });

  const withStats = await Promise.all(
    courses.map(async (c) => {
      const responseCount = await Feedback.countDocuments({
        facultyId: facultyUserId,
        courseId: c._id
      });

      // Compute avg without student info
      const avgResult = await Feedback.aggregate([
        { $match: { facultyId: facultyUserId, courseId: c._id } },
        { $unwind: '$ratings' },
        { $group: { _id: null, avg: { $avg: '$ratings.rating' } } }
      ]);

      return {
        id: c._id,
        courseName: c.courseName,
        courseCode: c.courseCode,
        semester: c.semester,
        credits: c.credits,
        responseCount,
        avgRating: avgResult[0] ? Math.round(avgResult[0].avg * 100) / 100 : 0
      };
    })
  );

  return withStats;
}

module.exports = {
  getSummaryStats,
  getRatingDistribution,
  getQuestionWiseAverages,
  getCoursePerformance,
  getSemesterTrends,
  getAnonymizedComments,
  getCourseAnalytics,
  getFacultyCourses
};
