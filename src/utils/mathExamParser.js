/**
 * Công cụ bóc tách đề thi Toán từ File PDF hoặc Văn bản thô
 * Nhận diện câu hỏi, các phương án A/B/C/D, đáp án đúng và công thức LaTeX ($...$, $$...$$)
 */

export async function extractTextFromPdf(file) {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    
    // Đặt worker CDN hoặc fallback
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`
    }

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n\n'
    }

    return fullText.trim()
  } catch (err) {
    console.warn('Lỗi đọc PDF bằng pdfjs-dist, chuyển sang chế độ hỗ trợ:', err)
    throw new Error('Không thể tự động đọc nội dung file PDF này. Bạn có thể sao chép văn bản trong file PDF và dán vào khung bên dưới.')
  }
}

export function parseExamQuestions(rawText) {
  if (!rawText || !rawText.trim()) return []

  const text = rawText.replace(/\r\n/g, '\n').trim()

  // Phân tách từng câu dựa vào tiền tố "Câu 1:", "Câu 1.", "Bài 1:", "Question 1:"
  const questionRegex = /(?:^|\n)(?:Câu|Bài|Question)\s*(\d+)[\s.:-]+/gi
  const matches = [...text.matchAll(questionRegex)]

  if (matches.length === 0) {
    // Nếu không khớp từ khóa "Câu X:", thử phân tách theo số thứ tự dòng: "1.", "1:"
    const numberedRegex = /(?:^|\n)(\d+)[\s.:-]+\s*(?=[A-ZÀ-Ỹa-z])/g
    const numMatches = [...text.matchAll(numberedRegex)]
    if (numMatches.length > 0) {
      return parseBlocks(text, numMatches)
    }
    // Fallback: coi toàn bộ là 1 câu
    return [parseSingleQuestionBlock(text, 1)]
  }

  return parseBlocks(text, matches)
}

function parseBlocks(text, matches) {
  const questions = []

  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i]
    const startIndex = currentMatch.index + currentMatch[0].length
    const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : text.length
    const blockText = text.substring(startIndex, endIndex).trim()

    const q = parseSingleQuestionBlock(blockText, i + 1)
    if (q) questions.push(q)
  }

  return questions
}

function parseSingleQuestionBlock(blockText, questionNumber) {
  // Tìm đáp án đúng nếu có dòng "Đáp án: A" hoặc "Chọn A" hoặc "[A]"
  let correctAnswer = 'A'
  const ansMatch = blockText.match(/(?:Đáp\s*án|Chọn|Key|Đ\/A)[\s:=]+([A-D])/i)
  if (ansMatch) {
    correctAnswer = ansMatch[1].toUpperCase()
  }

  // Tìm lời giải nếu có dòng "Lời giải:" hoặc "Hướng dẫn giải:"
  let solutionMd = ''
  let contentWithoutSolution = blockText
  const solMatch = blockText.match(/(?:Lời\s*giải|Hướng\s*dẫn\s*giải|Giải\s*chi\s*tiết)[\s:=]+([\s\S]*)$/i)
  if (solMatch) {
    solutionMd = solMatch[1].trim()
    contentWithoutSolution = blockText.substring(0, solMatch.index).trim()
  }

  // Tìm vị trí các lựa chọn A, B, C, D
  // Regex hỗ trợ cả A. A) [A] nằm trên dòng riêng hoặc cùng dòng
  const choicePattern = /(?:^|\s|\n)([A-D])[\s.)-]+/g
  const choiceMatches = [...contentWithoutSolution.matchAll(choicePattern)]

  // Cần ít nhất 2 lựa chọn (thường là 4: A, B, C, D)
  const choices = []
  let questionContent = contentWithoutSolution

  if (choiceMatches.length >= 2) {
    // Nội dung câu hỏi là đoạn trước lựa chọn đầu tiên
    const firstChoiceIndex = choiceMatches[0].index
    questionContent = contentWithoutSolution.substring(0, firstChoiceIndex).trim()

    for (let c = 0; c < choiceMatches.length; c++) {
      const match = choiceMatches[c]
      const label = match[1].toUpperCase()
      const cStart = match.index + match[0].length
      const cEnd = (c + 1 < choiceMatches.length) ? choiceMatches[c + 1].index : contentWithoutSolution.length

      let cText = contentWithoutSolution.substring(cStart, cEnd).trim()
      // Xóa dấu chấm phẩy hoặc dấu chấm cuối nếu có
      cText = cText.replace(/[;.\s]+$/, '').trim()

      choices.push({
        id: label,
        content: cText || `Phương án ${label}`
      })
    }
  } else {
    // Nếu không bóc tách được các lựa chọn trắc nghiệm, tạo mặc định 4 phương án mẫu
    choices.push(
      { id: 'A', content: 'Đúng / Thỏa mãn' },
      { id: 'B', content: 'Sai / Không thỏa mãn' },
      { id: 'C', content: 'Không xác định' },
      { id: 'D', content: 'Đáp án khác' }
    )
  }

  // Xóa các từ khóa "Đáp án:" còn sót trong nội dung câu hỏi
  questionContent = questionContent.replace(/(?:Đáp\s*án|Chọn|Key|Đ\/A)[\s:=]+[A-D]/gi, '').trim()

  return {
    contentMd: questionContent || `Câu hỏi số ${questionNumber}`,
    type: 'MULTIPLE_CHOICE',
    difficulty: questionNumber > 8 ? 'HARD' : questionNumber > 4 ? 'MEDIUM' : 'EASY',
    choices,
    correctAnswer,
    solutionMd
  }
}
