<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  Award,
  CheckCircle2
} from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Lớp học', path: '/classes', icon: Users },
  { name: 'Bài tập & Đề thi', path: '/assignments', icon: FileText },
  { name: 'Luyện tập Toán', path: '/practice', icon: BookOpen },
]

const isActive = (path) => route.path === path || route.path.startsWith(`${path}/`)
</script>

<template>
  <aside class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between py-6">
    <div class="px-4 space-y-1">
      <div class="px-3 pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Menu Chính
      </div>
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
          isActive(item.path)
            ? 'bg-sky-50 text-sky-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span>{{ item.name }}</span>
      </router-link>
    </div>

    <!-- Hộp thông tin nhanh ở đáy sidebar -->
    <div class="px-4 mt-auto">
      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div class="flex items-center space-x-2 text-sky-600 font-semibold text-xs mb-1">
          <Award class="w-4 h-4" />
          <span>Hệ thống BienEDU</span>
        </div>
        <p class="text-xs text-slate-500 leading-relaxed">
          Nền tảng tối ưu cho giảng dạy và làm bài tập Toán học.
        </p>
      </div>
    </div>
  </aside>
</template>
