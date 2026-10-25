<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { assignmentService } from '@/services/assignmentService'
import { submissionService } from '@/services/submissionService'
import MathRenderer from '@/components/MathRenderer.vue'
import { Clock, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Send, HelpCircle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const assignmentId = route.params.assignmentId

const assignment = ref(null)
const exercises = ref([])
const currentIndex = ref(0)
const answers = ref({}) // map { exerciseId: studentAnswer }
const remainingSeconds = ref(45 * 60) // 45 minutes
const timer = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const showConfirmModal = ref(false)

const currentExercise = computed(() => exercises.value[currentIndex.value] || null)

const formatTime = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(async () => {
  try {
    // 1. Khởi tạo hoặc lấy bài làm hiện tại từ backend
    const startRes = await submissionService.start(assignmentId).catch(() => null)
    const assignRes = await assignmentService.getDetailStudent(assignmentId)
    
    assignment.value = assignRes.data || assignRes
    exercises.value = assignment.value?.exercises || [
      {
        id: 1,
        type: 'MULTIPLE_CHOICE',
        content: 'Cho hàm số $y = x^3 - 3x^2 + 2$. Điểm cực đại của đồ thị hàm số đã cho là:',
        choices: [
          { key: 'A', text: '$(0; 2)$' },
          { key: 'B', text: '$(2; -2)$' },
          { key: 'C', text: '$(0; -2)$' },
          { key: 'D', text: '$(2; 2)$' }
        ]
      },
      {
        id: 2,
        type: 'MULTIPLE_CHOICE',
        content: 'Tính tích phân $I = \\int_{0}^{1} e^{2x} \\, dx$.',
        choices: [
          { key: 'A', text: '$I = \\frac{e^2 - 1}{2}$' },
          { key: 'B', text: '$I = e^2 - 1$' },
          { key: 'C', text: '$I = \\frac{e^2 + 1}{2}$' },
          { key: 'D', text: '$I = 2(e^2 - 1)$' }
        ]
      },
      {
        id: 3,
        type: 'SHORT_ANSWER',
        content: 'Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 25$. Tìm bán kính $R$ của mặt cầu $(S)$.'
      }
    ]

    // Khôi phục câu trả lời từ localStorage nếu có
    const saved = localStorage.getItem(`bienedu_exam_${assignmentId}`)
    if (saved) {
      answers.value = JSON.parse(saved)
    }

    // Bắt đầu đếm ngược
    timer.value = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
      } else {
        handleSubmit()
      }
    }, 1000)
  } catch (e) {
    console.error('Error starting assignment:', e)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})

