<script setup>
import { ref, onMounted } from 'vue'
import { exerciseService } from '@/services/exerciseService'
import { catalogService } from '@/services/catalogService'
import MathRenderer from '@/components/MathRenderer.vue'
import { Database, Plus, Sparkles, CheckCircle2, AlertCircle, FileText, Upload, GraduationCap } from 'lucide-vue-next'

const activeTab = ref('batch') // 'batch' | 'create'
const targetGrade = ref(12)
const targetLessonUnitId = ref(120001)

const gradeList = [
  { grade: 6, label: 'Lớp 6 (THCS)', defaultUnit: 60001 },
  { grade: 7, label: 'Lớp 7 (THCS)', defaultUnit: 60001 },
  { grade: 8, label: 'Lớp 8 (THCS)', defaultUnit: 60001 },
  { grade: 9, label: 'Lớp 9 (Vào 10)', defaultUnit: 90001 },
  { grade: 10, label: 'Lớp 10 (CT 2018)', defaultUnit: 100001 },
  { grade: 11, label: 'Lớp 11 (THPT)', defaultUnit: 100001 },
  { grade: 12, label: 'Lớp 12 (THPTQG)', defaultUnit: 120001 }
]

const onGradeChange = () => {
  const g = gradeList.find(x => x.grade === targetGrade.value)
  if (g) targetLessonUnitId.value = g.defaultUnit
}

const rawExamText = ref(`Câu 1. Cho hàm số y = f(x) có đạo hàm f'(x) = x(x - 1)^2. Số điểm cực trị của hàm số đã cho là
A. 0.
B. 1.
C. 2.
D. 3.

Câu 2. Cho hàm số y = ax^3 + bx^2 + cx + d có đồ thị như hình vẽ. Mệnh đề nào dưới đây đúng?
A. a > 0, d > 0.
B. a < 0, d > 0.
C. a > 0, d < 0.
D. a < 0, d < 0.`)

const parsedQuestions = ref([])
const isParsing = ref(false)
const isSaving = ref(false)
const statusMessage = ref('')

// Single create state
const singleLessonUnitId = ref(120001)
const singleType = ref('MULTIPLE_CHOICE')
const singleDifficulty = ref('MEDIUM')
const singleContent = ref('Cho hàm số $y = x^3 - 3x$. Tính khoảng đồng biến của hàm số.')
const singleChoices = ref([
  { key: 'A', text: '$(-\\infty; -1)$ và $(1; +\\infty)$' },
  { key: 'B', text: '$(-1; 1)$' },
  { key: 'C', text: '$(-\\infty; 1)$' },
  { key: 'D', text: '$(1; +\\infty)$' }
])
const singleCorrectAnswer = ref('A')

const handleParseRaw = async () => {
  if (!rawExamText.value) return
  isParsing.value = true
  statusMessage.value = ''
  try {
    const res = await exerciseService.batchParse({
      rawText: rawExamText.value,
      lessonUnitId: Number(targetLessonUnitId.value)
    })
    parsedQuestions.value = res.data || res || []
    statusMessage.value = `Đã phân tích thành công ${parsedQuestions.value.length} câu hỏi!`
  } catch (err) {
    statusMessage.value = err.detail || err.message || 'Lỗi khi phân tích văn bản đề thi.'
  } finally {
    isParsing.value = false
  }
}

const handleBatchSave = async () => {
  if (parsedQuestions.value.length === 0) return
  isSaving.value = true
  try {
    const payload = parsedQuestions.value.map(q => ({
      lessonUnitId: targetLessonUnitId.value,
      type: q.type || 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      contentMd: q.contentMd,
      choices: q.choices,
      correctAnswer: q.correctAnswer || 'A'
    }))

    await exerciseService.batchSave(payload)
    statusMessage.value = `✓ Đã lưu thành công ${payload.length} câu hỏi vào ngân hàng bài tập (Khối ${targetGrade.value})!`
    parsedQuestions.value = []
    rawExamText.value = ''
  } catch (err) {
    statusMessage.value = err.detail || err.message || 'Lỗi khi lưu câu hỏi.'
  } finally {
    isSaving.value = false
  }
}

