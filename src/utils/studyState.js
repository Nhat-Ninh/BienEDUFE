/**
 * Trạng thái học của một học sinh trong một bài học, lưu ngay trên trình duyệt để mở lại là học tiếp được:
 * mục lý thuyết đã hiểu, câu tự luyện đã làm. Số tổng hợp (đã học / đúng) còn được gửi lên máy chủ
 * để giáo viên theo dõi.
 */
const keyOf = (userId, lessonId) => `bienedu_study_${userId ?? 'guest'}_${lessonId}`

export function emptyStudyState() {
  return { doneTopics: [], practice: {}, lastTopic: null }
}

export function loadStudyState(userId, lessonId) {
  try {
    const raw = localStorage.getItem(keyOf(userId, lessonId))
    if (!raw) return emptyStudyState()
    const parsed = JSON.parse(raw)
    return {
      doneTopics: Array.isArray(parsed.doneTopics) ? parsed.doneTopics : [],
      practice: parsed.practice && typeof parsed.practice === 'object' ? parsed.practice : {},
      lastTopic: parsed.lastTopic ?? null
    }
  } catch {
    return emptyStudyState()
  }
}

export function saveStudyState(userId, lessonId, state) {
  try {
    localStorage.setItem(keyOf(userId, lessonId), JSON.stringify(state))
  } catch {
    // Trình duyệt chặn lưu trữ (chế độ riêng tư): vẫn học bình thường, chỉ không nhớ lần sau
  }
}

/** Tổng hợp tiến độ để gửi máy chủ. */
export function summarize(state, theoryTotal, practiceQuestions) {
  const answers = practiceQuestions.map(q => state.practice[q.index]).filter(Boolean)
  return {
    theoryTotal,
    theoryDone: state.doneTopics.length > theoryTotal ? theoryTotal : state.doneTopics.length,
    practiceTotal: practiceQuestions.length,
    practiceAnswered: answers.filter(a => a.revealed || a.response != null).length,
    practiceCorrect: answers.filter(a => a.correct === true).length
  }
}

export const percent = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0)
