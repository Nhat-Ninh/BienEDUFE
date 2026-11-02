<script setup>
import { ref, computed, onMounted } from 'vue'
import { lessonService } from '@/services/lessonService'
import { questionNeedsAnswer } from '@/utils/pdfImportMarkdown'
import MathRenderer from '@/components/MathRenderer.vue'
import PdfTemplateGuide from '@/components/PdfTemplateGuide.vue'
import { gradeLabel, normalizeGrade } from '@/constants/grades'
import {
  X,
  Sparkles,
  FileUp,
  Check,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle
} from 'lucide-vue-next'

const props = defineProps({
  lesson: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'quizCreated'])

// Bài học đã có bài kiểm tra → chế độ sửa; chưa có → chế độ tạo mới
const isEditMode = computed(() => !!props.lesson.quizAssignmentId)

// State
const activeStep = ref(isEditMode.value ? 2 : 1) // 1: Input PDF/Text, 2: Visual Editor & Publish
const isReadingPdf = ref(false)
const isLoadingExisting = ref(false)
const rawText = ref('')
const uploadFileName = ref('')
const parsedQuestions = ref([])
const parseWarnings = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const showGuide = ref(false)
// Đã có học sinh nộp bài: chỉ sửa nội dung từng câu, không thêm / xóa câu
const hasSubmissions = ref(false)

// Quiz metadata
const quizTitle = ref(`Bài kiểm tra: ${props.lesson.title}`)
const quizDescription = ref('Bài kiểm tra trắc nghiệm đánh giá mức độ tiếp thu lý thuyết')
const durationMinutes = ref(15)
const dueAt = ref('')

const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { value: 'TRUE_FALSE', label: 'Đúng / Sai' },
  { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
  { value: 'ESSAY', label: 'Tự luận' }
]

