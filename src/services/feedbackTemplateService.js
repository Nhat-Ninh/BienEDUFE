import api from './api'

export const feedbackTemplateService = {
  getMyTemplates: () => api.get('/api/v1/feedback-templates'),
  create: (payload) => api.post('/api/v1/feedback-templates', payload),
  delete: (id) => api.delete(`/api/v1/feedback-templates/${id}`),
}
