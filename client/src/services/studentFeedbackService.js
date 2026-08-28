import api from './api';

const studentFeedbackService = {
  // Fetch enrolled courses for active semester
  getCourses: () => api.get('/student/courses'),

  // Fetch active evaluation questions
  getQuestions: () => api.get('/student/questions'),

  // Verify feedback status for a course
  getFeedbackStatus: (courseId) => api.get(`/student/feedback/status/${courseId}`),

  // Submit feedback survey response
  submitFeedback: (payload) => api.post('/student/feedback/submit', payload),

  // Fetch feedback submission history (works without an active window)
  getHistory: () => api.get('/student/history')
};

export default studentFeedbackService;
