<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { subscriptionService } from '@/services/subscriptionService'
import { 
  Check, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  Clock, 
  HelpCircle,
  GraduationCap
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const plans = ref([])
const loading = ref(true)

const formatCurrency = (val) => {
  if (!val || val === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

onMounted(async () => {
  try {
    const res = await subscriptionService.getPlans()
    plans.value = res?.data || []
  } catch (err) {
    console.error('Failed to load plans:', err)
  } finally {
    loading.value = false
  }
})

const handlePlanClick = (plan) => {
  if (authStore.isAuthenticated) {
    router.push('/app/subscription')
  } else {
    router.push({ path: '/auth/register', query: { planId: plan.id } })
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-between">
    <!-- Public Navbar -->
    <header class="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40">
      <router-link to="/" class="flex items-center space-x-2">
        <img src="/logo.png" alt="BienEDU" class="h-10 w-auto object-contain" />
      </router-link>
      <div class="flex items-center space-x-4">
        <router-link to="/" class="text-xs font-semibold text-slate-600 hover:text-ocean-600">
          Trang chủ
        </router-link>
        <router-link to="/roadmap" class="text-xs font-semibold text-slate-600 hover:text-ocean-600">
          Lộ trình K12
        </router-link>
        <router-link 
          v-if="!authStore.isAuthenticated"
          to="/auth/login" 
          class="text-xs font-bold text-ocean-600 hover:text-ocean-700 px-3 py-1.5 rounded-lg border border-ocean-200 hover:bg-ocean-50 transition"
        >
          Đăng nhập
        </router-link>
        <router-link 
          v-else
          to="/app/dashboard" 
          class="text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 px-4 py-2 rounded-xl transition shadow-sm"
        >
          Vào học tập
        </router-link>
      </div>
    </header>

    <!-- Main Pricing Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 flex-1 space-y-12">
      <div class="text-center max-w-2xl mx-auto">
        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-ocean-50 text-ocean-700 text-xs font-bold mb-3 border border-ocean-200">
          <Sparkles class="w-3.5 h-3.5 text-ocean-600" />
          <span>Bảng Giá Minh Bạch & Tiết Kiệm</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Chọn Gói Đồng Hành Cùng BienEDU
        </h1>
        <p class="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
          Được thiết kế riêng theo chuẩn chương trình Giáo Dục Phổ Thông mới 2025, giúp học sinh bứt phá điểm 9+ môn Toán.
        </p>
      </div>

      <!-- Plans Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        <div 
          v-for="plan in plans" 
          :key="plan.id"
          :class="[
            'relative bg-white rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 border',
            plan.id === 3 
              ? 'border-2 border-ocean-600 shadow-2xl ring-4 ring-ocean-100 transform -translate-y-2' 
              : 'border-slate-200/90 shadow-sm hover:shadow-lg'
          ]"
        >
          <div 
            v-if="plan.id === 3" 
            class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-ocean-600 to-indigo-600 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center space-x-1"
          >
            <Sparkles class="w-3 h-3 text-amber-300" />
            <span>Được 85% Học Sinh Lựa Chọn</span>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-slate-900">{{ plan.name }}</h3>
              <span class="text-xs px-3 py-1 rounded-full bg-slate-100 font-semibold text-slate-600 flex items-center space-x-1">
                <Clock class="w-3 h-3" />
                <span>{{ plan.durationDays }} ngày</span>
              </span>
            </div>

            <div class="mt-6 mb-8">
              <div class="flex items-baseline space-x-1">
                <span class="text-3xl sm:text-4xl font-black text-slate-900">{{ formatCurrency(plan.price) }}</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                {{ plan.price === 0 ? 'Dành riêng cho trải nghiệm học sinh mới' : `Thời hạn trọn vẹn ${plan.durationDays} ngày` }}
              </p>
            </div>

            <ul class="space-y-3.5 border-t border-slate-100 pt-6 text-xs text-slate-600">
              <li class="flex items-start space-x-2.5">
                <Check class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Kho bài tập đa dạng phân tầng 4 cấp độ</span>
              </li>
              <li class="flex items-start space-x-2.5">
                <Check class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Thi thử mô phỏng thời gian thực, có đồng hồ bấm giờ</span>
              </li>
              <li class="flex items-start space-x-2.5">
                <Check class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Sổ tay sửa sai Spaced Repetition (0-1-3-7 ngày)</span>
              </li>
              <li v-if="plan.id !== 1" class="flex items-start space-x-2.5 font-medium text-slate-800">
                <Check class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Báo cáo biểu đồ năng lực gửi phụ huynh Zalo</span>
              </li>
              <li v-if="plan.id === 3" class="flex items-start space-x-2.5 font-bold text-ocean-700">
                <Zap class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Hỗ trợ giáo viên chữa bài tự luận và phản hồi chi tiết</span>
              </li>
            </ul>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100">
            <button
              @click="handlePlanClick(plan)"
              :class="[
                'w-full py-3.5 px-4 rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center space-x-2 shadow-sm',
                plan.id === 3
                  ? 'bg-ocean-600 hover:bg-ocean-700 text-white shadow-ocean-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              ]"
            >
              <span>{{ plan.price === 0 ? 'Bắt Đầu Học Thử Miễn Phí' : 'Chọn Gói Học Này' }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
      BienEDU © 2025. Nền tảng học tập Toán THPT thông minh.
    </footer>
  </div>
</template>
