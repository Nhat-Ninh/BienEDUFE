<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { classService } from '@/services/classService'
import { Users, Plus, Key, Copy, Check, BookOpen, AlertCircle, Trash2, Archive, Filter } from 'lucide-vue-next'

const authStore = useAuthStore()

const classes = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const selectedGradeFilter = ref(0) // 0 = Tất cả

const filteredClasses = computed(() => {
  if (selectedGradeFilter.value === 0) return classes.value
  return classes.value.filter(c => c.gradeLevel === selectedGradeFilter.value)
})

// Teacher Modal
const showCreateModal = ref(false)
const newClassName = ref('')
const newGradeLevel = ref(12)
const newDescription = ref('')

// Student Join Modal
const showJoinModal = ref(false)
const inviteCode = ref('')

const copiedId = ref(null)

const loadClasses = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (authStore.isTeacher) {
      const res = await classService.getMyClasses(0, 50)
      classes.value = res.data?.content || res.content || []
    } else {
      const res = await classService.getEnrolledClasses(0, 50)
      classes.value = res.data?.content || res.content || []
    }
  } catch (err) {
    errorMessage.value = 'Không thể tải danh sách lớp học.'
  } finally {
    isLoading.value = false
  }
}

const handleCreateClass = async () => {
  if (!newClassName.value) return
  try {
    await classService.createClass({
      name: newClassName.value,
      gradeLevel: newGradeLevel.value,
      description: newDescription.value
    })
    successMessage.value = 'Đã tạo lớp học thành công!'
    showCreateModal.value = false
    newClassName.value = ''
    newDescription.value = ''
    await loadClasses()
  } catch (err) {
    errorMessage.value = err.message || 'Lỗi khi tạo lớp học.'
  }
}

const handleJoinClass = async () => {
  if (!inviteCode.value) return
  try {
    await classService.joinClass({ inviteCode: inviteCode.value.trim() })
    successMessage.value = 'Đã tham gia lớp học thành công!'
    showJoinModal.value = false
    inviteCode.value = ''
    await loadClasses()
  } catch (err) {
    errorMessage.value = err.message || 'Mã mời không hợp lệ hoặc bạn đã ở trong lớp này.'
  }
}

const copyInvite = (code, id) => {
  navigator.clipboard.writeText(code)
  copiedId.value = id
  setTimeout(() => copiedId.value = null, 2000)
}