// Đề thi mẫu theo đúng khối của bài học để trải nghiệm 1 chạm (không dùng chung đề lớp 12)
const SAMPLE_EXAMS = {
  6: String.raw`Câu 1: Giá trị của biểu thức $A = 2^3 \cdot 5 - 3^2 + 10$ là:
A. $41$
B. $31$
C. $39$
D. $21$
Lời giải: Lũy thừa trước: $2^3 = 8$, $3^2 = 9$. Nhân: $8 \cdot 5 = 40$. Vậy $A = 40 - 9 + 10 = 41$.
Đáp án: A

Câu 2: Kết quả của phép tính $(-25) + 14 - (-11)$ bằng:
A. $0$
B. $-22$
C. $-50$
D. $25$
Lời giải: $(-25) + 14 + 11 = -25 + 25 = 0$.
Đáp án: A`,
  7: String.raw`Câu 1: Giá trị của biểu thức $A = \left(-\frac{1}{2}\right)^3 \cdot 16$ là:
A. $-2$
B. $2$
C. $-8$
D. $8$
Lời giải: $\left(-\frac{1}{2}\right)^3 = -\frac{1}{8}$ nên $A = -\frac{1}{8} \cdot 16 = -2$.
Đáp án: A

Câu 2: Tìm $x$ biết $x + \frac{1}{2} = \frac{3}{4}$:
A. $\frac{1}{4}$
B. $\frac{5}{4}$
C. $-\frac{1}{4}$
D. $\frac{1}{2}$
Lời giải: $x = \frac{3}{4} - \frac{1}{2} = \frac{1}{4}$.
Đáp án: A`,
  8: String.raw`Câu 1: Rút gọn biểu thức $B = (x + 2)^2 - (x - 2)^2$ ta được:
A. $8x$
B. $4x$
C. $8$
D. $2x^2 + 8$
Lời giải: Dùng $A^2 - B^2 = (A - B)(A + B)$: $B = 4 \cdot 2x = 8x$.
Đáp án: A

Câu 2: Phân tích đa thức $x^2 - 6x + 9$ thành nhân tử ta được:
A. $(x - 3)^2$
B. $(x + 3)^2$
C. $(x - 3)(x + 3)$
D. $(x - 9)(x + 1)$
Lời giải: $x^2 - 2 \cdot x \cdot 3 + 3^2 = (x - 3)^2$.
Đáp án: A`,
  9: String.raw`Câu 1: Rút gọn $P = \sqrt{(3 - \sqrt{10})^2} + \sqrt{10}$ ta được:
A. $3$
B. $2\sqrt{10} - 3$
C. $3 - 2\sqrt{10}$
D. $-3$
Lời giải: $\sqrt{(3 - \sqrt{10})^2} = \sqrt{10} - 3$ vì $3 < \sqrt{10}$. Vậy $P = 2\sqrt{10} - 3$.
Đáp án: B

Câu 2: Phương trình $x^2 - 5x + 6 = 0$ có tổng hai nghiệm bằng:
A. $5$
B. $-5$
C. $6$
D. $-6$
Lời giải: Theo Vi-ét, $x_1 + x_2 = -\frac{b}{a} = 5$.
Đáp án: A`,
  10: String.raw`Câu 1: Tập nghiệm của bất phương trình $x^2 - 4x + 3 < 0$ là:
A. $(1; 3)$
B. $(-\infty; 1) \cup (3; +\infty)$
C. $[1; 3]$
D. $(-\infty; -3) \cup (-1; +\infty)$
Lời giải: Tam thức có hai nghiệm $1$ và $3$, $a = 1 > 0$ nên âm trong khoảng hai nghiệm: $(1; 3)$.
Đáp án: A

Câu 2: Cho hai vectơ $\vec{a} = (1; 2)$ và $\vec{b} = (3; -1)$. Tích vô hướng $\vec{a} \cdot \vec{b}$ bằng:
A. $1$
B. $5$
C. $-1$
D. $0$
Lời giải: $\vec{a} \cdot \vec{b} = 1 \cdot 3 + 2 \cdot (-1) = 1$.
Đáp án: A`,
  11: String.raw`Câu 1: Giới hạn $\lim \frac{3n^2 + 2n - 1}{n^2 + 5}$ bằng:
A. $3$
B. $2$
C. $0$
D. $+\infty$
Lời giải: Chia cả tử và mẫu cho $n^2$ ta được giới hạn $3$.
Đáp án: A

Câu 2: Đạo hàm của hàm số $y = x^3 - 2x$ tại $x = 1$ bằng:
A. $1$
B. $3$
C. $-1$
D. $2$
Lời giải: $y' = 3x^2 - 2$ nên $y'(1) = 1$.
Đáp án: A`,
  12: String.raw`Câu 1: Cho hàm số $y = x^3 - 3x^2 + 2$. Điểm cực đại của đồ thị hàm số là:
A. $(0; 2)$
B. $(2; -2)$
C. $(1; 0)$
D. $(0; 0)$
Lời giải: Ta có $y' = 3x^2 - 6x = 0 \Leftrightarrow x = 0$ hoặc $x = 2$. Bảng biến thiên cho thấy tại $x = 0$ hàm số đạt cực đại, $y(0) = 2$. Vậy điểm cực đại là $(0; 2)$.
Đáp án: A

Câu 2: Nguyên hàm của hàm số $f(x) = 2x + \cos x$ là:
A. $x^2 + \sin x + C$
B. $x^2 - \sin x + C$
C. $2 + \sin x + C$
D. $x^2 + \cos x + C$
Lời giải: Sử dụng công thức nguyên hàm cơ bản: $\int 2x dx = x^2$ và $\int \cos x dx = \sin x$. Do đó $\int (2x + \cos x) dx = x^2 + \sin x + C$.
Đáp án: A

Câu 3: Trong không gian $Oxyz$, mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$ có tọa độ tâm $I$ và bán kính $R$ là:
A. $I(1; -2; 3)$ và $R = 4$
B. $I(-1; 2; -3)$ và $R = 4$
C. $I(1; -2; 3)$ và $R = 16$
D. $I(-1; 2; -3)$ và $R = 16$
Lời giải: Phương trình mặt cầu dạng $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2 \Rightarrow I(1; -2; 3)$ và $R = \sqrt{16} = 4$.
Đáp án: A

Câu 4: Thể tích khối chóp có diện tích đáy $B = 6a^2$ và chiều cao $h = 3a$ là:
A. $6a^3$
B. $18a^3$
C. $2a^3$
D. $9a^3$
Lời giải: Công thức thể tích khối chóp là $V = \frac{1}{3} B \cdot h = \frac{1}{3} \cdot 6a^2 \cdot 3a = 6a^3$.
Đáp án: A`
}

