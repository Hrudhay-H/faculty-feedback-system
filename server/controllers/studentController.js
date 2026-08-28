const studentService = require('../services/studentService');
const Question = require('../models/Question');

const getCourses = async (req, res, next) => {
  try {
    const data = await studentService.getStudentCourses(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Student courses fetched successfully',
      data
    });
  } catch (err) {
    next(err);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const data = await studentService.getFeedbackStatus(req.user.id, req.params.courseId);
    res.status(200).json({
      success: true,
      message: 'Feedback status fetched successfully',
      data
    });
  } catch (err) {
    next(err);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const data = await studentService.submitFeedback(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Response registered as immutable.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const listQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find({ isActive: true }).select('_id text');
    res.status(200).json({
      success: true,
      message: 'Active evaluation questions list fetched successfully',
      data: questions
    });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const data = await studentService.getFeedbackHistory(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Feedback history fetched successfully',
      data: { history: data }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCourses,
  getStatus,
  submitFeedback,
  listQuestions,
  getHistory
};
