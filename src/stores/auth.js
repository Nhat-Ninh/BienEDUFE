import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import { subscriptionService } from '@/services/subscriptionService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('bienedu_access_token') || null)
  const refreshToken = ref(localStorage.getItem('bienedu_refresh_token') || null)
  
  const savedUser = localStorage.getItem('bienedu_user')
  const user = ref(savedUser ? JSON.parse(savedUser) : null)
  const subscription = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isTeacher = computed(() => user.value?.role === 'TEACHER')
  const isStudent = computed(() => user.value?.role === 'STUDENT')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  const hasActivePlan = computed(() => {
    return !!(subscription.value && (subscription.value.isVip || subscription.value.status === 'ACTIVE' || subscription.value.daysRemaining > 0))
  })

  const activePlanName = computed(() => {
    if (hasActivePlan.value) {
      return subscription.value.planName || 'Gói VIP'
    }
    return null
  })

  const daysRemaining = computed(() => {
    return subscription.value?.daysRemaining || 0
  })

  async function fetchSubscription() {
    if (!token.value || isTeacher.value) {
      subscription.value = null
      return null
    }
    try {
      const res = await subscriptionService.getMySubscription()
      const data = res?.data || res
      if (data && (data.isVip || data.status === 'ACTIVE' || (data.daysRemaining && data.daysRemaining > 0))) {
        subscription.value = data
      } else {
        subscription.value = null
      }
      return subscription.value
    } catch (e) {
      subscription.value = null
      return null
    }
  }

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

      if (payload.user?.role === 'STUDENT') {
        await fetchSubscription()
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

      if (userData?.role === 'STUDENT') {
        await fetchSubscription()
      }
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
      subscription.value = null
      localStorage.removeItem('bienedu_access_token')
      localStorage.removeItem('bienedu_refresh_token')
      localStorage.removeItem('bienedu_user')
    }
  }

  return {
    token,
    refreshToken,
    user,
    subscription,
    isAuthenticated,
    isTeacher,
    isStudent,
    isAdmin,
    hasActivePlan,
    activePlanName,
    daysRemaining,
    fetchSubscription,
    login,
    fetchCurrentUser,
    logout
  }
})
