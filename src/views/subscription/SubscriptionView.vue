<script setup>
import { ref, onMounted } from 'vue'
import { subscriptionService } from '@/services/subscriptionService'
import { useAuthStore } from '@/stores/auth'
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  CreditCard,
  X
} from 'lucide-vue-next'

const authStore = useAuthStore()
const plans = ref([])
const mySubscription = ref(null)
const loading = ref(true)
const checkoutLoading = ref(false)
const confirmLoading = ref(false)
const selectedCheckout = ref(null)
const copySuccess = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const fetchPlansAndStatus = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [plansRes, mySubRes] = await Promise.all([
      subscriptionService.getPlans(),
      subscriptionService.getMySubscription()
    ])
    plans.value = plansRes?.data || []
    mySubscription.value = mySubRes?.data || null
    await authStore.fetchSubscription()
  } catch (err) {
    console.error('Error fetching subscription data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPlansAndStatus()
})

const formatCurrency = (val) => {
  if (!val || val === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

const handleSelectPlan = async (plan) => {
  checkoutLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const res = await subscriptionService.checkout(plan.id, 'BANK_TRANSFER')
    const payload = res?.data || res
    if (payload && (res?.status === 200 || res?.status === 201 || payload.subscriptionId)) {
      if (payload.status === 'ACTIVE' || payload.amount === 0) {
        // Free trial activated immediately
        successMessage.value = '🎉 Kích hoạt gói trải nghiệm 7 ngày thành công!'
        await fetchPlansAndStatus()
      } else {
        // Show VietQR modal
        selectedCheckout.value = payload
      }
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Không thể tạo đơn hàng, vui lòng thử lại.'
  } finally {
    checkoutLoading.value = false
  }
}

const handleConfirmPayment = async () => {
  if (!selectedCheckout.value?.paymentId) return
  confirmLoading.value = true
  try {
    const res = await subscriptionService.confirmPayment(selectedCheckout.value.paymentId)
    if (res?.status === 200 || res?.status === 201 || res?.data) {
      successMessage.value = '🎉 Thanh toán xác nhận thành công! Gói hội viên VIP của bạn đã được kích hoạt.'
      selectedCheckout.value = null
      await fetchPlansAndStatus()
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Chưa thể xác nhận thanh toán. Vui lòng thử lại sau giây lát.'
  } finally {
    confirmLoading.value = false
  }
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  copySuccess.value = true
  setTimeout(() => {
    copySuccess.value = false
  }, 2500)
}
</script>

<template>
  <div class="space-y-8 max-w-6xl mx-auto pb-16">
    <!-- Header banner -->
    <div class="relative overflow-hidden bg-gradient-to-r from-ocean-900 via-ocean-800 to-indigo-900 rounded-3xl p-8 text-white shadow-xl">
      <div class="relative z-10 max-w-2xl">
        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sky-200 text-xs font-semibold mb-4 border border-white/10">
          <Sparkles class="w-3.5 h-3.5 text-amber-300" />
          <span>Nâng Tầm Năng Lực Toán THPT & Đánh Giá Năng Lực</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
          Gói Hội Viên Học Tập BienEDU VIP
        </h1>
        <p class="mt-3 text-slate-200 text-sm sm:text-base leading-relaxed">
          Mở khóa toàn bộ ngân hàng 10.000+ bài tập toán đa dạng, chu kỳ ôn tập ngắt quãng 0-1-3-7 ngày và công cụ phân tích năng lực chi tiết.
        </p>
      </div>
      <div class="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
        <Sparkles class="w-96 h-96 text-white" />
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="successMessage" class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-3 shadow-sm animate-fade-in">
      <CheckCircle2 class="w-5 h-5 text-emerald-600 flex-shrink-0" />
      <span class="font-medium">{{ successMessage }}</span>
    </div>

    <div v-if="errorMessage" class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-3 shadow-sm animate-fade-in">
      <X class="w-5 h-5 text-rose-600 flex-shrink-0 cursor-pointer" @click="errorMessage = ''" />
      <span class="font-medium">{{ errorMessage }}</span>
    </div>

    <!-- Current Subscription Status Card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
        <ShieldCheck class="w-5 h-5 text-ocean-600" />
        <span>Trạng Thái Hội Viên Của Bạn</span>
      </h2>

      <div v-if="loading" class="animate-pulse space-y-3">
        <div class="h-6 bg-slate-100 rounded-lg w-1/3"></div>
        <div class="h-4 bg-slate-100 rounded-lg w-1/2"></div>
      </div>

      <div v-else-if="mySubscription?.isVip || mySubscription?.status === 'ACTIVE' || mySubscription?.subscriptionId" class="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm mb-2">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Đang Hoạt Động (VIP)</span>
          </div>
          <h3 class="text-xl font-bold text-slate-900">{{ mySubscription.planName }}</h3>
          <p class="text-sm text-slate-600 mt-1">
            Thời hạn sử dụng: từ <span class="font-semibold text-slate-800">{{ mySubscription.startDate }}</span> đến <span class="font-semibold text-slate-800">{{ mySubscription.endDate }}</span>
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-center px-4 py-2 bg-white rounded-xl border border-emerald-200 shadow-xs">
            <div class="text-xs text-slate-500 font-medium">Thời gian còn lại</div>
            <div class="text-2xl font-black text-emerald-700">{{ mySubscription.daysRemaining }} <span class="text-xs font-semibold">ngày</span></div>
          </div>
        </div>
      </div>

      <div v-else class="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Tài khoản chưa có gói VIP hoạt động</h3>
          <p class="text-xs text-slate-500 mt-1">
            Chọn gói học bên dưới để mở rộng số lần làm bài, lời giải chi tiết và ôn tập Spaced Repetition.
          </p>
        </div>
        <a href="#plans" class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-semibold text-xs transition shadow-sm">
          <span>Xem các gói học</span>
          <ArrowRight class="w-4 h-4" />
        </a>
      </div>
    </div>

    <!-- Pricing Grid -->
    <div id="plans" class="space-y-6">
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bảng Giá Gói Học Tập BienEDU
        </h2>
        <p class="text-sm text-slate-500 mt-2">
          Đầu tư thông minh cho tương lai với lộ trình tối ưu và chi phí hợp lý nhất.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div 
          v-for="plan in plans" 
          :key="plan.id"
          :class="[
            'relative bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 border',
            plan.id === 3 
              ? 'border-2 border-ocean-600 shadow-xl ring-4 ring-ocean-100 transform -translate-y-1' 
              : 'border-slate-200/90 shadow-sm hover:shadow-md'
          ]"
        >
          <!-- Recommended Badge -->
          <div 
            v-if="plan.id === 3" 
            class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-ocean-600 to-indigo-600 text-white text-[11px] font-bold px-3.5 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center space-x-1"
          >
            <Sparkles class="w-3 h-3 text-amber-300" />
            <span>Phổ Biến & Tiết Kiệm Nhất</span>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900">{{ plan.name }}</h3>
              <span class="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-600 flex items-center space-x-1">
                <Clock class="w-3 h-3" />
                <span>{{ plan.durationDays }} ngày</span>
              </span>
            </div>

            <div class="mt-4 mb-6">
              <div class="flex items-baseline space-x-1">
                <span class="text-3xl font-black text-slate-900">{{ formatCurrency(plan.price) }}</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                {{ plan.price === 0 ? 'Dành cho thành viên mới bắt đầu' : `Trọn gói trong ${plan.durationDays} ngày` }}
              </p>
            </div>

            <!-- Features list -->
            <ul class="space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-600">
              <li class="flex items-start space-x-2.5">
                <Check class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Kho 10.000+ câu hỏi Toán chuẩn format BGD 2025</span>
              </li>
              <li class="flex items-start space-x-2.5">
                <Check class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Luyện tập ngắt quãng Spaced Repetition 0-1-3-7</span>
              </li>
              <li class="flex items-start space-x-2.5">
                <Check class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Sổ tay lưu trữ & phân tích lỗi sai thông minh</span>
              </li>
              <li v-if="plan.id !== 1" class="flex items-start space-x-2.5 font-medium text-slate-800">
                <Check class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Báo cáo tiến độ gửi Zalo trực tiếp cho Phụ huynh</span>
              </li>
              <li v-if="plan.id === 3" class="flex items-start space-x-2.5 font-bold text-ocean-700">
                <Zap class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Hỗ trợ ưu tiên giải đáp thắc mắc chuyên đề 24/7</span>
              </li>
            </ul>
          </div>

          <div class="mt-8 pt-4">
            <button
              @click="handleSelectPlan(plan)"
              :disabled="checkoutLoading"
              :class="[
                'w-full py-3 px-4 rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center space-x-2 shadow-sm',
                plan.id === 3
                  ? 'bg-ocean-600 hover:bg-ocean-700 text-white shadow-ocean-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              ]"
            >
              <span>{{ plan.price === 0 ? 'Dùng Thử Miễn Phí' : 'Đăng Ký Ngay' }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VietQR Payment Modal -->
    <div 
      v-if="selectedCheckout" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        <button 
          @click="selectedCheckout = null"
          class="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="text-center mb-6">
          <div class="inline-flex p-3 rounded-2xl bg-ocean-50 text-ocean-600 mb-3">
            <QrCode class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-bold text-slate-900">Quét Mã VietQR Để Kích Hoạt</h3>
          <p class="text-xs text-slate-500 mt-1">
            Gói: <span class="font-bold text-slate-800">{{ selectedCheckout.planName }}</span> — Số tiền: <span class="font-bold text-emerald-600">{{ formatCurrency(selectedCheckout.amount) }}</span>
          </p>
        </div>

        <!-- QR Image Display -->
        <div class="flex justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
          <img 
            :src="selectedCheckout.qrCodeUrl || selectedCheckout.vietQrUrl" 
            alt="VietQR Chuyển khoản" 
            class="w-64 h-auto rounded-xl shadow-xs"
          />
        </div>

        <!-- Bank Details for manual transfer -->
        <div class="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-6">
          <div class="flex justify-between items-center text-slate-600">
            <span>Ngân hàng:</span>
            <span class="font-bold text-slate-800">{{ selectedCheckout.bankName }}</span>
          </div>
          <div class="flex justify-between items-center text-slate-600">
            <span>Chủ tài khoản:</span>
            <span class="font-bold text-slate-800">{{ selectedCheckout.accountHolder || selectedCheckout.accountName }}</span>
          </div>
          <div class="flex justify-between items-center text-slate-600">
            <span>Số tài khoản:</span>
            <div class="flex items-center space-x-1 font-mono font-bold text-slate-800">
              <span>{{ selectedCheckout.accountNumber || selectedCheckout.accountNo }}</span>
              <button 
                @click="copyToClipboard(selectedCheckout.accountNumber || selectedCheckout.accountNo)"
                class="p-1 hover:text-ocean-600 transition"
                title="Sao chép STK"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div class="flex justify-between items-center text-slate-600 border-t border-slate-200/60 pt-2">
            <span>Nội dung CK:</span>
            <div class="flex items-center space-x-1 font-mono font-bold text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded">
              <span>{{ selectedCheckout.transferContent }}</span>
              <button 
                @click="copyToClipboard(selectedCheckout.transferContent)"
                class="p-1 hover:text-ocean-600 transition"
                title="Sao chép nội dung"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="copySuccess" class="text-center text-emerald-600 text-xs font-semibold mb-4">
          ✓ Đã sao chép vào bộ nhớ tạm!
        </div>

        <!-- Confirmation Action Button -->
        <button
          @click="handleConfirmPayment"
          :disabled="confirmLoading"
          class="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition duration-200 shadow-md flex items-center justify-center space-x-2"
        >
          <span v-if="confirmLoading">Đang xác nhận với hệ thống...</span>
          <span v-else>Tôi Đã Chuyển Khoản Xong (Kích Hoạt Tức Thì)</span>
          <CheckCircle2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
