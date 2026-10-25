<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { classService } from '@/services/classService'
import { mistakeService } from '@/services/mistakeService'
import { analyticsService } from '@/services/analyticsService'
import { assignmentService } from '@/services/assignmentService'
import MathRenderer from '@/components/MathRenderer.vue'
import { 
  Users, 
  FileText, 
  RotateCcw, 
  TrendingUp, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  Clock,
  CheckCircle2, 
  AlertCircle,
  Plus,
  ShoppingCart
} from 'lucide-vue-next'

const authStore = useAuthStore()

// State
const dueMistakes = ref([])
const enrolledClasses = ref([])
const skillMap = ref(null)
const myAssignments = ref([])
const weeklyReport = ref(null)
const isLoading = ref(true)

const practicedUnits = computed(() => {
  if (!skillMap.value || !skillMap.value.sections) return []
  const list = []
  for (const s of skillMap.value.sections) {
    for (const t of (s.topics || [])) {
      for (const u of (t.lessonUnits || [])) {
        if (u.totalAttempts > 0) {
          const percent = Math.round((u.correctCount / u.totalAttempts) * 100)
          list.push({
            id: u.lessonUnitId,
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
  return list.slice(0, 4)
})

onMounted(async () => {
  try {
    if (authStore.isStudent) {
      // Load student data & ensure active subscription status is fetched
      const [dueRes, classRes, skillRes, assignRes, reportRes] = await Promise.allSettled([
        mistakeService.getDue(),
        classService.getEnrolledClasses(0, 5),
        analyticsService.getMySkillMap(),
        assignmentService.getMyAssignments(0, 5),
        analyticsService.getWeeklyReport(),
        authStore.fetchSubscription()
      ])

      if (dueRes.status === 'fulfilled') dueMistakes.value = dueRes.value.data || dueRes.value || []
      if (classRes.status === 'fulfilled') enrolledClasses.value = classRes.value.data?.content || classRes.value.content || []
      if (skillRes.status === 'fulfilled') skillMap.value = skillRes.value.data || skillRes.value || null
      if (assignRes.status === 'fulfilled') myAssignments.value = assignRes.value.data?.content || assignRes.value.content || []
      if (reportRes.status === 'fulfilled') weeklyReport.value = reportRes.value.data || reportRes.value || null
    } else {
      // Load teacher data
      const [classRes, assignRes] = await Promise.allSettled([
        classService.getMyClasses(0, 5),
        assignmentService.getMyAssignments(0, 5)
      ])
      if (classRes.status === 'fulfilled') enrolledClasses.value = classRes.value.data?.content || classRes.value.content || []
      if (assignRes.status === 'fulfilled') myAssignments.value = assignRes.value.data?.content || assignRes.value.content || []
    }
  } catch (e) {
    console.error('Error fetching dashboard data:', e)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    
    <!-- Welcome Banner with Brand Colors -->
    <div class="bg-gradient-to-r from-ocean-700 via-ocean-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-ocean-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm text-ocean-100">
          <Sparkles class="w-3.5 h-3.5 text-amber-300" />
          <span>{{ authStore.isTeacher ? 'Bảng Điều Khiển Giảng Dạy' : 'Không Gian Học Tập Toán BienEDU' }}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Chào bạn, {{ authStore.user?.fullName || 'Thành viên' }}! 👋
        </h1>
        <p class="text-ocean-100 text-xs sm:text-sm max-w-xl leading-relaxed">
          {{ authStore.isTeacher 
            ? 'Theo dõi tiến độ làm bài của học sinh và quản lý ngân hàng câu hỏi chuyên sâu.' 
            : 'Mỗi ngày tích lũy thêm một chút, kiên trì theo lộ trình 0-1-3-7 ngày để làm chủ điểm 9+.' }}
        </p>
      </div>

      <div class="flex items-center space-x-3 flex-shrink-0">
        <router-link
          v-if="authStore.isStudent"
          to="/app/practice"
          class="px-5 py-2.5 bg-white text-ocean-700 hover:bg-ocean-50 font-bold text-xs rounded-xl shadow transition"
        >
          Luyện Tập Ngay
        </router-link>
        <router-link
          v-else
          to="/app/teacher/exercises"
          class="px-5 py-2.5 bg-white text-ocean-700 hover:bg-ocean-50 font-bold text-xs rounded-xl shadow transition"
        >
          Tạo Câu Hỏi Mới
        </router-link>
      </div>
    </div>

    <!-- Student Dashboard Layout -->
    <template v-if="authStore.isStudent">
      <!-- Onboarding Banner for Non-Subscribed Student -->
      <div 
        v-if="!authStore.hasActivePlan" 
        data-testid="onboarding-no-plan-banner"
        class="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl text-white shadow-lg shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-5"
      >
        <div class="space-y-1.5">
          <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-amber-100 backdrop-blur-sm">
            <Sparkles class="w-3.5 h-3.5 text-yellow-300" />
            <span>Tài khoản mới kích hoạt</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight">
            Chào mừng bạn đến với BienEDU! Bạn chưa kích hoạt gói học
          </h2>
          <p class="text-white/90 text-xs sm:text-sm max-w-xl leading-relaxed">
            Hãy chọn gói học phù hợp để mở khóa toàn bộ kho tài liệu, ngân hàng 10.000+ câu hỏi Toán và thuật toán Spaced Repetition thông minh.
          </p>
        </div>
        <div class="flex items-center space-x-3 flex-shrink-0">
          <router-link
            to="/app/subscription"
            data-testid="dashboard-buy-course-btn"
            class="px-5 py-2.5 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <ShoppingCart class="w-4 h-4" />
            <span>Mua Khóa Học Ngay</span>
          </router-link>
          <router-link
            to="/app/classes"
            class="px-4 py-2.5 bg-black/20 hover:bg-black/30 text-white font-bold text-xs rounded-xl transition"
          >
            Nhập Mã Lớp
          </router-link>
        </div>
      </div>

      <!-- Active VIP Plan Banner (if student already has an active plan) -->
      <div 
        v-else 
        data-testid="active-plan-banner"
        class="p-4 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between"
      >
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
            🌟
          </div>
          <div>
            <div class="text-xs font-bold text-emerald-900 flex items-center space-x-2">
              <span>Đang Hoạt Động: {{ authStore.activePlanName }}</span>
              <span class="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">VIP</span>
            </div>
            <div class="text-[11px] text-emerald-700 mt-0.5">
              Thời hạn: Còn {{ authStore.daysRemaining }} ngày trải nghiệm đầy đủ các tính năng BienEDU
            </div>
          </div>
        </div>
        <router-link to="/app/subscription" class="text-xs font-bold text-emerald-700 hover:underline">
          Quản lý gói →
        </router-link>
      </div>

      <!-- Top KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Lớp đang theo học</span>
            <Users class="w-4 h-4 text-ocean-600" />
          </div>
          <div class="text-2xl font-bold text-slate-900 mt-2">{{ enrolledClasses.length }} lớp</div>
          <div class="text-[11px] text-slate-400 mt-0.5">
            {{ enrolledClasses.length > 0 ? (enrolledClasses[0].name || 'Khối ' + enrolledClasses[0].gradeLevel) : 'Chưa tham gia lớp nào' }}
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Bài tập cần nộp</span>
            <FileText class="w-4 h-4 text-amber-500" />
          </div>
          <div class="text-2xl font-bold text-slate-900 mt-2">{{ myAssignments.length }} bài</div>
          <div :class="['text-[11px] font-medium mt-0.5', myAssignments.length > 0 ? 'text-amber-600' : 'text-slate-400']">
            {{ myAssignments.length > 0 ? 'Ưu tiên hoàn thành' : 'Không có bài tồn đọng' }}
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Lỗi sai cần ôn hôm nay</span>
            <RotateCcw class="w-4 h-4 text-rose-500" />
          </div>
          <div class="text-2xl font-bold text-rose-600 mt-2">{{ dueMistakes.length }} câu</div>
          <div :class="['text-[11px] font-medium mt-0.5', dueMistakes.length > 0 ? 'text-rose-500' : 'text-slate-400']">
            {{ dueMistakes.length > 0 ? 'Theo chu kỳ 0-1-3-7' : 'Tuyệt vời, không có lỗi sai' }}
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Chỉ số thành thạo</span>
            <TrendingUp class="w-4 h-4 text-emerald-600" />
          </div>
          <div class="text-2xl font-bold text-emerald-600 mt-2">
            {{ weeklyReport && weeklyReport.totalExercisesDone > 0 ? (weeklyReport.accuracyPercent != null ? weeklyReport.accuracyPercent + '%' : '100%') : '0%' }}
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5">
            {{ weeklyReport && weeklyReport.totalExercisesDone > 0 ? (weeklyReport.accuracyPercent >= 80 ? 'Mức độ: Tốt' : 'Đang rèn luyện') : 'Chưa có dữ liệu bài làm' }}
          </div>
        </div>
      </div>

      <!-- Spaced Repetition Due Alert Card -->
      <div v-if="dueMistakes.length > 0" class="p-5 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-start space-x-3.5">
          <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <RotateCcw class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900">Bạn có {{ dueMistakes.length }} câu hỏi đến hạn ôn tập hôm nay!</h3>
            <p class="text-xs text-slate-600 mt-0.5">
              Hệ thống tự động nhắc nhở ôn lại các câu từng làm sai để khắc sâu ghi nhớ, tránh lặp lại bẫy trắc nghiệm.
            </p>
          </div>
        </div>

        <router-link
          to="/app/mistakes"
          class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition self-end sm:self-center flex-shrink-0"
        >
          Mở Sổ Tay Ôn Tập →
        </router-link>
      </div>

      <!-- Grid: Assignments & Skill Map -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Assignments -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 class="text-base font-bold text-slate-900">Bài tập & Đề thi gần đây</h2>
              <p class="text-xs text-slate-500">Các bài tập được giao từ lớp học</p>
            </div>
            <router-link to="/app/assignments" class="text-xs font-semibold text-ocean-600 hover:underline">
              Xem tất cả
            </router-link>
          </div>

          <div v-if="myAssignments.length > 0" class="divide-y divide-slate-100">
            <div 
              v-for="item in myAssignments"
              :key="item.id"
              class="py-3.5 flex items-center justify-between gap-4"
            >
              <div class="flex items-start space-x-3">
                <FileText class="w-4 h-4 text-ocean-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 class="text-xs font-bold text-slate-800 leading-snug">{{ item.title }}</h4>
                  <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                    <Clock class="w-3 h-3" />
                    <span>Hạn: {{ item.dueAt || 'Không giới hạn' }}</span>
                  </div>
                </div>
              </div>

              <router-link
                :to="`/app/assignments/${item.id}/do`"
                class="px-3 py-1.5 text-xs font-semibold bg-ocean-50 text-ocean-700 hover:bg-ocean-100 rounded-lg transition flex-shrink-0"
              >
                Vào làm
              </router-link>
            </div>
          </div>

          <!-- Empty state when student has no assignments -->
          <div v-else class="py-10 text-center space-y-2">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
              <FileText class="w-6 h-6 text-slate-300" />
            </div>
            <p class="text-xs font-bold text-slate-700">Chưa có bài tập nào được giao</p>
            <p class="text-[11px] text-slate-400 max-w-xs mx-auto">
              Khi giáo viên giao bài tập hoặc bạn tham gia lớp học, danh sách bài tập sẽ hiển thị tại đây.
            </p>
            <router-link to="/app/classes" class="inline-block mt-1 text-xs font-bold text-ocean-600 hover:underline">
              Tham gia lớp học ngay →
            </router-link>
          </div>
        </div>

        <!-- Skill Map Preview -->
        <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 class="text-base font-bold text-slate-900">Bản đồ năng lực Toán</h2>
              <p class="text-xs text-slate-500">Mức độ làm chủ theo từng chuyên đề</p>
            </div>
            <router-link to="/app/analytics" class="text-xs font-semibold text-ocean-600 hover:underline">
              Chi tiết
            </router-link>
          </div>

          <div v-if="practicedUnits.length > 0" class="space-y-3.5 pt-1">
            <div v-for="unit in practicedUnits" :key="unit.id">
              <div class="flex justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700 truncate max-w-[210px]" :title="unit.name">{{ unit.name }}</span>
                <span :class="[
                  'font-bold',
                  unit.percent >= 80 ? 'text-emerald-600' : unit.percent >= 60 ? 'text-ocean-600' : 'text-rose-500'
                ]">
                  {{ unit.percent }}% ({{ unit.masteryLevel }})
                </span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all duration-500',
                    unit.percent >= 80 ? 'bg-emerald-500' : unit.percent >= 60 ? 'bg-ocean-600' : 'bg-rose-500'
                  ]" 
                  :style="{ width: `${unit.percent}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Empty state when student hasn't practiced yet -->
          <div v-else class="py-10 text-center space-y-2">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
              <TrendingUp class="w-6 h-6 text-slate-300" />
            </div>
            <p class="text-xs font-bold text-slate-700">Chưa có dữ liệu năng lực</p>
            <p class="text-[11px] text-slate-400 max-w-xs mx-auto">
              Hoàn thành bài luyện tập đầu tiên để hệ thống AI đánh giá và vẽ biểu đồ năng lực theo từng chuyên đề.
            </p>
            <router-link to="/app/practice" class="inline-block mt-1 text-xs font-bold text-ocean-600 hover:underline">
              Bắt đầu luyện tập ngay →
            </router-link>
          </div>

          <div class="pt-2">
            <router-link
              to="/app/analytics"
              class="w-full py-2 text-center text-xs font-bold text-ocean-700 bg-ocean-50 hover:bg-ocean-100 rounded-xl block transition"
            >
              Tạo link chia sẻ báo cáo gửi Phụ Huynh qua Zalo 📲
            </router-link>
          </div>
        </div>
      </div>
    </template>

    <!-- Teacher Dashboard Layout -->
    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Lớp học phụ trách</span>
            <Users class="w-4 h-4 text-ocean-600" />
          </div>
          <div class="text-2xl font-bold text-slate-900 mt-2">{{ enrolledClasses.length }} lớp</div>
          <div class="text-[11px] text-slate-400 mt-0.5">
            {{ enrolledClasses.length > 0 ? 'Đang hoạt động' : 'Chưa có lớp nào' }}
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Bài tập đang mở</span>
            <FileText class="w-4 h-4 text-sky-500" />
          </div>
          <div class="text-2xl font-bold text-slate-900 mt-2">{{ myAssignments.length }} bài</div>
          <div class="text-[11px] text-slate-400 mt-0.5">
            {{ myAssignments.length > 0 ? 'Đang giao' : 'Chưa giao bài nào' }}
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Bài nộp chờ chấm</span>
            <CheckCircle2 class="w-4 h-4 text-amber-500" />
          </div>
          <div class="text-2xl font-bold text-amber-600 mt-2">0 bài</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Tự luận chụp ảnh</div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Ngân hàng câu hỏi</span>
            <Sparkles class="w-4 h-4 text-indigo-600" />
          </div>
          <div class="text-2xl font-bold text-indigo-600 mt-2">Toán 6-12</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Đã phân loại bẫy</div>
        </div>
      </div>

      <!-- Quick Action Buttons for Teacher -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <router-link
          to="/app/teacher/exercises"
          class="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-ocean-300 hover:shadow-md transition flex items-center space-x-4"
        >
          <div class="w-11 h-11 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center font-bold">
            <Plus class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-900">Batch Parse Đề Thi Thô</h4>
            <p class="text-[11px] text-slate-500 mt-0.5">Tự động bóc tách từ file Word / text</p>
          </div>
        </router-link>

        <router-link
          to="/app/assignments"
          class="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-ocean-300 hover:shadow-md transition flex items-center space-x-4"
        >
          <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-900">Tạo Đề Thi Mới</h4>
            <p class="text-[11px] text-slate-500 mt-0.5">Giao bài cho lớp và đặt hạn nộp</p>
          </div>
        </router-link>

        <router-link
          to="/app/teacher/grading"
          class="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-ocean-300 hover:shadow-md transition flex items-center space-x-4"
        >
          <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-900">Chấm Bài Tự Luận</h4>
            <p class="text-[11px] text-slate-400 mt-0.5">Xem ảnh nộp & nhận xét theo mẫu</p>
          </div>
        </router-link>
      </div>
    </template>

  </div>
</template>