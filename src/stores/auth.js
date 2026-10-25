import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('bienedu_access_token') || null)
  const refreshToken = ref(localStorage.getItem('bienedu_refresh_token') || null)
  
  const savedUser = localStorage.getItem('bienedu_user')
  const user = ref(savedUser ? JSON.parse(savedUser) : null)

  const isAuthenticated = computed(() => !!token.value)
  const isTeacher = computed(() => user.value?.role === 'TEACHER')
  const isStudent = computed(() => user.value?.role === 'STUDENT')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  async function login(credentials) {
    const res = await authService.login(credentials)
    const payload = res.data || res
    
    if (payload.accessToken) {
      token.value = payload.accessToken
      refreshToken.value = payload.refreshToken
      user.value = payload.user

      localStorage.setItem('bienedu_access_token', payload.accessToken)
      if (payload.refreshToken) {
        localStorage.setItem('bienedu_refresh_token', payload.refreshToken)
      }
      if (payload.user) {
        localStorage.setItem('bienedu_user', JSON.stringify(payload.user))
      }
    }
    return res
  }

  async function fetchCurrentUser() {
    if (!token.value) return null
    try {
      const res = await authService.getMe()
      const userData = res.data || res
      user.value = userData
      localStorage.setItem('bienedu_user', JSON.stringify(userData))
      return userData
    } catch (err) {
      // Token không hợp lệ hoặc hết hạn -> dọn dẹp
      await logout()
      return null
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await authService.logout()
      }
    } catch (e) {
      // Bỏ qua lỗi logout phía server nếu token đã hết hạn
    } finally {
      token.value = null
      refreshToken.value = null
      user.value = null
      localStorage.removeItem('bienedu_access_token')
      localStorage.removeItem('bienedu_refresh_token')
      localStorage.removeItem('bienedu_user')
    }
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    isTeacher,
    isStudent,
    isAdmin,
    login,
    fetchCurrentUser,
    logout
  }
})
