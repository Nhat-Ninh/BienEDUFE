/**
 * Chuyển kết quả bóc tách PDF của server thành Markdown để lưu vào nội dung bài học.
 * Công thức giữ nguyên dạng $...$ để MathRenderer hiển thị bằng KaTeX.
 */

const CHOICE_MARK = ['A', 'B', 'C', 'D']

/** Mục lục chuyên đề → dạng bài (tài liệu lý thuyết). */
export function outlineToMarkdown(outline = []) {
  const lines = []
  for (const chapter of outline) {
    lines.push(`**${chapter.label}**`)
    for (const topic of chapter.children || []) {
      const count = topic.questionCount ? ` _(${topic.questionCount} ví dụ)_` : ''
      lines.push(`- ${topic.label}${count}`)
    }
    if (!chapter.children?.length && chapter.questionCount) {
      lines.push(`- ${chapter.questionCount} ví dụ`)
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}

/** Danh sách câu hỏi → Markdown (có thể kèm đáp án, lời giải). */
export function questionsToMarkdown(questions = [], { withAnswers = true } = {}) {
  const out = []
  let lastGroup = null
  questions.forEach((q, index) => {
    if (q.groupLabel && q.groupLabel !== lastGroup) {
      out.push(`### ${q.groupLabel}`, '')
      lastGroup = q.groupLabel
    }
    out.push(`**Câu ${index + 1}.** ${q.contentMd || ''}`.trim())
    if (q.choices?.length) {
      out.push('')
      q.choices.forEach((c, i) => out.push(`- **${c.key || CHOICE_MARK[i]}.** ${c.text || ''}`))
    }
    if (withAnswers) {
      const answer = formatAnswer(q)
      if (answer || q.solutionMd) {
        out.push('')
        if (answer) out.push(`> **Đáp án:** ${answer}`)
        if (q.solutionMd) out.push(`> **Lời giải:** ${q.solutionMd}`)
      }
    }
    out.push('')
  })
  return out.join('\n').trim()
}

function formatAnswer(q) {
  if (!q.correctAnswer) return ''
  if (q.type === 'TRUE_FALSE') {
    return q.correctAnswer
      .split(',')
      .map((v, i) => `${'abcd'[i]}-${v}`)
      .join(', ')
  }
  return q.correctAnswer
}

/** Câu trắc nghiệm / đúng sai / trả lời ngắn còn thiếu đáp án (tự luận không cần đáp án). */
export function questionNeedsAnswer(q) {
  if (q.type === 'ESSAY') return false
  if (!q.correctAnswer || !String(q.correctAnswer).trim()) return true
  if (q.type === 'TRUE_FALSE') return q.correctAnswer.split(',').filter(Boolean).length !== 4
  return false
}
