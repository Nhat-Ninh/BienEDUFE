<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { LogOut, User, Globe, Sparkles, ShoppingCart } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (authStore.isAuthenticated && authStore.isStudent && !authStore.subscription) {
    await authStore.fetchSubscription()
  }
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/auth/login')
}
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
    <div class="flex items-center space-x-3 sm:space-x-4">
      <router-link to="/app/dashboard" class="flex items-center space-x-2">
        <img src="/logo.png" alt="BienEDU" class="h-10 w-auto object-contain" />
      </router-link>
      <span 
        :class="[
          'text-xs font-bold px-2.5 py-0.5 rounded-full border',
          authStore.isTeacher 
            ? 'bg-purple-50 text-purple-700 border-purple-200' 
            : 'bg-ocean-50 text-ocean-700 border-ocean-200'
        ]"
      >
        {{ authStore.isTeacher ? '👨‍🏫 Giáo Viên' : '🎓 Học Sinh' }}
      </span>

      <!-- Student Plan Badge / Buy Button -->
      <template v-if="!authStore.isTeacher">
        <router-link 
          v-if="authStore.hasActivePlan" 
          to="/app/subscription"
          data-testid="navbar-plan-badge"
          class="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-emerald-50 text-emerald-800 border border-emerald-200/90 hover:shadow-xs transition"
          :title="`Gói: ${authStore.activePlanName} - Còn ${authStore.daysRemaining} ngày`"
        >
          <Sparkles class="w-3.5 h-3.5 text-amber-500" />
          <span class="truncate max-w-[130px] sm:max-w-none">🌟 {{ authStore.activePlanName }}</span>
        </router-link>

        <router-link 
          v-else 
          to="/app/subscription"
          data-testid="navbar-buy-plan-btn"
          class="inline-flex items-center space-x-1.5 text-xs font-bold px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs hover:shadow-sm transition animate-pulse"
        >
          <ShoppingCart class="w-3.5 h-3.5" />
          <span>Mua khóa học</span>
        </router-link>
      </template>
    </div>

    <div class="flex items-center space-x-3">
      <router-link 
        to="/" 
        class="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 hover:text-ocean-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
      >
        <Globe class="w-3.5 h-3.5" />
        <span>Trang giới thiệu</span>
      </router-link>

      <div class="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
        <div class="w-8 h-8 rounded-full bg-ocean-50 border border-ocean-200 text-ocean-700 flex items-center justify-center font-bold text-xs">
          {{ authStore.user?.fullName ? authStore.user.fullName.charAt(0) : 'U' }}
        </div>
        <div class="hidden md:block text-left">
          <div class="text-xs font-bold text-slate-800 leading-tight">
            {{ authStore.user?.fullName || 'Người dùng' }}
          </div>
          <div class="text-[10px] text-slate-400 font-medium">
            {{ authStore.user?.phone || authStore.user?.email || 'BienEDU Member' }}
          </div>
        </div>
      </div>

      <button 
        @click="handleLogout"
        class="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition"
        title="Đăng xuất"
      >
        <LogOut class="w-4 h-4" />
        <span class="hidden sm:inline font-medium">Thoát</span>
      </button>
    </div>
  </header>
</template>
