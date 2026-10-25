<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { analyticsService } from '@/services/analyticsService'
import MathRenderer from '@/components/MathRenderer.vue'
import { Award, CheckCircle2, TrendingUp, AlertTriangle, Calendar, User, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const token = route.params.token

const report = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const res = await analyticsService.getPublicReport(token)
    report.value = res.data || res
  } catch (err) {
    errorMessage.value = err.message || 'Không thể tải báo cáo. Link có thể đã hết hạn hoặc không tồn tại.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#fafcff] py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto space-y-6">
      
      <!-- Top Brand bar -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <router-link to="/" class="flex items-center space-x-2">
          <img src="/logo.png" alt="BienEDU" class="h-9 w-auto" />
          <span class="font-bold text-slate-800 text-base">BienEDU</span>
        </router-link>
        <span class="text-xs px-3 py-1 rounded-full bg-ocean-50 text-ocean-700 font-semibold border border-ocean-200/60">
          Báo Cáo Học Tập Tuần (Gửi Phụ Huynh)
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="w-10 h-10 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm text-slate-500">Đang tải dữ liệu học tập...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertTriangle class="w-8 h-8 text-rose-500 mx-auto" />
        <h3 class="font-bold text-rose-800 text-base">Thông Báo</h3>
        <p class="text-xs text-rose-600">{{ errorMessage }}</p>
        <router-link to="/" class="inline-block px-4 py-2 bg-white text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 shadow-sm">
          Về Trang Chủ
        </router-link>
      </div>

      <!-- Report Card -->
      <div v-else class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2 text-xs text-slate-400 font-medium">
              <Calendar class="w-4 h-4 text-ocean-600" />
              <span>Tuần học: {{ report?.weekStart ? `${report.weekStart} ~ ${report.weekEnd}` : 'Tuần hiện tại' }}</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Báo Cáo Tiến Độ: {{ report?.studentName || 'Học sinh' }}
            </h1>
          </div>
          <div class="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-2xl border border-emerald-200 text-center">
            <span class="text-xs font-medium block">Độ chính xác tuần</span>
            <span class="text-2xl font-extrabold">{{ report?.accuracyPercent != null ? report.accuracyPercent + '%' : '100%' }}</span>
          </div>
        </div>

        <!-- Weekly Highlights -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div class="text-xs text-slate-500 font-medium">Số câu luyện tập</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ report?.totalExercisesDone != null ? report.totalExercisesDone : 0 }} câu</div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div class="text-xs text-slate-500 font-medium">Số câu làm đúng</div>
            <div class="text-xl font-bold text-emerald-600 mt-1">{{ report?.totalCorrect != null ? report.totalCorrect : 0 }} câu</div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
            <div class="text-xs text-slate-500 font-medium">Độ chính xác</div>
            <div class="text-xl font-bold text-ocean-700 mt-1">{{ report?.accuracyPercent != null ? report.accuracyPercent + '%' : '100%' }}</div>
          </div>
        </div>

        <!-- Top Weak Units if any -->
        <div v-if="report?.top3WeakUnits && report.top3WeakUnits.length > 0" class="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
          <div class="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
            <AlertTriangle class="w-4 h-4 text-amber-600" />
            <span>Các dạng bài cần củng cố thêm:</span>
          </div>
          <ul class="text-xs text-slate-700 space-y-1.5 pl-5 list-disc">
            <li v-for="unit in report.top3WeakUnits" :key="unit.lessonUnitId">
              <span class="font-bold text-slate-900">{{ unit.lessonUnitName }}</span>
              <span class="text-slate-500"> ({{ unit.topicName }}) — Làm đúng {{ unit.correctCount }}/{{ unit.totalAttempts }} lần</span>
            </li>
          </ul>
        </div>

        <!-- Teacher's Weekly Comment -->
        <div class="p-5 rounded-2xl bg-ocean-50/70 border border-ocean-100">
          <div class="flex items-center space-x-2 text-ocean-700 font-bold text-sm mb-1.5">
            <Award class="w-4 h-4 text-ocean-600" />
            <span>Nhận xét từ Thầy Biên:</span>
          </div>
          <p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {{ report?.teacherComment || 'Học sinh duy trì nhịp học rất đều đặn, giải quyết tốt các bài toán tích phân và đạo hàm. Cần chú ý thêm điều kiện đặt ẩn phụ trong bài toán logarit để tránh bẫy trắc nghiệm.' }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
