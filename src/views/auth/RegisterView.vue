<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/authService'
import { User, Phone, Mail, Lock, UserCheck, AlertCircle, ArrowRight } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const role = ref('STUDENT') // STUDENT or TEACHER
const isLoading = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  if (!fullName.value || !phone.value || !password.value) {
    errorMessage.value = 'Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await authService.register({
      fullName: fullName.value,
      phone: phone.value,
      email: email.value || `${phone.value}@bienedu.vn`,
      password: password.value,
      role: role.value
    })
    
    // Đăng ký xong tự động lưu token nếu có
    const payload = res.data || res
    if (payload.accessToken) {
      authStore.token = payload.accessToken
      authStore.refreshToken = payload.refreshToken
      authStore.user = payload.user
      localStorage.setItem('bienedu_access_token', payload.accessToken)
      if (payload.refreshToken) localStorage.setItem('bienedu_refresh_token', payload.refreshToken)
      if (payload.user) localStorage.setItem('bienedu_user', JSON.stringify(payload.user))
    }
    
    router.push('/app/dashboard')
  } catch (err) {
    errorMessage.value = err.detail || err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10">
    <div class="text-center mb-6">
      <router-link to="/" class="inline-block mb-3">
        <img src="/logo.png" alt="BienEDU" class="h-12 w-auto mx-auto object-contain" />
      </router-link>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Tạo Tài Khoản BienEDU</h1>
      <p class="text-xs text-slate-500 mt-1">Gia nhập nền tảng học Toán THCS & THPT toàn diện</p>
    </div>

    <!-- Alert error -->
    <div v-if="errorMessage" class="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-xs">
      <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
      <span>{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="handleRegister" class="space-y-4">
      <!-- Role Selector Tabs -->
      <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          @click="role = 'STUDENT'"
          :class="[
            'py-2 text-xs font-bold rounded-lg transition',
            role === 'STUDENT' ? 'bg-white text-ocean-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Học Sinh / Luyện Thi
        </button>
        <button
          type="button"
          @click="role = 'TEACHER'"
          :class="[
            'py-2 text-xs font-bold rounded-lg transition',
            role === 'TEACHER' ? 'bg-white text-ocean-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Giáo Viên / Trợ Giảng
        </button>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <User class="w-4 h-4" />
          </div>
          <input 
            v-model="fullName"
            type="text" 
            placeholder="Nguyễn Văn An"
            class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition"
            required
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Phone class="w-4 h-4" />
          </div>
          <input 
            v-model="phone"
            type="tel" 
            placeholder="0912345678"
            class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition"
            required
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Email (Tùy chọn)</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mail class="w-4 h-4" />
          </div>
          <input 
            v-model="email"
            type="email" 
            placeholder="an.nguyen@example.com"
            class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock class="w-4 h-4" />
          </div>
          <input 
            v-model="password"
            type="password" 
            placeholder="••••••••"
            class="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition"
            required
          />
        </div>
      </div>

      <button 
        type="submit"
        :disabled="isLoading"
        class="w-full py-3 px-4 bg-ocean-600 hover:bg-ocean-700 disabled:bg-ocean-300 text-white font-bold text-sm rounded-xl shadow-md shadow-ocean-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
      >
        <UserCheck v-if="!isLoading" class="w-4 h-4" />
        <span v-if="isLoading">Đang tạo tài khoản...</span>
        <span v-else>Đăng Ký & Vào Học</span>
      </button>

      <div class="pt-3 text-center">
        <span class="text-xs text-slate-500">Đã có tài khoản? </span>
        <router-link to="/auth/login" class="text-xs font-bold text-ocean-600 hover:underline">
          Đăng nhập ngay
        </router-link>
      </div>
    </form>
  </div>
</template>
