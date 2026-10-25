import api from './api'

export const lessonService = {
  createLesson: (data) => api.post('/api/v1/lessons', data),
  updateLesson: (id, data) => api.put(`/api/v1/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/api/v1/lessons/${id}`),
  getLessonsForClass: (classId) => api.get(`/api/v1/lessons/classes/${classId}`),
  getMyLessonsAsTeacher: () => api.get('/api/v1/lessons/teacher'),
  getLessonDetail: (id) => api.get(`/api/v1/lessons/${id}`),
  createQuizForLesson: (id, quizData) => api.post(`/api/v1/lessons/${id}/quiz`, quizData),
  attachAssignment: (id, assignmentId) => api.post(`/api/v1/lessons/${id}/attach-assignment/${assignmentId}`),
  getLessonTracking: (id) => api.get(`/api/v1/lessons/${id}/tracking`),
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
