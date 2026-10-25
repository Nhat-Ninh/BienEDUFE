import api from './api'

export const submissionService = {
  start: (assignmentId) => api.post(`/api/v1/submissions/assignments/${assignmentId}/start`),
  getMySubmission: (assignmentId) => api.get(`/api/v1/submissions/assignments/${assignmentId}/my`),
  submit: (assignmentId, answers) => api.post(`/api/v1/submissions/assignments/${assignmentId}/submit`, answers),
  getMyDetail: (submissionId) => api.get(`/api/v1/submissions/${submissionId}`),
  getForAssignment: (assignmentId, page = 0, size = 30) => 
    api.get(`/api/v1/submissions/assignments/${assignmentId}?page=${page}&size=${size}`),
  getDetailForTeacher: (submissionId) => api.get(`/api/v1/submissions/${submissionId}/teacher`),
  gradeEssay: (payload) => api.post('/api/v1/submissions/grade-essay', payload),
}