const handleCreateSingle = async () => {
  try {
    await exerciseService.createExercise({
      lessonUnitId: targetLessonUnitId.value,
      type: singleType.value,
      difficulty: singleDifficulty.value,
      contentMd: singleContent.value,
      choices: singleChoices.value,
      correctAnswer: singleCorrectAnswer.value
    })
    alert('Tạo câu hỏi thành công!')
    singleContent.value = ''
  } catch (err) {
    alert(err.detail || err.message || 'Lỗi khi tạo câu hỏi.')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Ngân Hàng Câu Hỏi & Đề Thi</h1>
        <p class="text-xs text-slate-500 mt-0.5">Soạn thảo, phân loại bẫy và bóc tách đề thi tự động bằng trí tuệ nhân tạo</p>
      </div>

      <!-- Mode Toggle -->
      <div class="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
        <button
          @click="activeTab = 'batch'"
          :class="[
            'px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1.5',
            activeTab === 'batch' ? 'bg-ocean-600 text-white' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Batch Parse Tự Động</span>
        </button>
        <button
          @click="activeTab = 'create'"
          :class="[
            'px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1.5',
            activeTab === 'create' ? 'bg-ocean-600 text-white' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Soạn Câu Đơn Lẻ</span>
        </button>
      </div>
    </div>

    <!-- Mode 1: Batch Parse Raw Text -->
    <div v-if="activeTab === 'batch'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left: Raw Input -->
      <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-900">Dán đề thi dạng văn bản</h3>
          <span class="text-[11px] text-slate-400">Hỗ trợ copy từ Word / PDF</span>
        </div>

        <!-- Grade Selector -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
            <select
              v-model="targetGrade"
              @change="onGradeChange"
              class="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500 font-medium"
            >
              <option v-for="g in gradeList" :key="g.grade" :value="g.grade">
                {{ g.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Mã Dạng Bài (LU)</label>
            <input
              v-model="targetLessonUnitId"
              type="number"
              class="w-full p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500 font-mono"
            />
          </div>
        </div>

        <textarea
          v-model="rawExamText"
          rows="14"
          placeholder="Dán nội dung đề thi vào đây (VD: Câu 1. Cho hàm số... A. ... B. ...)"
          class="w-full p-3.5 text-xs font-mono border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-ocean-500 leading-relaxed"
        ></textarea>

        <button
          @click="handleParseRaw"
          :disabled="isParsing || !rawExamText"
          class="w-full py-3 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Sparkles class="w-4 h-4" />
          <span>{{ isParsing ? 'Đang phân tích cú pháp...' : 'Phân Tích Cú Pháp Tự Động' }}</span>
        </button>

        <p v-if="statusMessage" class="text-xs text-center font-bold text-ocean-700">
          {{ statusMessage }}
        </p>
      </div>

      <!-- Right: Preview Parsed Questions with KaTeX -->
      <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Xem trước kết quả phân tích</h3>
            <span class="text-xs text-slate-400">{{ parsedQuestions.length }} câu hỏi đã nhận diện</span>
          </div>

          <button
            v-if="parsedQuestions.length > 0"
            @click="handleBatchSave"
            :disabled="isSaving"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            {{ isSaving ? 'Đang lưu...' : 'Lưu Tất Cả Vào Ngân Hàng' }}
          </button>
        </div>

        <div v-if="parsedQuestions.length === 0" class="py-20 text-center text-xs text-slate-400 space-y-2">
          <Database class="w-10 h-10 text-slate-300 mx-auto" />
          <p>Chưa có câu hỏi nào được parse. Hãy dán đề thi vào ô bên trái và bấm "Phân Tích Cú Pháp".</p>
        </div>

        <div v-else class="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <div 
            v-for="(q, idx) in parsedQuestions" 
            :key="idx"
            class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs"
          >
            <div class="flex justify-between font-bold text-ocean-800">
              <span>Câu hỏi {{ idx + 1 }}</span>
              <span class="text-emerald-700 font-mono">Đáp án: {{ q.correctAnswer || 'A' }}</span>
            </div>

            <div class="text-slate-800 font-medium">
              <MathRenderer :content="q.contentMd" />
            </div>

            <div v-if="q.choices" class="grid grid-cols-2 gap-2 pt-1">
              <div 
                v-for="c in q.choices" 
                :key="c.key"
                class="p-2 bg-white rounded-lg border border-slate-200 flex items-center space-x-1.5"
              >
                <span class="font-bold text-slate-500">{{ c.key }}.</span>
                <span>{{ c.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode 2: Single Create Form -->
    <div v-else class="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm max-w-3xl mx-auto space-y-5">
      <h3 class="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">Soạn thảo câu hỏi đơn lẻ</h3>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Nội dung câu hỏi (Hỗ trợ Markdown & công thức LaTeX $...$)</label>
        <textarea
          v-model="singleContent"
          rows="4"
          class="w-full p-3.5 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500"
        ></textarea>
      </div>

      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <span class="text-[11px] font-bold text-slate-500 block mb-1">Xem trước hiển thị:</span>
        <MathRenderer :content="singleContent" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Độ khó</label>
          <select v-model="singleDifficulty" class="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none">
            <option value="EASY">Nhận biết (Dễ)</option>
            <option value="MEDIUM">Thông hiểu (Trung bình)</option>
            <option value="HARD">Vận dụng cao (Khó)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Đáp án đúng</label>
          <select v-model="singleCorrectAnswer" class="w-full p-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      </div>

      <div class="pt-3 flex justify-end">
        <button
          @click="handleCreateSingle"
          class="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
        >
          Lưu Câu Hỏi Vào Ngân Hàng
        </button>
      </div>
    </div>
  </div>
</template>
