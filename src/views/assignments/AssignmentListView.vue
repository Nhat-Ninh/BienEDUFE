<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { assignmentService } from '@/services/assignmentService'
import { classService } from '@/services/classService'
import { exerciseService } from '@/services/exerciseService'
import MathRenderer from '@/components/MathRenderer.vue'
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  CheckSquare, 
  Square, 
  Sparkles, 
  BookOpen, 
  X,
  Filter
} from 'lucide-vue-next'

const authStore = useAuthStore()

const assignments = ref([])
const classes = ref([])
const isLoading = ref(true)

// Teacher Create Assignment Modal State
const showModal = ref(false)
const title = ref('')
const selectedClassId = ref('')
const dueAt = ref('')
const exerciseIdsStr = ref('1200001, 1200003, 1200004') // pre-filled with valid questions
const selectedExerciseIds = ref([1200001, 1200003, 1200004])

// Question Picker State
const showQuestionPicker = ref(false)
const availableExercises = ref([])
const isPickerLoading = ref(false)
const selectedUnitId = ref(120001)

const units = [
  { id: 120001, name: 'Lớp 12: Tính đơn điệu & Cực trị hàm số' },
  { id: 120002, name: 'Lớp 12: Đường tiệm cận đồ thị hàm số' },
  { id: 100001, name: 'Lớp 10: Bất phương trình bậc hai' },
  { id: 90001, name: 'Lớp 9: Căn bậc hai & Biến đổi căn thức' },
  { id: 60001, name: 'Lớp 6: Tập hợp & Số nguyên' }
]

const loadAssignments = async () => {
  isLoading.value = true
  try {
    const res = await assignmentService.getMyAssignments(0, 50)
    assignments.value = res.data?.content || res.content || []

    if (authStore.isTeacher) {
      const clsRes = await classService.getMyClasses(0, 50)
      classes.value = clsRes.data?.content || clsRes.content || []
    }
  } catch (e) {
    console.error('Error fetching assignments:', e)
  } finally {
    isLoading.value = false
  }
}

const loadUnitExercises = async (unitId) => {
  isPickerLoading.value = true
  try {
    const res = await exerciseService.getByUnit(unitId, 0, 30)
    availableExercises.value = res.data?.content || res.content || []
  } catch (err) {
    console.error('Error loading exercises:', err)
  } finally {
    isPickerLoading.value = false
  }
}

const openQuestionPicker = async () => {
  showQuestionPicker.value = true
  if (availableExercises.value.length === 0) {
    await loadUnitExercises(selectedUnitId.value)
  }
}

const toggleExerciseSelection = (id) => {
  const index = selectedExerciseIds.value.indexOf(id)
  if (index >= 0) {
    selectedExerciseIds.value.splice(index, 1)
  } else {
    selectedExerciseIds.value.push(id)
  }
  exerciseIdsStr.value = selectedExerciseIds.value.join(', ')
}

const isExerciseSelected = (id) => selectedExerciseIds.value.includes(id)

const selectPresetQuestions = () => {
  selectedExerciseIds.value = [1200001, 1200002, 1200003, 1200004]
  exerciseIdsStr.value = selectedExerciseIds.value.join(', ')
}

const syncIdsFromInput = () => {
  if (!exerciseIdsStr.value) {
    selectedExerciseIds.value = []
    return
  }
  selectedExerciseIds.value = exerciseIdsStr.value
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n))
}

const handleCreate = async () => {
  syncIdsFromInput()
  if (!title.value || !selectedClassId.value || !dueAt.value) {
    alert('Vui lòng nhập đầy đủ tiêu đề, chọn lớp và hạn nộp.')
    return
  }

  const exIds = selectedExerciseIds.value.length > 0 
    ? selectedExerciseIds.value 
    : [1200001, 1200003, 1200004]

  const formattedDueAt = dueAt.value.includes('T')
    ? (dueAt.value.length === 16 ? dueAt.value + ':00' : dueAt.value)
    : dueAt.value.replace(' ', 'T')

  try {
    await assignmentService.create({
      title: title.value,
      classId: parseInt(selectedClassId.value),
      dueAt: formattedDueAt,
      exerciseIds: exIds
    })
    showModal.value = false
    title.value = ''
    dueAt.value = ''
    exerciseIdsStr.value = '1200001, 1200003, 1200004'
    selectedExerciseIds.value = [1200001, 1200003, 1200004]
    await loadAssignments()
  } catch (e) {
    alert(e.response?.data?.message || e.message || 'Lỗi khi tạo bài kiểm tra.')
  }
}

