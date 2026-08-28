const analyticsService = require('../services/facultyAnalyticsService');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const getSummary = async (req, res, next) => {
  try {
    const data = await analyticsService.getSummaryStats(req.user.id);
    res.status(200).json({ success: true, message: 'Summary stats fetched', data });
  } catch (err) { next(err); }
};

const getCourses = async (req, res, next) => {
  try {
    const data = await analyticsService.getFacultyCourses(req.user.id);
    res.status(200).json({ success: true, message: 'Faculty courses fetched', data });
  } catch (err) { next(err); }
};

const getCourseAnalytics = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return next(new AppError('Invalid Course ID format', 400));
    }
    const data = await analyticsService.getCourseAnalytics(req.user.id, courseId);
    res.status(200).json({ success: true, message: 'Course analytics fetched', data });
  } catch (err) { next(err); }
};

const getRatingDistribution = async (req, res, next) => {
  try {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : null;
    const data = await analyticsService.getRatingDistribution(req.user.id, courseId);
    res.status(200).json({ success: true, message: 'Rating distribution fetched', data });
  } catch (err) { next(err); }
};

const getQuestionAverages = async (req, res, next) => {
  try {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : null;
    const data = await analyticsService.getQuestionWiseAverages(req.user.id, courseId);
    res.status(200).json({ success: true, message: 'Question averages fetched', data });
  } catch (err) { next(err); }
};

const getCoursePerformance = async (req, res, next) => {
  try {
    const data = await analyticsService.getCoursePerformance(req.user.id);
    res.status(200).json({ success: true, message: 'Course performance fetched', data });
  } catch (err) { next(err); }
};

const getSemesterTrends = async (req, res, next) => {
  try {
    const data = await analyticsService.getSemesterTrends(req.user.id);
    res.status(200).json({ success: true, message: 'Semester trends fetched', data });
  } catch (err) { next(err); }
};

const getComments = async (req, res, next) => {
  try {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : null;
    const data = await analyticsService.getAnonymizedComments(req.user.id, courseId);
    res.status(200).json({ success: true, message: 'Anonymized comments fetched', data });
  } catch (err) { next(err); }
};

module.exports = {
  getSummary,
  getCourses,
  getCourseAnalytics,
  getRatingDistribution,
  getQuestionAverages,
  getCoursePerformance,
  getSemesterTrends,
  getComments
};
