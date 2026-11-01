<script setup>
import Navbar from '@/components/Navbar.vue'
import Sidebar from '@/components/Sidebar.vue'
import GradeSelectModal from '@/components/GradeSelectModal.vue'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const mobileNavOpen = ref(false)
// Đổi trang thì tự đóng menu trên điện thoại
watch(() => route.fullPath, () => { mobileNavOpen.value = false })

// Đồng bộ hồ sơ (khối lớp) từ máy chủ mỗi lần vào khu vực ứng dụng
onMounted(() => authStore.refreshUser())
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <Navbar @toggle-menu="mobileNavOpen = !mobileNavOpen" />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar class="hidden md:flex flex-shrink-0" />
      <main class="flex-1 overflow-y-auto p-6 lg:p-8">
        <router-view />
      </main>
    </div>
    <!-- Menu điều hướng dạng ngăn kéo cho màn hình nhỏ -->
    <div v-if="mobileNavOpen" class="md:hidden fixed inset-0 z-40 flex" data-testid="mobile-nav">
      <Sidebar class="flex flex-shrink-0 shadow-2xl overflow-y-auto" />
      <button type="button" class="flex-1 bg-slate-900/40" aria-label="Đóng menu" @click="mobileNavOpen = false"></button>
    </div>
    <!-- Tài khoản học sinh cũ chưa chọn khối: bắt buộc chọn để hiển thị đúng nội dung -->
    <GradeSelectModal :open="authStore.needsGradeSelection" required />
  </div>
</template>