onMounted(loadAssignments)
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          {{ authStore.isTeacher ? 'Quản Lý Bài Tập & Đề Thi' : 'Bài Tập & Đề Thi' }}
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ authStore.isTeacher ? 'Soạn đề thi, phân phối về các lớp và cài đặt hạn nộp' : 'Luyện đề bấm giờ và nộp bài kiểm tra định kỳ' }}
        </p>
      </div>

      <button
        v-if="authStore.isTeacher"
        @click="showModal = true"
        class="inline-flex items-center space-x-2 px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>Giao Bài Mới</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && assignments.length === 0" class="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3">
      <FileText class="w-12 h-12 text-slate-300 mx-auto" />
      <h3 class="text-base font-bold text-slate-800">Chưa có bài tập nào</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        {{ authStore.isTeacher ? 'Bấm "Giao Bài Mới" để tạo bài kiểm tra đầu tiên.' : 'Hiện chưa có bài tập nào được giao cho bạn.' }}
      </p>
    </div>

    <!-- Assignments List -->
    <div v-else class="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm divide-y divide-slate-100">
      <div 
        v-for="item in assignments"
        :key="item.id"
        class="p-5 sm:p-6 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div class="flex items-start space-x-3.5">
          <div class="w-10 h-10 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-slate-900 text-sm leading-snug">{{ item.title }}</h4>
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span class="font-medium text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded text-[11px]">{{ item.className || 'Toán THPT' }}</span>
              <span>•</span>
              <span class="flex items-center space-x-1">
                <Clock class="w-3.5 h-3.5 text-slate-400" />
                <span>Hạn nộp: {{ item.dueAt }}</span>
              </span>
              <span>•</span>
              <span>{{ item.exerciseCount || '3' }} câu hỏi</span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-3 self-end md:self-center">
          <router-link
            v-if="authStore.isStudent"
            :to="`/app/assignments/${item.id}/do`"
            class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1"
          >
            <span>Vào Làm Bài</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
          
          <router-link
            v-else
            :to="`/app/teacher/grading`"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1"
          >
            <span>Xem & Chấm Điểm</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Create Assignment Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 my-8">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900">Giao Bài Kiểm Tra Mới</h3>
          <button @click="showModal = false" class="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề bài kiểm tra</label>
          <input 
            v-model="title"
            type="text" 
            placeholder="Ví dụ: Đề kiểm tra 1 tiết Khảo sát hàm số & Tự luận"
            class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Chọn lớp giao bài</label>
            <select 
              v-model="selectedClassId"
              class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
            >
              <option value="" disabled>-- Chọn lớp --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }} (Lớp {{ c.gradeLevel }})</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Hạn nộp bài</label>
            <input 
              v-model="dueAt"
              type="datetime-local" 
              class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
            />
          </div>
        </div>

        <!-- Question Selection Area -->
        <div class="space-y-2 border-t border-slate-100 pt-3">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-semibold text-slate-700">Câu hỏi trong bài kiểm tra</label>
            <span class="text-xs font-bold text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded-full">
              Đã chọn: {{ selectedExerciseIds.length }} câu
            </span>
          </div>

          <div class="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              @click="openQuestionPicker"
              class="px-3.5 py-1.5 rounded-xl bg-ocean-50 text-ocean-700 border border-ocean-200 text-xs font-bold hover:bg-ocean-100 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <BookOpen class="w-3.5 h-3.5" />
              <span>Duyệt Chọn Từ Ngân Hàng Đề</span>
            </button>

            <button
              type="button"
              @click="selectPresetQuestions"
              class="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-500" />
              <span>Bộ đề Toán 12 Mẫu (Trắc nghiệm + Tự luận)</span>
            </button>
          </div>

          <div class="pt-2">
            <label class="block text-[11px] text-slate-500 mb-1">Danh sách ID câu hỏi:</label>
            <input 
              v-model="exerciseIdsStr"
              @input="syncIdsFromInput"
              type="text" 
              placeholder="1200001, 1200002, 1200003, 1200004"
              class="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button @click="showModal = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Hủy</button>
          <button @click="handleCreate" class="px-5 py-2 text-xs font-bold bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl shadow-sm cursor-pointer">Xác Nhận Giao Bài</button>
        </div>
      </div>
    </div>

    <!-- Question Picker Modal -->
    <div v-if="showQuestionPicker" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 class="text-base font-bold text-slate-900">Ngân Hàng Câu Hỏi — Chọn Đề Giao Bài</h3>
            <p class="text-xs text-slate-500">Đã chọn {{ selectedExerciseIds.length }} câu hỏi</p>
          </div>
          <button @click="showQuestionPicker = false" class="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Unit Selector Dropdown -->
        <div class="flex items-center space-x-3 flex-shrink-0">
          <Filter class="w-4 h-4 text-slate-400" />
          <select 
            v-model="selectedUnitId"
            @change="loadUnitExercises(selectedUnitId)"
            class="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500"
          >
            <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>

        <!-- Questions List Scrollable -->
        <div class="flex-1 overflow-y-auto space-y-3 pr-1">
          <div v-if="isPickerLoading" class="py-12 text-center text-xs text-slate-400">
            Đang tải câu hỏi...
          </div>
          <div 
            v-else
            v-for="ex in availableExercises" 
            :key="ex.id"
            @click="toggleExerciseSelection(ex.id)"
            :class="[
              'p-4 rounded-2xl border text-xs cursor-pointer transition flex items-start space-x-3',
              isExerciseSelected(ex.id) 
                ? 'border-ocean-500 bg-ocean-50/70 ring-1 ring-ocean-200' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            ]"
          >
            <div class="pt-0.5">
              <CheckSquare v-if="isExerciseSelected(ex.id)" class="w-4 h-4 text-ocean-600" />
              <Square v-else class="w-4 h-4 text-slate-400" />
            </div>
            <div class="flex-1 space-y-1.5">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-900 font-mono">#{{ ex.id }}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{{ ex.type }}</span>
                <span 
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold',
                    ex.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-700' : ex.difficulty === 'HARD' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  ]"
                >
                  {{ ex.difficulty }}
                </span>
              </div>
              <div class="text-slate-800">
                <MathRenderer :content="ex.contentMd" />
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
          <span class="text-xs text-slate-500">Đã chọn: <strong class="text-ocean-600">{{ selectedExerciseIds.length }}</strong> câu</span>
          <button 
            @click="showQuestionPicker = false" 
            class="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            Xong & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
