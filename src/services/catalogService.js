import api from './api'
import { gradeSubjectCode } from '@/constants/grades'

export const catalogService = {
  getSubjects: () => api.get('/api/v1/catalog/subjects'),
  getSections: (subjectId) => api.get(`/api/v1/catalog/subjects/${subjectId}/sections`),
  getTopics: (sectionId) => api.get(`/api/v1/catalog/sections/${sectionId}/topics`),
  getLessonUnits: (topicId) => api.get(`/api/v1/catalog/topics/${topicId}/lesson-units`),

  /**
   * Danh sách dạng bài (lesson unit) của một khối lớp, phẳng hoá thành [{ id, name }]
   * để các màn hình chọn câu hỏi không phải gõ cứng ID của khối 12.
   */
  async getLessonUnitOptionsByGrade(grade) {
    const unwrap = (r) => r?.data || r || []
    const subject = unwrap(await api.get('/api/v1/catalog/subjects')).find(s => s.code === gradeSubjectCode(grade))
    if (!subject) return []
    const sections = unwrap(await api.get(`/api/v1/catalog/subjects/${subject.id}/sections`))
    const perSection = await Promise.all(sections.map(async (sec) => {
      const topics = unwrap(await api.get(`/api/v1/catalog/sections/${sec.id}/topics`))
      const perTopic = await Promise.all(topics.map(async (t) => {
        const units = unwrap(await api.get(`/api/v1/catalog/topics/${t.id}/lesson-units`))
        return units.map(u => ({ id: u.id, name: `${t.name} › ${u.title || u.name}` }))
      }))
      return perTopic.flat()
    }))
    return perSection.flat()
  }
}
