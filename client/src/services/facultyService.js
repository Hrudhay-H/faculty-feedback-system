import api from './api';

const facultyService = {
  getSummary: () => api.get('/faculty/summary'),
  getCourses: () => api.get('/faculty/courses'),
  getCourseAnalytics: (courseId) => api.get(`/faculty/courses/${courseId}/analytics`),
  getRatingDistribution: (courseId) => api.get('/faculty/analytics/distribution', { params: courseId ? { courseId } : {} }),
  getQuestionAverages: (courseId) => api.get('/faculty/analytics/questions', { params: courseId ? { courseId } : {} }),
  getCoursePerformance: () => api.get('/faculty/analytics/performance'),
  getSemesterTrends: () => api.get('/faculty/analytics/trends'),
  getComments: (courseId) => api.get('/faculty/analytics/comments', { params: courseId ? { courseId } : {} })
};

export default facultyService;
