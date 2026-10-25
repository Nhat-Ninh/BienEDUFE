import api from './api'

export const catalogService = {
  getSubjects: () => api.get('/api/v1/catalog/subjects'),
  getSections: (subjectId) => api.get(`/api/v1/catalog/subjects/${subjectId}/sections`),
  getTopics: (sectionId) => api.get(`/api/v1/catalog/sections/${sectionId}/topics`),
  getLessonUnits: (topicId) => api.get(`/api/v1/catalog/topics/${topicId}/lesson-units`),
}
