<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { LogOut, User, Bell } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-lg">
        B
      </div>
      <span class="font-bold text-xl text-slate-800 tracking-tight">Bien<span class="text-sky-600">EDU</span></span>
      <span class="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-medium">Toán Học</span>
    </div>

    <div class="flex items-center space-x-4">
      <button class="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition">
        <Bell class="w-5 h-5" />
      </button>

      <div class="flex items-center space-x-3 pl-3 border-l border-slate-200">
        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
          <User class="w-5 h-5" />
        </div>
        <div class="hidden md:block text-left text-sm">
          <div class="font-semibold text-slate-700">{{ authStore.user?.fullName || 'Người dùng' }}</div>
          <div class="text-xs text-slate-500 font-medium">{{ authStore.user?.role || 'Học viên' }}</div>
        </div>
      </div>

      <button 
        @click="handleLogout"
        class="flex items-center space-x-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition"
        title="Đăng xuất"
      >
        <LogOut class="w-4 h-4" />
        <span class="hidden sm:inline font-medium">Thoát</span>
      </button>
    </div>
  </header>
</template>