const lessonGrade = computed(() => normalizeGrade(props.lesson?.gradeLevel))
const sampleExam = computed(() => (lessonGrade.value ? SAMPLE_EXAMS[lessonGrade.value] : null))

const loadSampleExam = () => {
  if (sampleExam.value) rawText.value = sampleExam.value
}

// Câu trả lời của server → câu hỏi chỉnh sửa được trên UI
const toEditable = (q) => ({
  id: q.id ?? null,
  lessonUnitId: q.lessonUnitId ?? null,
  groupLabel: q.groupLabel || '',
  contentMd: q.contentMd || '',
  type: q.type || 'MULTIPLE_CHOICE',
  difficulty: q.difficulty || 'MEDIUM',
  choices: (q.choices || []).map(c => ({ key: c.key, text: c.text || '' })),
  correctAnswer: q.correctAnswer || '',
  solutionMd: q.solutionMd || '',
  warnings: q.warnings || []
})

const applyParsed = (data) => {
  parsedQuestions.value = (data.questions || []).map(toEditable)
  parseWarnings.value = data.warnings || []
}

// Sửa bài kiểm tra đã xuất bản: nạp câu hỏi hiện có từ server
onMounted(async () => {
  if (!isEditMode.value) return
  isLoadingExisting.value = true
  try {
    const res = await lessonService.getQuizForLesson(props.lesson.id)
    const data = res.data || res
    quizTitle.value = data.title || quizTitle.value
    quizDescription.value = data.description || ''
    dueAt.value = data.dueAt ? toLocalInput(data.dueAt) : ''
    hasSubmissions.value = !!data.hasSubmissions
    parsedQuestions.value = (data.questions || []).map(toEditable)
  } catch (err) {
    errorMessage.value = err.detail || err.message || 'Không tải được bài kiểm tra hiện có.'
  } finally {
    isLoadingExisting.value = false
  }
})

// "2026-11-02T08:30:00" → giá trị cho <input type="datetime-local">
const toLocalInput = (iso) => String(iso).slice(0, 16)

// Chọn file PDF: server bóc tách ngay, giáo viên chỉ việc xem lại và xuất bản
const handlePdfUpload = async (event) => {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  if (isEditMode.value && !confirmReplace()) return

  uploadFileName.value = file.name
  await runParse({ file })
}

const confirmReplace = () => {
  if (parsedQuestions.value.length === 0) return true
  return confirm(`Nạp đề mới sẽ thay thế toàn bộ ${parsedQuestions.value.length} câu hiện tại. Tiếp tục?`)
}

const runParse = async ({ file = null, text = '' }) => {
  isReadingPdf.value = true
  errorMessage.value = ''
  try {
    const res = await lessonService.parsePdf({ file, rawText: text, kind: 'QUIZ' })
    const data = res.data || res
    if (!data.questions?.length) {
      parseWarnings.value = data.warnings || []
      errorMessage.value = data.warnings?.[0]
        || 'Không tìm thấy câu hỏi nào. Mỗi câu cần bắt đầu bằng "Câu 1." trên một dòng riêng.'
      return
    }
    applyParsed(data)
    activeStep.value = 2
  } catch (err) {
    errorMessage.value = err.detail || err.message || 'Không thể đọc nội dung file PDF.'
  } finally {
    isReadingPdf.value = false
  }
}

// Bóc tách từ văn bản dán vào (cùng bộ bóc tách phía server)
const handleParseQuestions = async () => {
  if (!rawText.value.trim()) {
    errorMessage.value = 'Vui lòng dán văn bản hoặc tải lên file PDF đề thi.'
    return
  }
  if (isEditMode.value && !confirmReplace()) return
  await runParse({ text: rawText.value })
}

// Click trực tiếp vào đáp án A/B/C/D để chọn đáp án đúng
const setCorrectAnswer = (questionIndex, choiceKey) => {
  parsedQuestions.value[questionIndex].correctAnswer = choiceKey
}

const tfValues = (q) => {
  const parts = (q.correctAnswer || '').split(',')
  return [0, 1, 2, 3].map(i => parts[i] || '')
}

