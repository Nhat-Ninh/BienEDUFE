/**
 * Đọc nội dung bài học (Markdown do máy chủ dựng từ file giáo viên đưa lên, hoặc giáo viên tự soạn)
 * thành cấu trúc để trang học hiển thị: chuyên đề → mục học → đoạn lý thuyết / ví dụ có lời giải,
 * và danh sách câu hỏi tự luyện.
 *
 * Quy ước Markdown (khớp StudyContentBuilder ở backend và questionsToMarkdown ở trang giáo viên):
 *   # Chuyên đề        ## Mục học (Dạng)        ### Ví dụ N        > **Đáp án:** …  > **Lời giải:** …
 */

const REVEAL_MARK = /^>\s?/

/** Lời giải nằm trong khối trích dẫn "> **Đáp án:** …" / "> **Lời giải:** …". */
function parseReveal(lines) {
  let answer = ''
  const solution = []
  let target = null
  for (const raw of lines) {
    const line = raw.replace(REVEAL_MARK, '')
    const a = line.match(/^\*\*Đáp\s*án:?\*\*:?\s*(.*)$/i)
    const s = line.match(/^\*\*Lời\s*giải(?:\s*chi\s*tiết)?:?\*\*:?\s*(.*)$/i)
    if (a) {
      answer = a[1].trim()
      target = 'answer'
    } else if (s) {
      if (s[1].trim()) solution.push(s[1].trim())
      target = 'solution'
    } else if (target === 'solution') {
      solution.push(line)
    } else if (target === 'answer' && line.trim()) {
      answer += ` ${line.trim()}`
    }
  }
  return { answer: answer.trim(), solutionMd: solution.join('\n').trim() }
}

const isBlank = (s) => !s || !s.trim()

/**
 * @returns {{ chapters: Array<{id:string,title:string,topics:Array}>, topics: Array, hasContent: boolean }}
 * topic = { id, chapterId, chapterTitle, title, blocks: [{type:'text',md}|{type:'example',title,bodyMd,answer,solutionMd}], exampleCount }
 */
export function parseStudyMarkdown(md) {
  const lines = String(md ?? '').replace(/\r\n?/g, '\n').split('\n')
  const chapters = []
  const topics = []

  let chapter = null
  let topic = null
  let example = null // { title, body: [], reveal: [] }
  let text = [] // dòng của đoạn lý thuyết đang đọc

  const ensureChapter = (title = 'Nội dung') => {
    if (!chapter) {
      chapter = { id: `c${chapters.length}`, title, topics: [] }
      chapters.push(chapter)
    }
    return chapter
  }
  const ensureTopic = (title) => {
    if (!topic) {
      const c = ensureChapter()
      topic = { id: `t${topics.length}`, chapterId: c.id, chapterTitle: c.title, title, blocks: [], exampleCount: 0 }
      c.topics.push(topic)
      topics.push(topic)
    }
    return topic
  }
  const flushText = () => {
    const joined = text.join('\n').trim()
    // Mỗi đoạn (cách nhau dòng trống) là một khối riêng để "Kiến thức" / "Cách làm" hiện thành thẻ riêng
    if (joined) {
      const target = ensureTopic(chapter ? 'Tổng quan' : 'Giới thiệu')
      for (const para of joined.split(/\n\s*\n/)) if (para.trim()) target.blocks.push({ type: 'text', md: para.trim() })
    }
    text = []
  }
  const flushExample = () => {
    if (!example) return
    const t = ensureTopic('Ví dụ')
    const { answer, solutionMd } = parseReveal(example.reveal)
    t.blocks.push({ type: 'example', title: example.title, bodyMd: example.body.join('\n').trim(), answer, solutionMd })
    t.exampleCount += 1
    example = null
  }

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)$/)
    const h2 = line.match(/^##\s+(.+)$/)
    const h3 = line.match(/^###\s+(.+)$/)

    if (h1) {
      flushExample()
      flushText()
      topic = null
      chapter = { id: `c${chapters.length}`, title: h1[1].trim(), topics: [] }
      chapters.push(chapter)
    } else if (h2) {
      flushExample()
      flushText()
      topic = null
      const c = ensureChapter()
      topic = { id: `t${topics.length}`, chapterId: c.id, chapterTitle: c.title, title: h2[1].trim(), blocks: [], exampleCount: 0 }
      c.topics.push(topic)
      topics.push(topic)
    } else if (h3 && /^(Ví\s*dụ|Câu|Bài)\s*\d+/i.test(h3[1])) {
      flushExample()
      flushText()
      example = { title: h3[1].trim(), body: [], reveal: [] }
    } else if (example) {
      if (REVEAL_MARK.test(line)) example.reveal.push(line)
      else example.body.push(line)
    } else {
      text.push(line)
    }
  }
  flushExample()
  flushText()

  // Mục "Tổng quan" của một chuyên đề chỉ có chữ rỗng → bỏ các mục không có gì để học
  const keep = topics.filter(t => t.blocks.length > 0)
  chapters.forEach(c => { c.topics = c.topics.filter(t => keep.includes(t)) })
  return { chapters: chapters.filter(c => c.topics.length > 0), topics: keep, hasContent: keep.length > 0 }
}

