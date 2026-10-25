<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  RotateCcw,
  BarChart3,
  CheckSquare,
  Database,
  Sparkles
} from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

const studentNav = [
  { name: 'Tổng quan học tập', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Lớp học của tôi', path: '/app/classes', icon: Users },
  { name: 'Bài tập & Đề thi', path: '/app/assignments', icon: FileText },
  { name: 'Luyện tập theo dạng', path: '/app/practice', icon: BookOpen },
  { name: 'Sổ tay lỗi sai (0-1-3-7)', path: '/app/mistakes', icon: RotateCcw, highlight: true },
  { name: 'Báo cáo năng lực & Zalo', path: '/app/analytics', icon: BarChart3 },
  { name: 'Gói hội viên & VIP', path: '/app/subscription', icon: Sparkles },
]

const teacherNav = [
  { name: 'Bảng điều khiển', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Quản lý lớp học', path: '/app/classes', icon: Users },
  { name: 'Tài liệu PDF & Bài học', path: '/app/teacher/lessons', icon: BookOpen, highlight: true },
  { name: 'Giao bài & Đề thi', path: '/app/assignments', icon: FileText },
  { name: 'Ngân hàng câu hỏi', path: '/app/teacher/exercises', icon: Database },
  { name: 'Chấm bài tự luận', path: '/app/teacher/grading', icon: CheckSquare, badge: 'Chờ chấm' },
  { name: 'Luyện tập chuyên đề', path: '/app/practice', icon: BookOpen },
]

const currentNav = computed(() => authStore.isTeacher ? teacherNav : studentNav)

const isActive = (path) => route.path === path || (path !== '/app/dashboard' && route.path.startsWith(`${path}/`))
</script>

<template>
  <aside class="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between py-5">
    <div class="px-3 space-y-1">
      <div class="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        {{ authStore.isTeacher ? 'Khu Vực Giáo Viên' : 'Không Gian Học Tập' }}
      </div>
      
      <router-link
        v-for="item in currentNav"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition',
          isActive(item.path)
            ? 'bg-ocean-50 text-ocean-700 shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        ]"
      >
        <div class="flex items-center space-x-3">
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span>{{ item.name }}</span>
        </div>
        <span 
          v-if="item.badge" 
          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800"
        >
          {{ item.badge }}
        </span>
      </router-link>
    </div>

    <!-- Bottom Spaced Repetition Reminder Box -->
    <div class="px-3">
      <div class="p-3.5 bg-gradient-to-br from-ocean-50 to-sky-100/60 border border-ocean-200/80 rounded-2xl">
        <div class="flex items-center space-x-1.5 text-ocean-700 font-bold text-xs mb-1">
          <Sparkles class="w-3.5 h-3.5 text-ocean-600" />
          <span>Chu kỳ 0-1-3-7 ngày</span>
        </div>
        <p class="text-[11px] text-slate-600 leading-relaxed font-normal">
          Ôn lại lỗi sai ngắt quãng giúp biến kiến thức chưa chắc thành phản xạ 9+.
        </p>
      </div>
    </div>
  </aside>
</template>
