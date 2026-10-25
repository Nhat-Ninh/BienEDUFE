<script setup>
import { ref, computed, onMounted } from 'vue'
import { analyticsService } from '@/services/analyticsService'
import { BarChart3, TrendingUp, Award, Share2, Copy, Check, Calendar, CheckCircle2 } from 'lucide-vue-next'

const skillMap = ref(null)
const weeklyReport = ref(null)
const shareToken = ref('')
const copied = ref(false)
const isLoading = ref(true)

const publicShareUrl = computed(() => {
  if (!shareToken.value) return ''
  return `${window.location.origin}/report/public/${shareToken.value}`
})

const allPracticedUnits = computed(() => {
  if (!skillMap.value || !skillMap.value.sections) return []
  const list = []
  for (const s of skillMap.value.sections) {
    for (const t of (s.topics || [])) {
      for (const u of (t.lessonUnits || [])) {
        if (u.totalAttempts > 0) {
          const percent = Math.round((u.correctCount / u.totalAttempts) * 100)
          list.push({
            id: u.lessonUnitId,
            sectionName: s.sectionName,
            topicName: t.topicName,
            name: u.lessonUnitName,
            percent,
            masteryLevel: u.masteryLevel || (percent >= 80 ? 'MASTERED' : percent >= 60 ? 'AVERAGE' : 'WEAK'),
            totalAttempts: u.totalAttempts,
            correctCount: u.correctCount
          })
        }
      }
    }
  }
  return list
})

const loadAnalytics = async () => {
  isLoading.value = true
  try {
    const [skillRes, reportRes] = await Promise.allSettled([
      analyticsService.getMySkillMap(),
      analyticsService.getWeeklyReport()
    ])

    if (skillRes.status === 'fulfilled') skillMap.value = skillRes.value.data || skillRes.value
    if (reportRes.status === 'fulfilled') weeklyReport.value = reportRes.value.data || reportRes.value
  } catch (e) {
    console.error('Error loading analytics:', e)
  } finally {
    isLoading.value = false
  }
}

const handleCreateShareLink = async () => {
  try {
    const res = await analyticsService.createShareLink()
    shareToken.value = res.data || res
  } catch (err) {
    alert(err.message || 'Lỗi khi tạo link chia sẻ.')
  }
}

