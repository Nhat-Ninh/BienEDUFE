<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LogIn, Lock, Phone, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const phoneOrEmail = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!phoneOrEmail.value || !password.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ thông tin tài khoản và mật khẩu.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authStore.login({
      phoneOrEmail: phoneOrEmail.value,
      password: password.value
    })
    
    // Đăng nhập thành công -> chuyển về dashboard hoặc trang trước đó
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    errorMessage.value = err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.'
  } finally {
    isLoading.value = false
  }
}

const quickDemoLogin = () => {
  authStore.token = 'demo_mock_jwt_token'
  authStore.user = {
    id: 1,
    fullName: 'Thầy Biên (Demo)',
    phone: '0987654321',
    email: 'bien.edu@example.com',
    role: 'TEACHER'
  }
  localStorage.setItem('bienedu_access_token', 'demo_mock_jwt_token')
  localStorage.setItem('bienedu_user', JSON.stringify(authStore.user))
  router.push('/dashboard')
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
    <div class="text-center mb-8">
      <div class="w-12 h-12 bg-sky-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-sky-200 mb-3">
        B
      </div>
      <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Đăng Nhập BienEDU</h1>
      <p class="text-sm text-slate-500 mt-1">Nền tảng Quản lý & Học tập Toán học</p>
    </div>

    <!-- Alert thông báo lỗi -->
    <div v-if="errorMessage" class="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-sm">
      <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
      <span>{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Số điện thoại hoặc Email</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Phone class="w-4 h-4" />
          </div>
          <input 
            v-model="phoneOrEmail"
            type="text" 
            placeholder="0987654321 hoặc teacher@example.com"
            class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            required
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Mật khẩu</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock class="w-4 h-4" />
          </div>
          <input 
            v-model="password"
            type="password" 
            placeholder="••••••••"
            class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            required
          />
        </div>
      </div>

      <button 
        type="submit"
        :disabled="isLoading"
        class="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-semibold rounded-lg shadow-md shadow-sky-100 flex items-center justify-center space-x-2 transition cursor-pointer"
      >
        <LogIn v-if="!isLoading" class="w-4 h-4" />
        <span v-if="isLoading">Đang xử lý...</span>
        <span v-else>Đăng Nhập</span>
      </button>

      <!-- Nút đăng nhập thử nghiệm (Dev Demo) -->
      <div class="pt-2 text-center">
        <button
          type="button"
          @click="quickDemoLogin"
          class="text-xs text-slate-500 hover:text-sky-600 underline font-medium"
        >
          ⚡ Đăng nhập thử nghiệm (Không cần kết nối Backend)
        </button>
      </div>
    </form>
  </div>
</template>
