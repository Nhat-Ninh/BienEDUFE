<script setup>
import { ref } from 'vue'
import { extractTextFromPdf, parseExamQuestions } from '@/utils/mathExamParser'
import { lessonService } from '@/services/lessonService'
import MathRenderer from '@/components/MathRenderer.vue'
import { 
  X, 
  Sparkles, 
  FileUp, 
  Check, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  BookOpen, 
  AlertCircle,
  FileText
} from 'lucide-vue-next'

const props = defineProps({
  lesson: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'quizCreated'])

// State
const activeStep = ref(1) // 1: Input PDF/Text, 2: Visual Editor & Publish
const isReadingPdf = ref(false)
const rawText = ref('')
const uploadFileName = ref('')
const parsedQuestions = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

// Quiz metadata
const quizTitle = ref(`Bài kiểm tra: ${props.lesson.title}`)
const quizDescription = ref('Bài kiểm tra trắc nghiệm đánh giá mức độ tiếp thu lý thuyết')
const durationMinutes = ref(15)
const dueAt = ref('')

// Đề thi mẫu Toán 12 để trải nghiệm 1 chạm
const loadSampleExam = () => {
  rawText.value = `Câu 1: Cho hàm số $y = x^3 - 3x^2 + 2$. Điểm cực đại của đồ thị hàm số là:
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

// Xử lý khi người dùng chọn file PDF
const handlePdfUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploadFileName.value = file.name
  isReadingPdf.value = true
  errorMessage.value = ''

  try {
    const text = await extractTextFromPdf(file)
    rawText.value = text
  } catch (err) {
    errorMessage.value = err.message || 'Không thể đọc nội dung file PDF.'
  } finally {
    isReadingPdf.value = false
  }
}

// Chạy thuật toán bóc tách câu hỏi
const handleParseQuestions = () => {
  if (!rawText.value.trim()) {
    errorMessage.value = 'Vui lòng dán văn bản hoặc tải lên file PDF đề thi.'
    return
  }

  const result = parseExamQuestions(rawText.value)
  if (result.length === 0) {
    errorMessage.value = 'Không tìm thấy câu hỏi nào hợp lệ. Đảm bảo cấu trúc đề thi có dạng: "Câu 1: ... A. ... B. ... C. ... D. ..."'
    return
  }

  parsedQuestions.value = result
  errorMessage.value = ''
  activeStep.value = 2
}

// Click trực tiếp vào đáp án A/B/C/D để chọn đáp án đúng
const setCorrectAnswer = (questionIndex, choiceId) => {
  parsedQuestions.value[questionIndex].correctAnswer = choiceId
}

// Xóa câu hỏi khỏi danh sách
const removeQuestion = (index) => {
  parsedQuestions.value.splice(index, 1)
}

// Thêm câu hỏi thủ công
const addEmptyQuestion = () => {
  parsedQuestions.value.push({
    contentMd: 'Câu hỏi mới: Điền nội dung câu hỏi tại đây...',
    type: 'MULTIPLE_CHOICE',
    difficulty: 'MEDIUM',
    choices: [
      { id: 'A', content: 'Phương án A' },
      { id: 'B', content: 'Phương án B' },
      { id: 'C', content: 'Phương án C' },
      { id: 'D', content: 'Phương án D' }
    ],
    correctAnswer: 'A',
    solutionMd: ''
  })
}

// Lưu & Xuất bản bài kiểm tra
const handlePublishQuiz = async () => {
  if (parsedQuestions.value.length === 0) {
    errorMessage.value = 'Đề thi phải có ít nhất 1 câu hỏi.'
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
      questions: parsedQuestions.value
    }

    const res = await lessonService.createQuizForLesson(props.lesson.id, payload)
    successMessage.value = '🎉 Xuất bản bài kiểm tra thành công!'
    emit('quizCreated', res.data || res)
    setTimeout(() => {
      emit('close')
    }, 1200)
  } catch (err) {
    errorMessage.value = err.response?.data?.message || err.message || 'Lỗi khi tạo bài kiểm tra.'
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
            Tạo Bài Kiểm Tra Cho Bài Học: {{ lesson.title }}
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

        <!-- BƯỚC 1: Chọn file PDF hoặc Dán văn bản -->
        <div v-if="activeStep === 1" class="space-y-5">
          <div class="bg-gradient-to-r from-ocean-50 to-sky-50 border border-ocean-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-0.5">
              <h4 class="text-xs font-bold text-ocean-900">Cách thức hoạt động</h4>
              <p class="text-[11px] text-slate-600">
                Tải lên file PDF đề thi hoặc dán nội dung thô. Hệ thống AI Parser sẽ tự động bóc tách từng câu hỏi, công thức toán LaTeX, 4 đáp án và đáp án đúng.
              </p>
            </div>
            <button
              @click="loadSampleExam"
              class="px-3.5 py-1.5 bg-white border border-ocean-200 hover:bg-ocean-100 text-ocean-700 font-bold text-xs rounded-xl shadow-xs transition flex-shrink-0"
            >
              📄 Dùng Đề Mẫu Toán 12
            </button>
          </div>

          <!-- File Upload Box -->
          <div class="border-2 border-dashed border-slate-200 hover:border-ocean-400 rounded-2xl p-6 text-center transition cursor-pointer relative bg-slate-50/50">
            <input 
              type="file" 
              accept=".pdf,.txt"
              @change="handlePdfUpload"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div class="space-y-2 pointer-events-none">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-ocean-100 text-ocean-600 flex items-center justify-center">
                <FileUp class="w-6 h-6" />
              </div>
              <div class="text-xs font-bold text-slate-700">
                {{ isReadingPdf ? 'Đang đọc nội dung file PDF...' : uploadFileName ? `Đã chọn: ${uploadFileName}` : 'Nhấn hoặc Kéo thả file PDF đề thi vào đây' }}
              </div>
              <p class="text-[11px] text-slate-400">
                Hỗ trợ file PDF hoặc văn bản chứa các câu hỏi Toán
              </p>
            </div>
          </div>

          <!-- Textarea Input / Preview -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700">
              Nội dung văn bản đề thi (Có thể chỉnh sửa hoặc dán thêm):
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

          <!-- Instruction Tip -->
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Mẹo:</strong> Click trực tiếp vào bất kỳ phương án <strong>A, B, C, hoặc D</strong> bên dưới để chọn đáp án đúng ngay trên UI!
              </span>
            </div>
            <span class="font-bold text-xs">{{ parsedQuestions.length }} câu hỏi</span>
          </div>

          <!-- Questions List -->
          <div class="space-y-4">
            <div 
              v-for="(q, qIndex) in parsedQuestions" 
              :key="qIndex"
              class="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5 hover:border-ocean-300 transition"
            >
              <!-- Question Header -->
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div class="flex items-center space-x-3">
                  <span class="px-2.5 py-1 rounded-lg bg-ocean-600 text-white font-extrabold text-xs">
                    Câu {{ qIndex + 1 }}
                  </span>
                  <select 
                    v-model="q.difficulty"
                    class="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                  >
                    <option value="EASY">Dễ (Nhận biết)</option>
                    <option value="MEDIUM">Trung bình (Thông hiểu)</option>
                    <option value="HARD">Vận dụng cao</option>
                  </select>
                </div>

                <button 
                  @click="removeQuestion(qIndex)"
                  class="text-slate-400 hover:text-rose-600 transition p-1"
                  title="Xóa câu hỏi này"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
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

              <!-- Interactive 4 Choices (A, B, C, D) -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-slate-600">
                  Các lựa chọn (Click vào thẻ để chọn đáp án đúng):
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div 
                    v-for="choice in q.choices" 
                    :key="choice.id"
                    @click="setCorrectAnswer(qIndex, choice.id)"
                    :class="[
                      'p-3 rounded-xl border-2 transition cursor-pointer flex items-center space-x-2.5',
                      q.correctAnswer === choice.id
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    ]"
                  >
                    <!-- Choice Badge -->
                    <div 
                      :class="[
                        'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition',
                        q.correctAnswer === choice.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      ]"
                    >
                      {{ choice.id }}
                    </div>

                    <!-- Choice Text & Input -->
                    <div class="flex-1 min-w-0" @click.stop>
                      <input 
                        v-model="choice.content" 
                        class="w-full text-xs bg-transparent border-b border-transparent focus:border-slate-300 outline-none font-medium"
                      />
                      <div class="text-[11px] text-slate-600 mt-0.5 pointer-events-none">
                        <MathRenderer :content="choice.content" />
                      </div>
                    </div>

                    <!-- Selected Indicator -->
                    <div v-if="q.correctAnswer === choice.id" class="text-emerald-600 flex-shrink-0">
                      <CheckCircle2 class="w-4 h-4" />
                    </div>
                  </div>
                </div>
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
        <div v-if="activeStep === 2">
          <button
            @click="activeStep = 1"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            ← Quay Lại Nhập Đề
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
            :disabled="isSubmitting || parsedQuestions.length === 0"
            class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <Check class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Đang Xuất Bản...' : 'Lưu & Xuất Bản Cho Lớp' }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