const copyShareUrl = () => {
  const url = `${window.location.origin}/report/public/${shareToken.value}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => copied.value = false, 2500)
}

onMounted(loadAnalytics)
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Báo Cáo Năng Lực & Tiến Độ Học Tập</h1>
        <p class="text-xs text-slate-500 mt-0.5">Phân tích ma trận kiến thức và đồng bộ kết quả gửi Phụ huynh</p>
      </div>

      <!-- Share Button -->
      <button
        @click="handleCreateShareLink"
        class="inline-flex items-center space-x-2 px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
      >
        <Share2 class="w-4 h-4" />
        <span>Tạo Link Chia Sẻ Zalo</span>
      </button>
    </div>

    <!-- Share Link Banner -->
    <div v-if="shareToken" class="p-5 bg-gradient-to-r from-ocean-50 to-sky-100 border border-ocean-200 rounded-3xl space-y-3">
      <div class="flex items-center space-x-2 font-bold text-sm text-ocean-900">
        <CheckCircle2 class="w-5 h-5 text-ocean-600" />
        <span>Link Báo Cáo Tuần Đã Sẵn Sàng Gửi Phụ Huynh!</span>
      </div>
      <p class="text-xs text-slate-600 leading-relaxed">
        Phụ huynh có thể bấm trực tiếp vào link này từ Zalo trên điện thoại để xem bảng điểm, độ chính xác và nhận xét của thầy cô mà không cần đăng nhập tài khoản.
      </p>
      <div class="flex items-center space-x-2 pt-1">
        <input 
          :value="publicShareUrl"
          readonly
          class="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl select-all outline-none"
        />
        <button
          @click="copyShareUrl"
          class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
        >
          <Check v-if="copied" class="w-4 h-4 text-emerald-300" />
          <Copy v-else class="w-4 h-4" />
          <span>{{ copied ? 'Đã chép link!' : 'Sao chép link' }}</span>
        </button>
      </div>
    </div>

    <!-- Weekly Performance Summary -->
    <div class="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <span class="text-xs font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-md uppercase">
            Báo cáo tuần
          </span>
          <h2 class="text-lg font-bold text-slate-900 mt-2">Tổng kết học tập tuần này</h2>
        </div>
        <div class="text-xs text-slate-400 flex items-center space-x-1">
          <Calendar class="w-3.5 h-3.5" />
          <span>{{ weeklyReport?.weekStart ? `${weeklyReport.weekStart} ~ ${weeklyReport.weekEnd}` : 'Tuần học hiện tại' }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span class="text-xs text-slate-500 font-medium">Tổng câu luyện tập tuần</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ weeklyReport?.totalExercisesDone != null ? weeklyReport.totalExercisesDone : 0 }} câu</div>
        </div>
        <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span class="text-xs text-slate-500 font-medium">Số câu giải đúng</span>
          <div class="text-2xl font-bold text-emerald-600 mt-1">{{ weeklyReport?.totalCorrect != null ? weeklyReport.totalCorrect : 0 }} câu</div>
        </div>
        <div class="p-4 bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
          <span class="text-xs text-slate-500 font-medium">Tỉ lệ chính xác</span>
          <div class="text-2xl font-bold text-ocean-700 mt-1">
            {{ weeklyReport && weeklyReport.totalExercisesDone > 0 ? (weeklyReport.accuracyPercent != null ? weeklyReport.accuracyPercent + '%' : '100%') : '0%' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Skill Map Breakdown -->
    <div class="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div class="pb-3 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-900">Ma trận thành thạo theo chuyên đề</h2>
        <p class="text-xs text-slate-500 mt-0.5">Tiến độ chi tiết từng phần kiến thức môn Toán</p>
      </div>

      <div v-if="allPracticedUnits.length > 0" class="space-y-4">
        <div 
          v-for="item in allPracticedUnits" 
          :key="item.id"
          class="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2"
        >
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-slate-900">{{ item.topicName }} - {{ item.name }}</span>
            <span 
              :class="[
                'px-2 py-0.5 rounded text-xs',
                item.percent >= 80 ? 'text-emerald-700 bg-emerald-100' : item.percent >= 60 ? 'text-ocean-700 bg-ocean-100' : 'text-rose-700 bg-rose-100'
              ]"
            >
              {{ item.masteryLevel }} ({{ item.percent }}%)
            </span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2.5">
            <div 
              :class="[
                'h-2.5 rounded-full transition-all duration-500',
                item.percent >= 80 ? 'bg-emerald-500' : item.percent >= 60 ? 'bg-ocean-600' : 'bg-rose-500'
              ]" 
              :style="{ width: `${item.percent}%` }"
            ></div>
          </div>
          <div class="text-[11px] text-slate-500 flex justify-between">
            <span>Đã làm: {{ item.totalAttempts }} câu</span>
            <span>Chính xác: {{ item.correctCount }} câu</span>
          </div>
        </div>
      </div>

      <!-- Empty state when no exercises done yet -->
      <div v-else class="py-12 text-center space-y-3">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
          <TrendingUp class="w-7 h-7 text-slate-300" />
        </div>
        <p class="text-sm font-bold text-slate-700">Chưa có dữ liệu bài làm để tổng hợp ma trận</p>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Mỗi câu hỏi bạn làm trong phần Luyện Tập hoặc Đề Thi sẽ được tự động phân tích và lưu trữ vào hồ sơ năng lực này.
        </p>
        <router-link to="/app/practice" class="inline-block px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow transition">
          Bắt đầu luyện tập ngay →
        </router-link>
      </div>
    </div>
  </div>
</template>