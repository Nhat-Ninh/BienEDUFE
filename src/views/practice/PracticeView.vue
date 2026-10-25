<script setup>
import { ref } from 'vue'
import MathRenderer from '@/components/MathRenderer.vue'
import { CheckCircle2, XCircle, RefreshCw, HelpCircle } from 'lucide-vue-next'

const selectedAnswer = ref(null)
const isSubmitted = ref(false)

const question = {
  id: 1,
  type: 'MULTIPLE_CHOICE',
  difficulty: 'MEDIUM',
  content: `Cho hình phẳng $(H)$ giới hạn bởi đồ thị hàm số $y = \\sqrt{x}$, trục hoành và hai đường thẳng $x = 1$, $x = 4$. Tính thể tích $V$ của khối tròn xoay tạo thành khi quay $(H)$ quanh trục $Ox$.`,
  choices: [
    { key: 'A', text: '$V = \\frac{15\\pi}{2}$' },
    { key: 'B', text: '$V = \\frac{7\\pi}{2}$' },
    { key: 'C', text: '$V = 15\\pi$' },
    { key: 'D', text: '$V = \\frac{15}{2}$' },
  ],
  correctAnswer: 'A',
  explanation: `Áp dụng công thức tính thể tích khối tròn xoay quanh trục $Ox$:
$$V = \\pi \\int_{a}^{b} [f(x)]^2 \\, dx = \\pi \\int_{1}^{4} (\\sqrt{x})^2 \\, dx = \\pi \\int_{1}^{4} x \\, dx$$
$$= \\pi \\left[ \\frac{x^2}{2} \\right]_{1}^{4} = \\pi \\left( \\frac{16}{2} - \\frac{1}{2} \\right) = \\frac{15\\pi}{2}$$
Vậy đáp án đúng là **A**.`
}

const handleSelect = (key) => {
  if (isSubmitted.value) return
  selectedAnswer.value = key
}

const handleSubmit = () => {
  if (!selectedAnswer.value) return
  isSubmitted.value = true
}

const handleReset = () => {
  selectedAnswer.value = null
  isSubmitted.value = false
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Luyện Tập Toán Học Trực Tuyến</h1>
        <p class="text-xs text-slate-500 mt-1">Luyện giải bài tập với công thức Toán sắc nét</p>
      </div>

      <button 
        @click="handleReset"
        class="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Làm lại câu này</span>
      </button>
    </div>

    <!-- Question Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <span class="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
          Câu hỏi 1 • Độ khó: Thông hiểu
        </span>
        <span class="text-xs text-slate-400">Trắc nghiệm 4 lựa chọn</span>
      </div>

      <!-- Question Text with KaTeX -->
      <div class="text-base text-slate-800 leading-relaxed font-medium">
        <MathRenderer :content="question.content" />
      </div>

      <!-- Choices List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <button
          v-for="choice in question.choices"
          :key="choice.key"
          @click="handleSelect(choice.key)"
          :class="[
            'text-left p-4 rounded-xl border text-sm font-medium transition flex items-center space-x-3',
            selectedAnswer === choice.key
              ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-200 text-sky-900'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700',
            isSubmitted && choice.key === question.correctAnswer
              ? '!border-emerald-500 !bg-emerald-50 !text-emerald-900 !ring-emerald-200'
              : '',
            isSubmitted && selectedAnswer === choice.key && choice.key !== question.correctAnswer
              ? '!border-rose-500 !bg-rose-50 !text-rose-900 !ring-rose-200'
              : ''
          ]"
        >
          <span 
            :class="[
              'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0',
              selectedAnswer === choice.key ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
            ]"
          >
            {{ choice.key }}
          </span>
          <div class="flex-1">
            <MathRenderer :content="choice.text" />
          </div>
        </button>
      </div>

      <!-- Action Button -->
      <div class="pt-4 flex justify-end">
        <button
          v-if="!isSubmitted"
          @click="handleSubmit"
          :disabled="!selectedAnswer"
          class="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl shadow-md transition"
        >
          Xác nhận nộp bài
        </button>
      </div>

      <!-- Explanation Box after submit -->
      <div 
        v-if="isSubmitted"
        :class="[
          'p-5 rounded-xl border space-y-3 mt-4',
          selectedAnswer === question.correctAnswer 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        ]"
      >
        <div class="flex items-center space-x-2 font-bold text-sm">
          <CheckCircle2 v-if="selectedAnswer === question.correctAnswer" class="w-5 h-5 text-emerald-600" />
          <XCircle v-else class="w-5 h-5 text-rose-600" />
          <span>
            {{ selectedAnswer === question.correctAnswer ? 'Chính xác! Bạn làm rất tốt.' : 'Chưa chính xác. Hãy xem lời giải chi tiết bên dưới:' }}
          </span>
        </div>

        <div class="pt-2 border-t border-slate-200/60 text-slate-800 text-sm">
          <div class="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-1">Lời giải chi tiết:</div>
          <MathRenderer :content="question.explanation" />
        </div>
      </div>
    </div>
  </div>
</template>