const setTrueFalse = (q, index, value) => {
  const next = tfValues(q)
  next[index] = value
  q.correctAnswer = next.every(v => !v) ? '' : next.join(',')
}

const changeType = (q) => {
  q.correctAnswer = ''
  if (q.type === 'MULTIPLE_CHOICE' && q.choices.length === 0) {
    q.choices = ['A', 'B', 'C', 'D'].map(key => ({ key, text: '' }))
  }
}

// Xóa câu hỏi khỏi danh sách
const removeQuestion = (index) => {
  parsedQuestions.value.splice(index, 1)
}

// Thêm câu hỏi thủ công
const addEmptyQuestion = () => {
  parsedQuestions.value.push({
    id: null,
    lessonUnitId: null,
    groupLabel: '',
    contentMd: 'Câu hỏi mới: Điền nội dung câu hỏi tại đây...',
    type: 'MULTIPLE_CHOICE',
    difficulty: 'MEDIUM',
    choices: [
      { key: 'A', text: 'Phương án A' },
      { key: 'B', text: 'Phương án B' },
      { key: 'C', text: 'Phương án C' },
      { key: 'D', text: 'Phương án D' }
    ],
    correctAnswer: 'A',
    solutionMd: '',
    warnings: []
  })
}

const missingAnswerCount = computed(() => parsedQuestions.value.filter(questionNeedsAnswer).length)

// Chỉ gửi đúng các trường server cần (bỏ nhãn nhóm, cảnh báo...)
const toPayload = (q) => ({
  id: q.id || undefined,
  lessonUnitId: q.lessonUnitId || undefined,
  contentMd: q.contentMd,
  type: q.type,
  difficulty: q.difficulty,
  choices: q.type === 'MULTIPLE_CHOICE' ? q.choices : [],
  correctAnswer: q.type === 'ESSAY' ? null : (q.correctAnswer || null),
  solutionMd: q.solutionMd || null
})

