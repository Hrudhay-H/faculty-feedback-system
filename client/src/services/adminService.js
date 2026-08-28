import api from './api';

const adminService = {
  // Stats
  getStats: () => api.get('/admin/stats'),

  // Students
  getStudents: (params) => api.get('/admin/students', { params }),
  createStudent: (data) => api.post('/admin/students', data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),

  // Faculty
  getFaculties: (params) => api.get('/admin/faculties', { params }),
  createFaculty: (data) => api.post('/admin/faculties', data),
  updateFaculty: (id, data) => api.put(`/admin/faculties/${id}`, data),
  deleteFaculty: (id) => api.delete(`/admin/faculties/${id}`),

  // Courses
  getCourses: (params) => api.get('/admin/courses', { params }),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),

  // Enrollments
  getEnrollments: (params) => api.get('/admin/enrollments', { params }),
  createEnrollment: (data) => api.post('/admin/enrollments', data),
  deleteEnrollment: (id) => api.delete(`/admin/enrollments/${id}`),

  // Questions
  getQuestions: () => api.get('/admin/questions'),
  createQuestion: (data) => api.post('/admin/questions', data),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),

  // Windows
  getWindows: () => api.get('/admin/windows'),
  createWindow: (data) => api.post('/admin/windows', data),
  updateWindow: (id, data) => api.put(`/admin/windows/${id}`, data),
  deleteWindow: (id) => api.delete(`/admin/windows/${id}`),

  // Analytics (Phase 7)
  getAnalyticsHeadline: () => api.get('/admin/analytics/headline'),
  getAnalyticsTrends: (params) => api.get('/admin/analytics/trends', { params }),
  getAnalyticsDepartments: (params) => api.get('/admin/analytics/departments', { params }),
  getAnalyticsFaculty: (params) => api.get('/admin/analytics/faculty', { params }),
  getAnalyticsCourses: (params) => api.get('/admin/analytics/courses', { params }),
  getAnalyticsDistribution: (params) => api.get('/admin/analytics/distribution', { params }),
  getAnalyticsFilterOptions: () => api.get('/admin/analytics/filters')
};

export default adminService;