const selectChoice = (key) => {
  if (!currentExercise.value) return
  answers.value[currentExercise.value.id] = key
  // Autosave
  localStorage.setItem(`bienedu_exam_${assignmentId}`, JSON.stringify(answers.value))
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload = Object.entries(answers.value).map(([exId, ans]) => ({
      exerciseId: parseInt(exId),
      studentAnswer: ans
    }))

    const res = await submissionService.submit(assignmentId, payload)
    const subData = res.data || res
    localStorage.removeItem(`bienedu_exam_${assignmentId}`)

    if (subData?.id) {
      router.push(`/app/submissions/${subData.id}`)
    } else {
      router.push('/app/assignments')
    }
  } catch (err) {
    alert(err.message || 'Lỗi khi nộp bài.')
  } finally {
    isSubmitting.value = false
    showConfirmModal.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Top Bar: Timer & Actions -->
    <div class="sticky top-16 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center justify-between">
      <div>
        <h1 class="text-sm font-bold text-slate-900 leading-tight">{{ assignment?.title || 'Đang làm bài kiểm tra' }}</h1>
        <span class="text-xs text-slate-400">Câu {{ currentIndex + 1 }} / {{ exercises.length }}</span>
      </div>

      <div class="flex items-center space-x-4">
        <!-- Timer Pill -->
        <div 
          :class="[
            'px-3.5 py-1.5 rounded-full font-mono font-bold text-xs flex items-center space-x-1.5 border',
            remainingSeconds < 300 
              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
              : 'bg-ocean-50 text-ocean-700 border-ocean-200'
          ]"
        >
          <Clock class="w-3.5 h-3.5" />
          <span>{{ formatTime(remainingSeconds) }}</span>
        </div>

        <button
          @click="showConfirmModal = true"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1 cursor-pointer"
        >
          <Send class="w-3.5 h-3.5" />
          <span>Nộp Bài</span>
        </button>
      </div>
    </div>

    <!-- Question Palette Index Bar -->
    <div class="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm flex flex-wrap gap-2 items-center">
      <span class="text-xs font-semibold text-slate-400 mr-2">Mục lục:</span>
      <button
        v-for="(ex, idx) in exercises"
        :key="ex.id"
        @click="currentIndex = idx"
        :class="[
          'w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer',
          currentIndex === idx ? 'ring-2 ring-ocean-500 bg-ocean-600 text-white' : '',
          currentIndex !== idx && answers[ex.id] ? 'bg-ocean-100 text-ocean-800' : '',
          currentIndex !== idx && !answers[ex.id] ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : ''
        ]"
      >
        {{ idx + 1 }}
      </button>
    </div>

    <!-- Question Body Card -->
    <div v-if="currentExercise" class="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-ocean-50 text-ocean-700 uppercase">
          Câu {{ currentIndex + 1 }}
        </span>
        <span class="text-xs text-slate-400">
          {{ currentExercise.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm 4 lựa chọn' : 'Điền đáp số' }}
        </span>
      </div>

      <!-- Content -->
      <div class="text-base text-slate-800 leading-relaxed font-medium">
        <MathRenderer :content="currentExercise.content" />
      </div>

      <!-- Multiple Choice Options -->
      <div v-if="currentExercise.choices && currentExercise.choices.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <button
          v-for="c in currentExercise.choices"
          :key="c.key"
          @click="selectChoice(c.key)"
          :class="[
            'text-left p-4 rounded-xl border text-sm font-medium transition flex items-center space-x-3 cursor-pointer',
            answers[currentExercise.id] === c.key
              ? 'border-ocean-500 bg-ocean-50/80 ring-2 ring-ocean-200 text-ocean-900 font-semibold'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
          ]"
        >
          <span 
            :class="[
              'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0',
              answers[currentExercise.id] === c.key ? 'bg-ocean-600 text-white' : 'bg-slate-100 text-slate-600'
            ]"
          >
            {{ c.key }}
          </span>
          <div class="flex-1">
            <MathRenderer :content="c.text" />
          </div>
        </button>
      </div>

      <!-- Short Answer Input -->
      <div v-else-if="currentExercise.type === 'SHORT_ANSWER'" class="pt-2">
        <label class="block text-xs font-semibold text-slate-600 mb-1">Điền đáp số của bạn:</label>
        <input 
          :value="answers[currentExercise.id] || ''"
          @input="e => { answers[currentExercise.id] = e.target.value; localStorage.setItem(`bienedu_exam_${assignmentId}`, JSON.stringify(answers)); }"
          type="text" 
          placeholder="Ví dụ: 5 hoặc -3/2"
          class="w-full sm:w-64 px-4 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
        />
      </div>

      <!-- Essay Solution Input -->
      <div v-else-if="currentExercise.type === 'ESSAY'" class="pt-2 space-y-2">
        <label class="block text-xs font-semibold text-slate-700">Lời giải chi tiết bài tự luận:</label>
        <textarea
          :value="answers[currentExercise.id] || ''"
          @input="e => { answers[currentExercise.id] = e.target.value; localStorage.setItem(`bienedu_exam_${assignmentId}`, JSON.stringify(answers)); }"
          rows="5"
          placeholder="Trình bày các bước giải toán, lập luận và kết luận tại đây..."
          class="w-full p-3.5 text-xs font-sans border border-slate-300 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none leading-relaxed"
        ></textarea>
      </div>

      <!-- Navigation Footer -->
      <div class="pt-6 border-t border-slate-100 flex items-center justify-between">
        <button
          :disabled="currentIndex === 0"
          @click="currentIndex--"
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded-xl flex items-center space-x-1 cursor-pointer"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Câu trước</span>
        </button>

        <button
          :disabled="currentIndex === exercises.length - 1"
          @click="currentIndex++"
          class="px-4 py-2 text-xs font-bold text-ocean-600 hover:bg-ocean-50 disabled:opacity-30 rounded-xl flex items-center space-x-1 cursor-pointer"
        >
          <span>Câu tiếp theo</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Confirm Submit Modal -->
    <div v-if="showConfirmModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-base font-bold text-slate-900">Xác Nhận Nộp Bài?</h3>
        <p class="text-xs text-slate-600 leading-relaxed">
          Bạn đã trả lời được <strong class="text-ocean-600">{{ Object.keys(answers).length }}</strong> / {{ exercises.length }} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
        </p>

        <div class="flex justify-end space-x-3 pt-2">
          <button @click="showConfirmModal = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Làm tiếp</button>
          <button 
            @click="handleSubmit" 
            :disabled="isSubmitting"
            class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
          >
            {{ isSubmitting ? 'Đang nộp...' : 'Nộp Bài Luôn' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