// Lưu & Xuất bản (hoặc lưu thay đổi) bài kiểm tra
const handlePublishQuiz = async () => {
  if (parsedQuestions.value.length === 0) {
    errorMessage.value = 'Đề thi phải có ít nhất 1 câu hỏi.'
    return
  }
  const firstMissing = parsedQuestions.value.findIndex(questionNeedsAnswer)
  if (firstMissing !== -1) {
    errorMessage.value = `Câu ${firstMissing + 1} chưa có đáp án đúng. Hãy chọn đáp án (còn ${missingAnswerCount.value} câu thiếu) trước khi lưu.`
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const payload = {
      title: quizTitle.value.trim(),
      description: quizDescription.value.trim(),
      durationMinutes: durationMinutes.value || 15,
      dueAt: dueAt.value ? new Date(dueAt.value).toISOString() : null,
      questions: parsedQuestions.value.map(toPayload)
    }

    const res = isEditMode.value
      ? await lessonService.updateQuizForLesson(props.lesson.id, payload)
      : await lessonService.createQuizForLesson(props.lesson.id, payload)
    successMessage.value = isEditMode.value
      ? '✅ Đã lưu thay đổi bài kiểm tra!'
      : '🎉 Xuất bản bài kiểm tra thành công!'
    emit('quizCreated', res.data || res)
    setTimeout(() => {
      emit('close')
    }, 1200)
  } catch (err) {
    errorMessage.value = err.detail || err.message || 'Lỗi khi lưu bài kiểm tra.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl max-w-5xl w-full my-8 shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh]">

      <!-- Header -->
      <div class="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div>
          <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-ocean-50 text-ocean-700 text-[11px] font-bold mb-1">
            <Sparkles class="w-3.5 h-3.5 text-ocean-600" />
            <span>Công Cụ Bóc Tách PDF Thông Minh</span>
          </div>
          <h2 class="text-lg font-bold text-slate-900">
            {{ isEditMode ? 'Sửa Bài Kiểm Tra Của Bài Học' : 'Tạo Bài Kiểm Tra Cho Bài Học' }}: {{ lesson.title }}
          </h2>
        </div>
        <button
          @click="$emit('close')"
          class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Alerts -->
      <div v-if="errorMessage" class="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="successMessage" class="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
        <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
        <span class="font-bold">{{ successMessage }}</span>
      </div>

      <!-- Steps Content -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">

        <div v-if="isLoadingExisting" class="py-12 text-center text-xs text-slate-400">
          Đang tải bài kiểm tra hiện có...
        </div>

        <!-- BƯỚC 1: Chọn file PDF hoặc Dán văn bản -->
        <div v-else-if="activeStep === 1" class="space-y-5">
          <div class="bg-gradient-to-r from-ocean-50 to-sky-50 border border-ocean-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-0.5">
              <h4 class="text-xs font-bold text-ocean-900">Cách thức hoạt động</h4>
              <p class="text-[11px] text-slate-600">
                Chỉ cần chọn file PDF đề thi: máy chủ tự đọc và bóc tách từng câu hỏi, công thức LaTeX, các phương án, đáp án đúng và lời giải. Bạn xem lại, sửa nếu cần rồi xuất bản.
              </p>
              <button
                type="button"
                data-testid="open-pdf-guide"
                @click="showGuide = true"
                class="text-[11px] font-bold text-ocean-700 hover:text-ocean-900 underline underline-offset-2 flex items-center space-x-1 pt-0.5"
              >
                <HelpCircle class="w-3.5 h-3.5" />
                <span>Xem định dạng PDF chuẩn & tải file mẫu</span>
              </button>
            </div>
            <button
              v-if="sampleExam"
              data-testid="load-sample-exam"
              @click="loadSampleExam"
              class="px-3.5 py-1.5 bg-white border border-ocean-200 hover:bg-ocean-100 text-ocean-700 font-bold text-xs rounded-xl shadow-xs transition flex-shrink-0"
            >
              📄 Dùng Đề Mẫu Toán {{ gradeLabel(lessonGrade).replace('Lớp ', '') }}
            </button>
          </div>

          <!-- File Upload Box -->
          <div class="border-2 border-dashed border-slate-200 hover:border-ocean-400 rounded-2xl p-6 text-center transition cursor-pointer relative bg-slate-50/50">
            <input
              type="file"
              accept=".pdf"
              data-testid="quiz-pdf-input"
              :disabled="isReadingPdf"
              @change="handlePdfUpload"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div class="space-y-2 pointer-events-none">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-ocean-100 text-ocean-600 flex items-center justify-center">
                <FileUp class="w-6 h-6" />
              </div>
              <div class="text-xs font-bold text-slate-700">
                {{ isReadingPdf ? 'Máy chủ đang đọc & bóc tách file PDF...' : uploadFileName ? `Đã chọn: ${uploadFileName}` : 'Nhấn hoặc Kéo thả file PDF đề thi vào đây' }}
              </div>
              <p class="text-[11px] text-slate-400">
                PDF xuất từ Word / LaTeX (có thể bôi đen chữ). Tối đa 20MB.
              </p>
            </div>
          </div>

          <!-- Textarea Input / Preview -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700">
              Hoặc dán nội dung văn bản đề thi (cùng định dạng "Câu 1. … A. … Đáp án: …"):
            </label>
            <textarea
              v-model="rawText"
              rows="12"
              placeholder="Dán nội dung đề thi vào đây... Ví dụ:&#10;Câu 1: Cho hàm số y = f(x)...&#10;A. Đáp án 1&#10;B. Đáp án 2&#10;C. Đáp án 3&#10;D. Đáp án 4&#10;Đáp án: A"
              class="w-full p-4 font-mono text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-ocean-500 outline-none leading-relaxed"
            ></textarea>
          </div>
        </div>

        <!-- BƯỚC 2: Trực quan hóa câu hỏi & Tinh chỉnh đáp án trên UI -->
        <div v-else class="space-y-6">
          <!-- Metadata Bar -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Tiêu đề đề thi</label>
              <input
                v-model="quizTitle"
                type="text"
                class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Thời gian làm bài (Phút)</label>
              <input
                v-model.number="durationMinutes"
                type="number"
                min="5"
                max="180"
                class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Hạn nộp bài</label>
              <input
                v-model="dueAt"
                type="datetime-local"
                class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <!-- Học sinh đã nộp bài -->
          <div v-if="hasSubmissions" class="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-start space-x-2">
            <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Đã có học sinh nộp bài nên không thể thêm hoặc xóa câu hỏi. Bạn vẫn sửa được nội dung, phương án và đáp án từng câu (điểm đã chấm sẽ không tự tính lại).</span>
          </div>

          <!-- Cảnh báo chung từ server -->
          <div v-if="parseWarnings.length" class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
            <div v-for="(w, i) in parseWarnings" :key="i" class="flex items-start space-x-2">
              <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ w }}</span>
            </div>
          </div>

          <!-- Instruction Tip -->
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Mẹo:</strong> Click trực tiếp vào bất kỳ phương án <strong>A, B, C, hoặc D</strong> bên dưới để chọn đáp án đúng ngay trên UI!
              </span>
            </div>
            <div class="text-right flex-shrink-0 pl-3">
              <span class="font-bold text-xs">{{ parsedQuestions.length }} câu hỏi</span>
              <div v-if="missingAnswerCount" class="text-[11px] font-bold text-rose-600">{{ missingAnswerCount }} câu thiếu đáp án</div>
            </div>
          </div>

          <!-- Questions List -->
          <div class="space-y-4">
            <div
              v-for="(q, qIndex) in parsedQuestions"
              :key="qIndex"
              :class="[
                'p-5 bg-white rounded-2xl border shadow-xs space-y-3.5 transition',
                questionNeedsAnswer(q) ? 'border-rose-300' : 'border-slate-200/90 hover:border-ocean-300'
              ]"
            >
              <!-- Question Header -->
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div class="flex items-center flex-wrap gap-2">
                  <span class="px-2.5 py-1 rounded-lg bg-ocean-600 text-white font-extrabold text-xs">
                    Câu {{ qIndex + 1 }}
                  </span>
                  <select
                    v-model="q.type"
                    @change="changeType(q)"
                    class="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  >
                    <option v-for="t in QUESTION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                  <select
                    v-model="q.difficulty"
                    class="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  >
                    <option value="EASY">Dễ (Nhận biết)</option>
                    <option value="MEDIUM">Trung bình (Thông hiểu)</option>
                    <option value="HARD">Vận dụng cao</option>
                  </select>
                  <span v-if="q.groupLabel" class="text-[10px] text-slate-400 truncate max-w-[16rem]" :title="q.groupLabel">{{ q.groupLabel }}</span>
                </div>

                <button
                  v-if="!hasSubmissions"
                  @click="removeQuestion(qIndex)"
                  class="text-slate-400 hover:text-rose-600 transition p-1"
                  title="Xóa câu hỏi này"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <!-- Cảnh báo riêng của câu -->
              <div v-if="q.warnings && q.warnings.length" class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 space-y-0.5">
                <div v-for="(w, i) in q.warnings" :key="i">⚠ {{ w }}</div>
              </div>

              <!-- Question Content & KaTeX preview -->
              <div class="space-y-1">
                <label class="block text-[11px] font-bold text-slate-600">Nội dung câu hỏi (Markdown / LaTeX):</label>
                <textarea
                  v-model="q.contentMd"
                  rows="2"
                  class="w-full p-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-1 focus:ring-ocean-500 outline-none"
                ></textarea>
                <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Xem trước công thức:</span>
                  <MathRenderer :content="q.contentMd" />
                </div>
              </div>

              <!-- Trắc nghiệm: 4 lựa chọn (A, B, C, D) -->
              <div v-if="q.type === 'MULTIPLE_CHOICE'" class="space-y-1.5">
                <label class="block text-[11px] font-bold text-slate-600">
                  Các lựa chọn (Click vào thẻ để chọn đáp án đúng):
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    v-for="choice in q.choices"
                    :key="choice.key"
                    @click="setCorrectAnswer(qIndex, choice.key)"
                    :class="[
                      'p-3 rounded-xl border-2 transition cursor-pointer flex items-center space-x-2.5',
                      q.correctAnswer === choice.key
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    ]"
                  >
                    <!-- Choice Badge -->
                    <div
                      :class="[
                        'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition',
                        q.correctAnswer === choice.key
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      ]"
                    >
                      {{ choice.key }}
                    </div>

                    <!-- Choice Text & Input -->
                    <div class="flex-1 min-w-0" @click.stop>
                      <input
                        v-model="choice.text"
                        class="w-full text-xs bg-transparent border-b border-transparent focus:border-slate-300 outline-none font-medium"
                      />
                      <div class="text-[11px] text-slate-600 mt-0.5 pointer-events-none">
                        <MathRenderer :content="choice.text" />
                      </div>
                    </div>

                    <!-- Selected Indicator -->
                    <div v-if="q.correctAnswer === choice.key" class="text-emerald-600 flex-shrink-0">
                      <CheckCircle2 class="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Đúng / Sai: 4 ý a) b) c) d) -->
              <div v-else-if="q.type === 'TRUE_FALSE'" class="space-y-1.5">
                <label class="block text-[11px] font-bold text-slate-600">Chọn Đúng / Sai cho từng ý a), b), c), d):</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div v-for="(label, i) in ['a', 'b', 'c', 'd']" :key="label" class="p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-700">{{ label }})</span>
                    <div class="flex space-x-1">
                      <button
                        type="button"
                        @click="setTrueFalse(q, i, 'Đ')"
                        :class="['px-2 py-0.5 rounded-md text-[11px] font-bold border', tfValues(q)[i] === 'Đ' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200']"
                      >Đúng</button>
                      <button
                        type="button"
                        @click="setTrueFalse(q, i, 'S')"
                        :class="['px-2 py-0.5 rounded-md text-[11px] font-bold border', tfValues(q)[i] === 'S' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200']"
                      >Sai</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Trả lời ngắn -->
              <div v-else-if="q.type === 'SHORT_ANSWER'" class="space-y-1">
                <label class="block text-[11px] font-bold text-slate-600">Đáp số đúng:</label>
                <input
                  v-model="q.correctAnswer"
                  placeholder="Ví dụ: 5 hoặc -3/2"
                  class="w-full sm:w-64 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <!-- Tự luận -->
              <div v-else class="text-[11px] text-slate-500 italic">
                Câu tự luận: học sinh viết lời giải, giáo viên chấm điểm thủ công.
              </div>

              <!-- Solution Explanation -->
              <div class="pt-1">
                <label class="block text-[11px] font-bold text-slate-500 mb-1">Lời giải chi tiết:</label>
                <input
                  v-model="q.solutionMd"
                  placeholder="Nhập hướng dẫn giải (tùy chọn)..."
                  class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Add question button -->
          <button
            v-if="!hasSubmissions"
            @click="addEmptyQuestion"
            class="w-full py-3 border-2 border-dashed border-slate-300 hover:border-ocean-500 text-slate-600 hover:text-ocean-600 font-bold text-xs rounded-2xl transition flex items-center justify-center space-x-2"
          >
            <Plus class="w-4 h-4" />
            <span>Thêm Câu Hỏi Mới</span>
          </button>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="p-6 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50 rounded-b-3xl">
        <div v-if="activeStep === 2 && !hasSubmissions">
          <button
            @click="activeStep = 1"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            ← {{ isEditMode ? 'Nạp Lại Đề Từ PDF' : 'Quay Lại Nhập Đề' }}
          </button>
        </div>
        <div v-else-if="activeStep === 1 && isEditMode">
          <button
            @click="activeStep = 2"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            ← Quay Lại Đề Hiện Tại
          </button>
        </div>
        <div v-else></div>

        <div class="flex items-center space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Đóng
          </button>

          <button
            v-if="activeStep === 1"
            @click="handleParseQuestions"
            :disabled="isReadingPdf || !rawText.trim()"
            class="px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <Sparkles class="w-4 h-4" />
            <span>Bóc Tách Câu Hỏi Tự Động →</span>
          </button>

          <button
            v-else
            @click="handlePublishQuiz"
            :disabled="isSubmitting || isLoadingExisting || parsedQuestions.length === 0"
            class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <Check class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Đang Lưu...' : (isEditMode ? 'Lưu Thay Đổi Bài Kiểm Tra' : 'Lưu & Xuất Bản Cho Lớp') }}</span>
          </button>
        </div>
      </div>

    </div>

    <PdfTemplateGuide v-if="showGuide" @close="showGuide = false" />
  </div>
</template>
