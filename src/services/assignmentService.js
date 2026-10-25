import api from './api'

export const assignmentService = {
  create: (payload) => api.post('/api/v1/assignments', payload),
  getMyAssignments: (page = 0, size = 20) => api.get(`/api/v1/assignments?page=${page}&size=${size}`),
  getDetailTeacher: (assignmentId) => api.get(`/api/v1/assignments/${assignmentId}/teacher`),
  getDetailStudent: (assignmentId) => api.get(`/api/v1/assignments/${assignmentId}`),
  getForClass: (classId, page = 0, size = 20) => 
    api.get(`/api/v1/assignments/class/${classId}?page=${page}&size=${size}`),
}
