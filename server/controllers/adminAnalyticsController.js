const analyticsService = require('../services/adminAnalyticsService');

// Helper to extract filter params from query
function extractFilters(query) {
  const sanitizeStr = (val) => (typeof val === 'string' ? val.trim() : null);
  return {
    semester: sanitizeStr(query.semester),
    courseId: sanitizeStr(query.courseId),
    facultyId: sanitizeStr(query.facultyId),
    department: sanitizeStr(query.department)
  };
}

const getHeadlineMetrics = async (req, res, next) => {
  try {
    const data = await analyticsService.getHeadlineMetrics();
    res.status(200).json({ success: true, message: 'Headline metrics fetched', data });
  } catch (err) { next(err); }
};

const getSemesterTrends = async (req, res, next) => {
  try {
    const data = await analyticsService.getSemesterTrends(extractFilters(req.query));
    res.status(200).json({ success: true, message: 'Semester trends fetched', data });
  } catch (err) { next(err); }
};

const getDepartmentAverages = async (req, res, next) => {
  try {
    const data = await analyticsService.getDepartmentAverages(extractFilters(req.query));
    res.status(200).json({ success: true, message: 'Department averages fetched', data });
  } catch (err) { next(err); }
};

const getFacultyPerformance = async (req, res, next) => {
  try {
    const data = await analyticsService.getFacultyPerformance(extractFilters(req.query));
    res.status(200).json({ success: true, message: 'Faculty performance fetched', data });
  } catch (err) { next(err); }
};

const getCoursePerformance = async (req, res, next) => {
  try {
    const data = await analyticsService.getCoursePerformance(extractFilters(req.query));
    res.status(200).json({ success: true, message: 'Course performance fetched', data });
  } catch (err) { next(err); }
};

const getRatingDistribution = async (req, res, next) => {
  try {
    const data = await analyticsService.getRatingDistribution(extractFilters(req.query));
    res.status(200).json({ success: true, message: 'Rating distribution fetched', data });
  } catch (err) { next(err); }
};

const getFilterOptions = async (req, res, next) => {
  try {
    const data = await analyticsService.getFilterOptions();
    res.status(200).json({ success: true, message: 'Filter options fetched', data });
  } catch (err) { next(err); }
};

module.exports = {
  getHeadlineMetrics,
  getSemesterTrends,
  getDepartmentAverages,
  getFacultyPerformance,
  getCoursePerformance,
  getRatingDistribution,
  getFilterOptions
};
