<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import MathRenderer from '@/components/MathRenderer.vue'
import { Users, FileText, CheckCircle2, TrendingUp, Sparkles, BookOpen } from 'lucide-vue-next'

const authStore = useAuthStore()

const stats = [
  { label: 'Lớp học tham gia', value: '3', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'Bài tập cần nộp', value: '2', icon: FileText, color: 'text-amber-600 bg-amber-50' },
  { label: 'Bài đã hoàn thành', value: '18', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Tỉ lệ thành thạo', value: '85%', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
]

// Demo câu hỏi Toán học render bằng KaTeX & Markdown
const demoMathContent = ref(`### 📐 Ví dụ bài toán mẫu trên BienEDU

Cho hàm số bậc hai $y = ax^2 + bx + c$ có đồ thị parabol $(P)$. Biết $(P)$ đi qua điểm $A(1; 0)$ và có đỉnh $I(2; -1)$.

**Yêu cầu:** Tìm nghiệm của phương trình $ax^2 + bx + c = 0$ và tính tích phân sau:

$$\\int_{1}^{3} (x^2 - 4x + 3) \\, dx = \\left[ \\frac{x^3}{3} - 2x^2 + 3x \\right]_{1}^{3} = -\\frac{4}{3}$$

* **Gợi ý 1:** Thay tọa độ đỉnh $I(2; -1)$ vào công thức tọa độ đỉnh $-\\frac{b}{2a} = 2$.
* **Gợi ý 2:** Sử dụng hệ thức Viète: $x_1 + x_2 = -\\frac{b}{a}$ và $x_1 x_2 = \\frac{c}{a}$.`)
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="bg-gradient-to-r from-sky-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white shadow-lg shadow-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2 text-sky-200 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles class="w-4 h-4" />
          <span>Chào mừng trở lại</span>
        </div>
        <h1 class="text-2xl lg:text-3xl font-bold tracking-tight">
          Xin chào, {{ authStore.user?.fullName || 'Học viên' }}! 👋
        </h1>
        <p class="text-sky-100 text-sm mt-1 max-w-xl">
          Tiếp tục ôn luyện các chuyên đề toán học và theo dõi tiến độ hoàn thành bài tập của bạn nhé.
        </p>
      </div>

      <router-link 
        to="/practice" 
        class="inline-flex items-center space-x-2 px-5 py-2.5 bg-white text-sky-700 font-semibold text-sm rounded-xl hover:bg-sky-50 shadow transition flex-shrink-0"
      >
        <BookOpen class="w-4 h-4" />
        <span>Vào Luyện Tập Ngay</span>
      </router-link>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        v-for="item in stats" 
        :key="item.label"
        class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4"
      >
        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', item.color]">
          <component :is="item.icon" class="w-6 h-6" />
        </div>
        <div>
          <div class="text-2xl font-bold text-slate-800">{{ item.value }}</div>
          <div class="text-xs text-slate-500 font-medium mt-0.5">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <!-- Math Renderer Demo Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Khả năng hiển thị công thức Toán (KaTeX & Markdown)</h2>
          <p class="text-xs text-slate-500 mt-0.5">Thử nghiệm engine render công thức toán học chạy trực tiếp tại trình duyệt (0% tải CPU trên VPS)</p>
        </div>
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
          Tối ưu Client-Side
        </span>
      </div>

      <div class="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
        <MathRenderer :content="demoMathContent" />
      </div>
    </div>
  </div>
</template>
