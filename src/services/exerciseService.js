import api from './api'

export const exerciseService = {
  createExercise: (payload) => api.post('/api/v1/exercises', payload),
  batchParse: (payload) => api.post('/api/v1/exercises/parse', payload),
  batchSave: (requests) => api.post('/api/v1/exercises/batch-save', requests),
  getByUnit: (lessonUnitId, page = 0, size = 20) => 
    api.get(`/api/v1/exercises?lessonUnitId=${lessonUnitId}&page=${page}&size=${size}`),
  getById: (id) => api.get(`/api/v1/exercises/${id}`),
}
