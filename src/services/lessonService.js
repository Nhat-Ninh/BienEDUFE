import api from './api'

export const lessonService = {
  createLesson: (data) => api.post('/api/v1/lessons', data),
  updateLesson: (id, data) => api.put(`/api/v1/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/api/v1/lessons/${id}`),
  getLessonsForClass: (classId) => api.get(`/api/v1/lessons/classes/${classId}`),
  getMyLessonsAsTeacher: () => api.get('/api/v1/lessons/teacher'),
  getLessonDetail: (id) => api.get(`/api/v1/lessons/${id}`),
  createQuizForLesson: (id, quizData) => api.post(`/api/v1/lessons/${id}/quiz`, quizData),
  // Bài kiểm tra hiện có (kèm đáp án) để giáo viên sửa, và lưu lại bản sửa
  getQuizForLesson: (id) => api.get(`/api/v1/lessons/${id}/quiz`),
  updateQuizForLesson: (id, quizData) => api.put(`/api/v1/lessons/${id}/quiz`, quizData),
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
  },
  /**
   * Server bóc tách PDF (hoặc văn bản dán) thành bản xem trước, chưa lưu gì.
   * kind: 'THEORY' (mục lục) | 'EXERCISE' | 'QUIZ' (câu hỏi + đáp án + lời giải).
   */
  parsePdf: ({ file = null, rawText = '', kind = 'QUIZ' }) => {
    const formData = new FormData()
    if (file) formData.append('file', file)
    if (rawText) formData.append('rawText', rawText)
    formData.append('kind', kind)
    return api.post('/api/v1/lessons/parse-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000
    })
  }
}
