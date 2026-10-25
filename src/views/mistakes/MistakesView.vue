<script setup>
import { ref, onMounted } from 'vue'
import { mistakeService } from '@/services/mistakeService'
import MathRenderer from '@/components/MathRenderer.vue'
import { RotateCcw, CheckCircle2, Clock, Calendar, Sparkles, MessageSquare, AlertCircle } from 'lucide-vue-next'

const dueMistakes = ref([])
const allMistakes = ref([])
const activeTab = ref('due') // 'due' | 'all'
const isLoading = ref(true)

// Editing error reason
const editingMistakeId = ref(null)
const editingReasonValue = ref('CALCULATION_ERROR')

const reasonLabels = {
  WRONG_FORMULA: '📐 Sai công thức toán',
  CALCULATION_ERROR: '🔢 Tính toán nhầm số',
  MISUNDERSTOOD_CONCEPT: '💡 Bẫy đề / Hiểu sai khái niệm',
  CARELESS: '⚠️ Bất cẩn / Đọc sót đề',
  OTHER: '📝 Lý do khác'
}

const loadData = async () => {
  isLoading.value = true
  try {
    const [dueRes, allRes] = await Promise.allSettled([
      mistakeService.getDue(),
      mistakeService.getAll(0, 50)
    ])

    if (dueRes.status === 'fulfilled') dueMistakes.value = dueRes.value.data || dueRes.value || []
    if (allRes.status === 'fulfilled') allMistakes.value = allRes.value.data?.content || allRes.value.content || []
  } catch (e) {
    console.error('Error fetching mistakes:', e)
  } finally {
    isLoading.value = false
  }
}

const handleAdvance = async (mistakeId) => {
  try {
    await mistakeService.resolve(mistakeId)
    await loadData()
  } catch (err) {
    alert(err.message || 'Lỗi khi cập nhật tiến độ ôn tập.')
  }
}

const saveReason = async (mistakeId) => {
  if (!editingReasonValue.value) return
  try {
    await mistakeService.updateReason(mistakeId, editingReasonValue.value)
    editingMistakeId.value = null
    await loadData()
  } catch (err) {
    alert(err.message || 'Lỗi khi lưu nguyên nhân.')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2 text-xs font-semibold text-rose-600 mb-1">
          <RotateCcw class="w-4 h-4" />
          <span>Phương pháp Spaced Repetition (0 - 1 - 3 - 7 ngày)</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Sổ Tay Lỗi Sai Của Bạn</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Tự động ghi nhận câu sai từ các đề kiểm tra và nhắc bạn làm lại định kỳ để không bao giờ tái phạm
        </p>
      </div>

      <!-- Tab Buttons -->
      <div class="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
        <button
          @click="activeTab = 'due'"
          :class="[
            'px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1.5',
            activeTab === 'due' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <span>Đến hạn ôn hôm nay</span>
          <span v-if="dueMistakes.length" class="px-1.5 py-0.2 bg-white text-rose-700 rounded-full text-[10px]">
            {{ dueMistakes.length }}
          </span>
        </button>
        <button
          @click="activeTab = 'all'"
          :class="[
            'px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer',
            activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Toàn bộ lịch sử ({{ allMistakes.length }})
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div 
      v-if="!isLoading && (activeTab === 'due' ? dueMistakes.length === 0 : allMistakes.length === 0)" 
      class="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3"
    >
      <CheckCircle2 class="w-12 h-12 text-emerald-500 mx-auto" />
      <h3 class="text-base font-bold text-slate-900">
        {{ activeTab === 'due' ? 'Tuyệt vời! Không có câu hỏi nào đến hạn hôm nay' : 'Sổ tay lỗi sai trống' }}
      </h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        {{ activeTab === 'due' ? 'Bạn đã hoàn thành tốt các chu kỳ ôn tập. Hãy tiếp tục duy trì nhé!' : 'Khi làm bài thi hoặc luyện đề, các câu bạn trả lời sai sẽ tự động xuất hiện tại đây.' }}
      </p>
    </div>

    <!-- Mistakes List -->
    <div v-else class="space-y-4">
      <div 
        v-for="(item, idx) in (activeTab === 'due' ? dueMistakes : allMistakes)"
        :key="item.id"
        class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700">
              Lỗi sai #{{ idx + 1 }}
            </span>
            <span class="text-xs font-bold text-slate-500">
              Chặng ôn: Giai đoạn {{ item.reviewStage || 1 }}/4
            </span>
          </div>

          <div class="flex items-center space-x-2 text-xs text-slate-400">
            <Calendar class="w-3.5 h-3.5" />
            <span>Ôn lần tới: {{ item.nextReviewAt || 'Hôm nay' }}</span>
          </div>
        </div>

        <!-- Question content with KaTeX -->
        <div class="text-sm font-medium text-slate-800 leading-relaxed">
          <MathRenderer :content="item.exerciseContent || 'Nội dung câu hỏi ôn tập'" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
            <span class="text-slate-500 block font-medium">Đáp án bạn từng chọn sai:</span>
            <span class="font-bold text-rose-700 font-mono text-sm">{{ item.studentAnswer || 'A' }}</span>
          </div>
          <div class="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <span class="text-slate-500 block font-medium">Đáp án chuẩn xác:</span>
            <span class="font-bold text-emerald-700 font-mono text-sm">{{ item.correctAnswer || 'C' }}</span>
          </div>
        </div>

        <!-- Self-Reflection Error Reason Section -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <MessageSquare class="w-3.5 h-3.5 text-ocean-600" />
              <span>Ghi chú tự phân tích nguyên nhân sai lầm:</span>
            </div>
            <button
              v-if="editingMistakeId !== item.id"
              @click="editingMistakeId = item.id; editingReasonValue = item.errorReason || 'CALCULATION_ERROR'"
              class="text-[11px] font-semibold text-ocean-600 hover:underline cursor-pointer"
            >
              {{ item.errorReason ? 'Sửa phân loại' : '+ Phân loại nguyên nhân' }}
            </button>
          </div>

          <p v-if="editingMistakeId !== item.id" class="text-xs text-slate-700 font-medium">
            <span v-if="item.errorReason" class="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
              {{ reasonLabels[item.errorReason] || item.errorReason }}
            </span>
            <span v-else class="text-slate-400 italic">
              Chưa phân loại nguyên nhân (Bấm nút trên để ghi nhận bẫy đề)
            </span>
          </p>

          <div v-else class="space-y-2 pt-1">
            <select 
              v-model="editingReasonValue"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500 bg-white font-medium"
            >
              <option value="WRONG_FORMULA">📐 Sai công thức toán</option>
              <option value="CALCULATION_ERROR">🔢 Tính toán nhầm số</option>
              <option value="MISUNDERSTOOD_CONCEPT">💡 Bẫy đề / Hiểu sai khái niệm</option>
              <option value="CARELESS">⚠️ Bất cẩn / Đọc sót đề</option>
              <option value="OTHER">📝 Lý do khác</option>
            </select>
            <div class="flex justify-end space-x-2">
              <button @click="editingMistakeId = null" class="px-3 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer">Hủy</button>
              <button @click="saveReason(item.id)" class="px-3 py-1 text-xs font-bold bg-ocean-600 text-white rounded-lg cursor-pointer">Lưu lại</button>
            </div>
          </div>
        </div>

        <!-- Confirm Advance Stage Button -->
        <div class="pt-2 flex justify-end">
          <button
            @click="handleAdvance(item.id)"
            class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>Tôi Đã Hiểu & Chuyển Sang Chặng Tiếp Theo</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
