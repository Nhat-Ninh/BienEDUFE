import api from './api'

export const analyticsService = {
  getMySkillMap: () => api.get('/api/v1/skill-map'),
  getStudentSkillMap: (studentId, classId) => 
    api.get(`/api/v1/skill-map/students/${studentId}${classId ? `?classId=${classId}` : ''}`),
  getWeeklyReport: () => api.get('/api/v1/reports/weekly'),
  createShareLink: () => api.post('/api/v1/reports/weekly/share'),
  getPublicReport: (token) => api.get(`/api/v1/reports/weekly/public/${token}`),
}
