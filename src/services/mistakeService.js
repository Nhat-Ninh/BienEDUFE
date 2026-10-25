import api from './api'

export const mistakeService = {
  getDue: () => api.get('/api/v1/mistakes/due'),
  getAll: (page = 0, size = 20) => api.get(`/api/v1/mistakes?page=${page}&size=${size}`),
  updateReason: (mistakeId, reason) => api.patch(`/api/v1/mistakes/${mistakeId}/reason`, { errorReason: reason }),
  resolve: (mistakeId) => api.post(`/api/v1/mistakes/${mistakeId}/resolve`),
}