onMounted(loadClasses)
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          {{ authStore.isTeacher ? 'Quản Lý Lớp Học' : 'Lớp Học Của Tôi' }}
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ authStore.isTeacher ? 'Tạo lớp, cấp mã mời và theo dõi danh sách học sinh' : 'Các lớp học Toán bạn đang tham gia cùng thầy cô' }}
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          v-if="authStore.isTeacher"
          @click="showCreateModal = true"
          class="inline-flex items-center space-x-2 px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-md shadow-ocean-500/20 transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Tạo Lớp Học Mới</span>
        </button>

        <button
          v-if="authStore.isStudent"
          @click="showJoinModal = true"
          class="inline-flex items-center space-x-2 px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-md shadow-ocean-500/20 transition cursor-pointer"
        >
          <Key class="w-4 h-4" />
          <span>Nhập Mã Vào Lớp</span>
        </button>
      </div>
    </div>

    <!-- Alert Notices -->
    <div v-if="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
      <span>{{ successMessage }}</span>
      <button @click="successMessage = ''" class="text-emerald-600 font-bold">✕</button>
    </div>
    <div v-if="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
      <span>{{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="text-rose-600 font-bold">✕</button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-20">
      <div class="w-8 h-8 border-3 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <p class="text-xs text-slate-400">Đang tải danh sách lớp học...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="classes.length === 0" class="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4">
      <Users class="w-12 h-12 text-slate-300 mx-auto" />
      <h3 class="text-base font-bold text-slate-800">Chưa có lớp học nào</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        {{ authStore.isTeacher ? 'Bấm nút "Tạo Lớp Học Mới" ở trên để bắt đầu thêm lớp cho học sinh.' : 'Bấm nút "Nhập Mã Vào Lớp" và điền mã mời do thầy cô cung cấp.' }}
      </p>
    </div>

    <!-- Filter & Classes Grid -->
    <div v-else class="space-y-4">
      <!-- Grade Filter Pill Bar -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span class="text-slate-400 font-semibold flex items-center space-x-1 pl-1">
          <Filter class="w-3.5 h-3.5" />
          <span>Lọc lớp:</span>
        </span>
        <button
          @click="selectedGradeFilter = 0"
          :class="[
            'px-3 py-1.5 rounded-xl font-bold transition cursor-pointer',
            selectedGradeFilter === 0 ? 'bg-ocean-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          ]"
        >
          Tất Cả Khối Lớp
        </button>
        <button
          v-for="g in [6, 7, 8, 9, 10, 11, 12]"
          :key="g"
          @click="selectedGradeFilter = g"
          :class="[
            'px-3 py-1.5 rounded-xl font-bold transition cursor-pointer',
            selectedGradeFilter === g ? 'bg-ocean-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          ]"
        >
          Lớp {{ g }}
        </button>
      </div>

      <!-- Classes Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="c in filteredClasses"
          :key="c.id"
          class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
        >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-ocean-50 text-ocean-700">
              Khối {{ c.gradeLevel }}
            </span>
            <span class="text-[11px] font-medium text-slate-400">
              {{ c.studentCount != null ? c.studentCount + ' học sinh' : 'Lớp đang mở' }}
            </span>
          </div>

          <h3 class="font-bold text-slate-900 text-base leading-snug">{{ c.name }}</h3>
          <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ c.description || 'Chuyên đề Toán học nâng cao THPT' }}</p>

          <!-- Invite code for teacher -->
          <div v-if="c.inviteCode && authStore.isTeacher" class="mt-4 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">MÃ MỜI HỌC SINH</span>
              <code class="text-xs font-mono font-bold text-ocean-700">{{ c.inviteCode }}</code>
            </div>
            <button
              @click="copyInvite(c.inviteCode, c.id)"
              class="p-1.5 text-xs text-slate-500 hover:text-ocean-600 rounded-lg hover:bg-slate-200/60 transition"
              title="Sao chép mã"
            >
              <Check v-if="copiedId === c.id" class="w-4 h-4 text-emerald-600" />
              <Copy v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-400">Thầy giáo: {{ c.teacherName || 'Thầy Biên' }}</span>
          <router-link
            :to="`/app/classes/${c.id}`"
            class="text-xs font-bold text-ocean-600 hover:text-ocean-700"
          >
            Vào lớp →
          </router-link>
        </div>
      </div>
    </div>
  </div>

    <!-- Teacher Create Class Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-lg font-bold text-slate-900">Tạo Lớp Học Mới</h3>
        
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Tên lớp học</label>
          <input 
            v-model="newClassName"
            type="text" 
            placeholder="Ví dụ: Toán 12 - Luyện Đề THPTQG 9+"
            class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
          <select 
            v-model="newGradeLevel"
            class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
          >
            <option :value="6">Khối 6 (Toán THCS • KNTT / Cánh Diều)</option>
            <option :value="7">Khối 7 (Toán THCS)</option>
            <option :value="8">Khối 8 (Toán THCS)</option>
            <option :value="9">Khối 9 (Toán THCS • Ôn Thi Vào 10)</option>
            <option :value="10">Khối 10 (Toán THPT • Chương trình mới 2018)</option>
            <option :value="11">Khối 11 (Toán THPT)</option>
            <option :value="12">Khối 12 (Toán THPT • Luyện Thi Quốc Gia & ĐGNL)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Mô tả lớp học</label>
          <textarea 
            v-model="newDescription"
            rows="3"
            placeholder="Lớp học chuyên sâu giải tích, hình học không gian Oxyz..."
            class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3 pt-2">
          <button 
            @click="showCreateModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Hủy
          </button>
          <button 
            @click="handleCreateClass"
            class="px-5 py-2 text-xs font-bold bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl shadow-sm"
          >
            Tạo Lớp Ngay
          </button>
        </div>
      </div>
    </div>

    <!-- Student Join Class Modal -->
    <div v-if="showJoinModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-lg font-bold text-slate-900">Tham Gia Lớp Học</h3>
        <p class="text-xs text-slate-500">Nhập mã mời do thầy cô cung cấp để ghi danh vào lớp:</p>
        
        <div>
          <input 
            v-model="inviteCode"
            type="text" 
            placeholder="Ví dụ: BIEN12A"
            class="w-full px-3.5 py-2.5 text-sm uppercase font-mono font-bold tracking-wider text-center border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-2">
          <button 
            @click="showJoinModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Hủy
          </button>
          <button 
            @click="handleJoinClass"
            class="px-5 py-2 text-xs font-bold bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl shadow-sm"
          >
            Xác Nhận Vào Lớp
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
