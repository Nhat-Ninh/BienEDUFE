import api from './api'

export const classService = {
  createClass: (payload) => api.post('/api/v1/classes', payload),
  getMyClasses: (page = 0, size = 20) => api.get(`/api/v1/classes?page=${page}&size=${size}`),
  getClassDetail: (classId) => api.get(`/api/v1/classes/${classId}`),
  getStudentsInClass: (classId) => api.get(`/api/v1/classes/${classId}/students`),
  addStudentByPhone: (classId, payload) => api.post(`/api/v1/classes/${classId}/students`, payload),
  removeStudent: (classId, studentId) => api.delete(`/api/v1/classes/${classId}/students/${studentId}`),
  archiveClass: (classId) => api.patch(`/api/v1/classes/${classId}/archive`),
  joinClass: (payload) => api.post('/api/v1/classes/join', payload),
  getEnrolledClasses: (page = 0, size = 20) => api.get(`/api/v1/classes/enrolled?page=${page}&size=${size}`),
}