// ───────────────────────── Câu hỏi tự luyện ─────────────────────────

const QUESTION_HEAD = /^\*\*(?:Câu|Bài|Ví\s*dụ)\s*(\d+)[.:)]?\*\*\s*(.*)$/i
const CHOICE_LINE = /^[-*]\s+\*\*([A-D])[.)]\*\*\s*(.*)$/

/** Chuẩn hóa đáp số để so sánh: bỏ $, khoảng trắng, đổi dấu phẩy thập phân, chữ thường. */
export function normalizeAnswer(s) {
  return String(s ?? '')
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/−/g, '-')
    .replace(/[.;]+$/, '')
    .toLowerCase()
}

/** "a-Đ, b-S, c-Đ, d-S" hoặc "Đ,S,Đ,S" → ['Đ','S','Đ','S'] hoặc null. */
export function parseTrueFalse(answer) {
  const marks = [...String(answer ?? '').replace(/[a-d]\s*[-:)=.]/gi, ' ').matchAll(/đúng|sai|true|false|đ|s|t|f/gi)]
    .map(m => (/^(đ|t)/i.test(m[0]) ? 'Đ' : 'S'))
  return marks.length === 4 ? marks : null
}

/**
 * @returns {{ questions: Array, notes: string }}
 * question = { index, number, group, stemMd, choices:[{key,text}], type, answer, solutionMd }
 * type: 'MC' (có đủ ≥2 phương án và đáp án) | 'TF' | 'SHORT' (có đáp số) | 'OPEN' (chỉ xem lời giải / tự đánh giá)
 */
export function parsePracticeMarkdown(md) {
  const lines = String(md ?? '').replace(/\r\n?/g, '\n').split('\n')
  const questions = []
  const notes = []
  let group = ''
  let cur = null

  const finish = () => {
    if (!cur) return
    const { answer, solutionMd } = parseReveal(cur.reveal)
    const stem = cur.stem.join('\n').trim()
    let type = 'OPEN'
    if (cur.choices.length >= 2 && /^[A-D]$/i.test(answer)) type = 'MC'
    else if (parseTrueFalse(answer)) type = 'TF'
    else if (answer) type = 'SHORT'
    questions.push({
      index: questions.length,
      number: cur.number,
      group,
      stemMd: stem,
      choices: cur.choices,
      type,
      answer: type === 'MC' ? answer.toUpperCase() : answer,
      solutionMd
    })
    cur = null
  }

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    const head = line.match(QUESTION_HEAD)
    const exampleHead = heading && /^(Ví\s*dụ|Câu|Bài)\s*(\d+)/i.exec(heading[1])

    if (exampleHead) {
      finish()
      cur = { number: Number(exampleHead[2]), stem: [], choices: [], reveal: [] }
    } else if (heading) {
      finish()
      group = heading[1].trim()
    } else if (head) {
      finish()
      cur = { number: Number(head[1]), stem: [], choices: [], reveal: [] }
      if (head[2]) cur.stem.push(head[2])
    } else if (cur) {
      const choice = line.match(CHOICE_LINE)
      if (choice) cur.choices.push({ key: choice[1].toUpperCase(), text: choice[2] })
      else if (REVEAL_MARK.test(line)) cur.reveal.push(line)
      else cur.stem.push(line)
    } else {
      notes.push(line)
    }
  }
  finish()
  return { questions, notes: notes.join('\n').trim() }
}

/** Đã chọn / nhập đáp án đúng chưa — dùng cho cả kiểm tra ngay và tính điểm tiến độ. */
export function checkAnswer(question, response) {
  if (!question || response == null) return null
  if (question.type === 'MC') return String(response).toUpperCase() === question.answer
  if (question.type === 'TF') {
    const expected = parseTrueFalse(question.answer)
    return !!expected && Array.isArray(response) && expected.every((v, i) => v === response[i])
  }
  if (question.type === 'SHORT') return normalizeAnswer(response) === normalizeAnswer(question.answer)
  return null // câu mở: học sinh tự đánh giá
}

export { isBlank }
