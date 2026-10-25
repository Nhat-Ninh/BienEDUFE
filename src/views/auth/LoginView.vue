<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LogIn, Lock, Phone, AlertCircle, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const phoneOrEmail = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!phoneOrEmail.value || !password.value) {
    errorMessage.value = 'Vui lòng nhập tài khoản và mật khẩu.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authStore.login({
      phoneOrEmail: phoneOrEmail.value,
      password: password.value
    })
    
    const redirect = route.query.redirect || '/app/dashboard'
    router.push(redirect)
  } catch (err) {
    errorMessage.value = err.detail || err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'
  } finally {
    isLoading.value = false
  }
}

// Quick Demo Logins for instant evaluation
const demoLogin = async (roleName) => {
  isLoading.value = true
  try {
    if (roleName === 'TEACHER') {
      await authStore.login({ identifier: '0987654321', password: 'Password123@' })
    } else {
      await authStore.login({ identifier: '0911223344', password: 'Password123@' })
    }
    router.push('/app/dashboard')
  } catch (err) {
    errorMessage.value = 'Không thể đăng nhập chế độ Demo. Vui lòng thử lại.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10">
    <div class="text-center mb-6">
      <router-link to="/" class="inline-block mb-3">
        <img src="/logo.png" alt="BienEDU" class="h-14 w-auto mx-auto object-contain" />
      </router-link>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Đăng Nhập BienEDU</h1>
      <p class="text-xs text-slate-500 mt-1">Cổng học tập & quản lý lớp học môn Toán</p>
    </div>

    <!-- Alert thông báo lỗi -->
    <div v-if="errorMessage" class="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-xs">
      <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
      <span>{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại hoặc Email</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Phone class="w-4 h-4" />
          </div>
          <input 
            v-model="phoneOrEmail"
            type="text" 
            placeholder="0988888888 hoặc thaybien@bienedu.vn"
            class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition"
            required
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock class="w-4 h-4" />
          </div>
          <input 
            v-model="password"
            type="password" 
            placeholder="••••••••"
            class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition"
            required
          />
        </div>
      </div>

      <button 
        type="submit"
        :disabled="isLoading"
        class="w-full py-3 px-4 bg-ocean-600 hover:bg-ocean-700 disabled:bg-ocean-300 text-white font-bold text-sm rounded-xl shadow-md shadow-ocean-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
      >
        <LogIn v-if="!isLoading" class="w-4 h-4" />
        <span v-if="isLoading">Đang xác thực...</span>
        <span v-else>Đăng Nhập Vào Học</span>
      </button>

      <div class="pt-3 text-center">
        <span class="text-xs text-slate-500">Chưa có tài khoản? </span>
        <router-link to="/auth/register" class="text-xs font-bold text-ocean-600 hover:underline">
          Đăng ký miễn phí ngay
        </router-link>
      </div>

      <!-- Quick Demo Access Bar -->
      <div class="mt-6 pt-5 border-t border-slate-100 text-center">
        <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-center space-x-1">
          <Sparkles class="w-3.5 h-3.5 text-amber-500" />
          <span>Vào nhanh chế độ xem thử (Demo Mode)</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="demoLogin('STUDENT')"
            class="py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          >
            🎓 Học Sinh (An 12A1)
          </button>
          <button
            type="button"
            @click="demoLogin('TEACHER')"
            class="py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          >
            👨‍🏫 Giáo Viên (Thầy Tùng)
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
