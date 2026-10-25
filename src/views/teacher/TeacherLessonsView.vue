<script setup>
import { ref, onMounted, computed } from 'vue'
import { lessonService } from '@/services/lessonService'
import { classService } from '@/services/classService'
import MathRenderer from '@/components/MathRenderer.vue'
import SmartPdfQuizModal from '@/components/SmartPdfQuizModal.vue'
import LessonTrackingModal from '@/components/LessonTrackingModal.vue'
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Upload, 
  Sparkles, 
  BarChart3, 
  Clock, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  HelpCircle,
  X
} from 'lucide-vue-next'

// State
const lessons = ref([])
const classes = ref([])
const selectedClassId = ref('')
const isLoading = ref(true)
const actionMessage = ref('')
const errorMessage = ref('')

// Modals
const showCreateModal = ref(false)
const showSmartQuizModal = ref(false)
const showTrackingModal = ref(false)
const activeLesson = ref(null)

// Form State for creating a lesson
const form = ref({
  classId: '',
  title: '',
  description: '',
  gradeLevel: 12,
  orderIndex: 0,
  theoryFileName: '',
  theoryFileUrl: '',
  theoryContentMd: '',
  exerciseFileName: '',
  exerciseFileUrl: '',
  exerciseContentMd: ''
})

const isUploadingTheory = ref(false)
const isUploadingExercise = ref(false)
const isSubmitting = ref(false)

const loadData = async () => {
  isLoading.value = true
  try {
    const [lessonRes, classRes] = await Promise.allSettled([
      lessonService.getMyLessonsAsTeacher(),
      classService.getMyClasses(0, 50)
    ])

    if (lessonRes.status === 'fulfilled') {
      lessons.value = lessonRes.value.data || lessonRes.value || []
    }
    if (classRes.status === 'fulfilled') {
      classes.value = classRes.value.data?.content || classRes.value.content || []
      if (classes.value.length > 0 && !form.value.classId) {
        form.value.classId = classes.value[0].id
      }
    }
  } catch (err) {
    console.error('Error loading teacher lessons:', err)
  } finally {
    isLoading.value = false
  }
}

const filteredLessons = computed(() => {
  if (!selectedClassId.value) return lessons.value
  return lessons.value.filter(l => l.classId === Number(selectedClassId.value))
})

// Upload PDF Lý thuyết
const handleUploadTheoryPdf = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isUploadingTheory.value = true
  errorMessage.value = ''
  try {
    const res = await lessonService.uploadFile(file)
    const data = res.data || res
    form.value.theoryFileName = data.fileName || file.name
    form.value.theoryFileUrl = data.fileUrl
  } catch (err) {
    errorMessage.value = 'Lỗi tải lên file PDF Lý thuyết: ' + (err.message || 'Thử lại sau.')
  } finally {
    isUploadingTheory.value = false
  }
}

// Upload PDF Bài tập
const handleUploadExercisePdf = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isUploadingExercise.value = true
  errorMessage.value = ''
  try {
    const res = await lessonService.uploadFile(file)
    const data = res.data || res
    form.value.exerciseFileName = data.fileName || file.name
    form.value.exerciseFileUrl = data.fileUrl
  } catch (err) {
    errorMessage.value = 'Lỗi tải lên file PDF Bài tập: ' + (err.message || 'Thử lại sau.')
  } finally {
    isUploadingExercise.value = false
  }
}

// Submit tạo bài học
const handleCreateLesson = async () => {
  if (!form.value.classId) {
    errorMessage.value = 'Vui lòng chọn lớp học áp dụng.'
    return
  }
  if (!form.value.title.trim()) {
    errorMessage.value = 'Vui lòng nhập tiêu đề bài học.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await lessonService.createLesson({
      classId: form.value.classId,
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      gradeLevel: form.value.gradeLevel,
      theoryFileName: form.value.theoryFileName,
      theoryFileUrl: form.value.theoryFileUrl,
      theoryContentMd: form.value.theoryContentMd,
      exerciseFileName: form.value.exerciseFileName,
      exerciseFileUrl: form.value.exerciseFileUrl,
      exerciseContentMd: form.value.exerciseContentMd
    })

    actionMessage.value = 'Tạo bài học & tài liệu PDF thành công!'
    showCreateModal.value = false
    resetForm()
    await loadData()
  } catch (err) {
    errorMessage.value = err.response?.data?.message || err.message || 'Lỗi khi tạo bài học.'
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteLesson = async (lessonId) => {
  if (!confirm('Bạn có chắc chắn muốn xóa bài học này? Tất cả đề thi liên quan sẽ bị gỡ.')) return
  try {
    await lessonService.deleteLesson(lessonId)
    actionMessage.value = 'Đã xóa bài học thành công.'
    await loadData()
  } catch (err) {
    alert(err.message || 'Lỗi khi xóa bài học.')
  }
}

const openSmartQuizModal = (lesson) => {
  activeLesson.value = lesson
  showSmartQuizModal.value = true
}

const openTrackingModal = (lesson) => {
  activeLesson.value = lesson
  showTrackingModal.value = true
}

const handleQuizCreated = async () => {
  actionMessage.value = 'Đã xuất bản bài kiểm tra thành công cho lớp học!'
  await loadData()
}

const resetForm = () => {
  form.value = {
    classId: classes.value.length > 0 ? classes.value[0].id : '',
    title: '',
    description: '',
    gradeLevel: 12,
    orderIndex: 0,
    theoryFileName: '',
    theoryFileUrl: '',
    theoryContentMd: '',
    exerciseFileName: '',
    exerciseFileUrl: '',
    exerciseContentMd: ''
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-16">
    <!-- Header banner -->
    <div class="bg-gradient-to-r from-ocean-800 via-indigo-800 to-ocean-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm text-ocean-100">
          <BookOpen class="w-3.5 h-3.5 text-amber-300" />
          <span>Kho Bài Giảng & Đề Thi Thông Minh</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Quản Lý Tài Liệu PDF & Bài Học
        </h1>
        <p class="text-ocean-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Đưa file PDF Lý thuyết & Bài tập lên lớp học, tích hợp công cụ AI bóc tách đề thi từ PDF và theo dõi chi tiết điểm số của từng học sinh.
        </p>
      </div>

      <button
        @click="showCreateModal = true"
        data-testid="add-lesson-btn"
        class="px-5 py-2.5 bg-white text-ocean-800 hover:bg-ocean-50 font-bold text-xs rounded-xl shadow transition flex items-center space-x-2 flex-shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span>Thêm Bài Học & PDF Mới</span>
      </button>
    </div>

    <!-- Alert Message -->
    <div v-if="actionMessage" class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs shadow-xs animate-fade-in">
      <div class="flex items-center space-x-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span class="font-bold">{{ actionMessage }}</span>
      </div>
      <button @click="actionMessage = ''" class="text-emerald-600 hover:text-emerald-800 font-bold">✕</button>
    </div>

    <!-- Filter & Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      <div class="flex items-center space-x-3">
        <span class="text-xs font-bold text-slate-700">Lọc theo lớp học:</span>
        <select
          v-model="selectedClassId"
          class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
        >
          <option value="">Tất cả các lớp ({{ lessons.length }} bài học)</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">
            {{ c.name }} (Khối {{ c.gradeLevel }})
          </option>
        </select>
      </div>

      <div class="text-xs text-slate-500">
        Hiển thị <strong>{{ filteredLessons.length }}</strong> bài học
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-16 text-center text-xs text-slate-400">
      Đang tải danh sách bài học & tài liệu...
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredLessons.length === 0" class="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center">
        <BookOpen class="w-7 h-7 text-ocean-400" />
      </div>
      <h3 class="text-base font-bold text-slate-800">Chưa có bài học nào được tạo</h3>
      <p class="text-xs text-slate-400 max-w-md mx-auto">
        Hãy bắt đầu bằng cách tải lên file PDF Lý thuyết & Bài tập tự luyện, sau đó dùng công cụ bóc tách PDF để tạo đề thi cho lớp.
      </p>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center space-x-1.5 px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow transition"
      >
        <Plus class="w-4 h-4" />
        <span>Tạo Bài Học Đầu Tiên</span>
      </button>
    </div>

    <!-- Lessons List -->
    <div v-else class="space-y-6">
      <div 
        v-for="lesson in filteredLessons" 
        :key="lesson.id"
        class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5 hover:border-ocean-300 transition"
      >
        <!-- Lesson Header -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2 mb-1.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ocean-50 text-ocean-700 border border-ocean-200">
                Lớp: {{ lesson.className }}
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Khối {{ lesson.gradeLevel }}
              </span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 leading-snug">
              {{ lesson.title }}
            </h3>
            <p v-if="lesson.description" class="text-xs text-slate-500 mt-1">
              {{ lesson.description }}
            </p>
          </div>

          <!-- Top Action Buttons -->
          <div class="flex items-center space-x-2 flex-shrink-0">
            <button
              @click="handleDeleteLesson(lesson.id)"
              class="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
              title="Xóa bài học"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 3-Column Structured Breakdown: Theory | Exercise | Quiz -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          <!-- PHẦN 1: Lý Thuyết (Theory PDF) -->
          <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-ocean-900 flex items-center space-x-1.5">
                  <FileText class="w-3.5 h-3.5 text-ocean-600" />
                  <span>1. Tài Liệu Lý Thuyết</span>
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-ocean-100 text-ocean-800">PDF</span>
              </div>

              <div v-if="lesson.theoryFileName" class="text-xs font-semibold text-slate-800 truncate" :title="lesson.theoryFileName">
                📄 {{ lesson.theoryFileName }}
              </div>
              <div v-else class="text-[11px] text-slate-400 italic">
                Chưa có file PDF đính kèm
              </div>

              <div v-if="lesson.theoryContentMd" class="p-2.5 bg-white rounded-xl border border-slate-100 text-[11px] text-slate-600 max-h-24 overflow-y-auto">
                <MathRenderer :content="lesson.theoryContentMd" />
              </div>
            </div>

            <div class="pt-2">
              <a
                v-if="lesson.theoryFileUrl"
                :href="lesson.theoryFileUrl"
                target="_blank"
                class="w-full py-2 px-3 bg-white hover:bg-ocean-50 text-ocean-700 border border-ocean-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                <span>Xem File PDF Lý Thuyết</span>
              </a>
              <span v-else class="text-[11px] text-slate-400 block text-center py-1">Không có file xem</span>
            </div>
          </div>

          <!-- PHẦN 2: Bài Tập Tự Luyện (Exercise PDF) -->
          <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                  <BookOpen class="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Bài Tập Tự Luyện</span>
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">PDF</span>
              </div>

              <div v-if="lesson.exerciseFileName" class="text-xs font-semibold text-slate-800 truncate" :title="lesson.exerciseFileName">
                📝 {{ lesson.exerciseFileName }}
              </div>
              <div v-else class="text-[11px] text-slate-400 italic">
                Chưa có file PDF bài tập
              </div>

              <div v-if="lesson.exerciseContentMd" class="p-2.5 bg-white rounded-xl border border-slate-100 text-[11px] text-slate-600 max-h-24 overflow-y-auto">
                <MathRenderer :content="lesson.exerciseContentMd" />
              </div>
            </div>

            <div class="pt-2">
              <a
                v-if="lesson.exerciseFileUrl"
                :href="lesson.exerciseFileUrl"
                target="_blank"
                class="w-full py-2 px-3 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                <span>Xem File PDF Bài Tập</span>
              </a>
              <span v-else class="text-[11px] text-slate-400 block text-center py-1">Không có file xem</span>
            </div>
          </div>

          <!-- PHẦN 3: Bài Kiểm Tra Đánh Giá (Quiz Assignment) -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80 space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-amber-600" />
                  <span>3. Bài Kiểm Tra Lý Thuyết</span>
                </span>
                <span 
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    lesson.quizAssignmentId ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  ]"
                >
                  {{ lesson.quizAssignmentId ? 'Đã xuất bản' : 'Chưa tạo' }}
                </span>
              </div>

              <!-- Nếu ĐÃ CÓ bài kiểm tra -->
              <div v-if="lesson.quizAssignmentId" class="space-y-1.5">
                <div class="text-xs font-bold text-slate-900 leading-snug">
                  {{ lesson.quizTitle || 'Đề kiểm tra trắc nghiệm' }}
                </div>
                <div class="text-[11px] text-slate-600 flex items-center space-x-2">
                  <span>Số câu hỏi: <strong>{{ lesson.quizQuestionsCount || 0 }} câu</strong></span>
                </div>
                <div v-if="lesson.quizDueAt" class="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Clock class="w-3 h-3" />
                  <span>Hạn: {{ new Date(lesson.quizDueAt).toLocaleDateString('vi-VN') }}</span>
                </div>
              </div>

              <!-- Nếu CHƯA CÓ bài kiểm tra -->
              <div v-else class="text-[11px] text-slate-500 leading-relaxed">
                Chưa có bài kiểm tra cho bài học này. Sử dụng công cụ bóc tách PDF để tạo đề thi trắc nghiệm tự động cho lớp.
              </div>
            </div>

            <!-- Quiz Action Buttons -->
            <div class="pt-2 space-y-2">
              <button
                v-if="lesson.quizAssignmentId"
                @click="openTrackingModal(lesson)"
                class="w-full py-2 px-3 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <BarChart3 class="w-3.5 h-3.5" />
                <span>Xem Bảng Điểm & Tracking</span>
              </button>

              <button
                v-else
                @click="openSmartQuizModal(lesson)"
                class="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <Sparkles class="w-3.5 h-3.5" />
                <span>Tạo Bài Kiểm Tra Từ PDF ⚡</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- MODAL THÊM BÀI HỌC MỚI -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Thêm Bài Học & Tài Liệu PDF Mới</h3>
            <p class="text-xs text-slate-500">Đưa bài giảng riêng biệt 2 phần Lý thuyết & Bài tập và gán cho lớp học</p>
          </div>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="errorMessage" class="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-5">
          <!-- Lớp học & Tiêu đề -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Gán cho lớp học *</label>
              <select 
                v-model="form.classId" 
                class="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option v-for="c in classes" :key="c.id" :value="c.id">
                  {{ c.name }} (Khối {{ c.gradeLevel }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Khối lớp</label>
              <select 
                v-model.number="form.gradeLevel" 
                class="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option :value="6">Khối 6</option>
                <option :value="7">Khối 7</option>
                <option :value="8">Khối 8</option>
                <option :value="9">Khối 9</option>
                <option :value="10">Khối 10</option>
                <option :value="11">Khối 11</option>
                <option :value="12">Khối 12</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tiêu đề bài học *</label>
            <input 
              v-model="form.title" 
              type="text" 
              placeholder="Ví dụ: Chuyên đề 1: Đạo hàm & Khảo sát hàm số nâng cao"
              class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Mô tả bài học</label>
            <textarea 
              v-model="form.description" 
              rows="2" 
              placeholder="Tóm tắt nội dung bài học..."
              class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none"
            ></textarea>
          </div>

          <!-- PHẦN 1: TẢI FILE LÝ THUYẾT RIÊNG -->
          <div class="p-4 bg-ocean-50/50 rounded-2xl border border-ocean-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-ocean-900 flex items-center space-x-1.5">
                <FileText class="w-4 h-4 text-ocean-600" />
                <span>Phần 1: Lý Thuyết (File PDF Riêng)</span>
              </span>
              <span v-if="form.theoryFileName" class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                ✓ Đã chọn: {{ form.theoryFileName }}
              </span>
            </div>

            <div class="flex items-center space-x-3">
              <label class="px-4 py-2 bg-white hover:bg-ocean-100 border border-ocean-300 text-ocean-700 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs">
                <span>{{ isUploadingTheory ? 'Đang tải lên...' : 'Chọn File PDF Lý Thuyết' }}</span>
                <input type="file" accept=".pdf" @change="handleUploadTheoryPdf" class="hidden" />
              </label>
              <input 
                v-model="form.theoryFileUrl" 
                type="text" 
                placeholder="Hoặc dán URL file PDF lý thuyết..."
                class="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Tóm tắt công thức lý thuyết (Hỗ trợ $formula$ KaTeX):</label>
              <textarea 
                v-model="form.theoryContentMd" 
                rows="2" 
                placeholder="Ví dụ: Công thức đạo hàm: $(u \cdot v)' = u'v + uv'$"
                class="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              ></textarea>
            </div>
          </div>

          <!-- PHẦN 2: TẢI FILE BÀI TẬP RIÊNG -->
          <div class="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                <BookOpen class="w-4 h-4 text-indigo-600" />
                <span>Phần 2: Bài Tập Tự Luyện (File PDF Riêng)</span>
              </span>
              <span v-if="form.exerciseFileName" class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                ✓ Đã chọn: {{ form.exerciseFileName }}
              </span>
            </div>

            <div class="flex items-center space-x-3">
              <label class="px-4 py-2 bg-white hover:bg-indigo-100 border border-indigo-300 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs">
                <span>{{ isUploadingExercise ? 'Đang tải lên...' : 'Chọn File PDF Bài Tập' }}</span>
                <input type="file" accept=".pdf" @change="handleUploadExercisePdf" class="hidden" />
              </label>
              <input 
                v-model="form.exerciseFileUrl" 
                type="text" 
                placeholder="Hoặc dán URL file PDF bài tập..."
                class="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Ghi chú & yêu cầu tự luyện:</label>
              <textarea 
                v-model="form.exerciseContentMd" 
                rows="2" 
                placeholder="Ví dụ: Hoàn thành bài 1 đến bài 10 trong file PDF trước thứ Bảy..."
                class="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 flex justify-end space-x-3 flex-shrink-0 bg-slate-50/50 rounded-b-3xl">
          <button 
            @click="showCreateModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            Hủy
          </button>
          <button 
            @click="handleCreateLesson"
            :disabled="isSubmitting"
            class="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            {{ isSubmitting ? 'Đang Lưu...' : 'Lưu Bài Học & Gán Cho Lớp' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL SMART PDF PARSER -->
    <SmartPdfQuizModal
      v-if="showSmartQuizModal && activeLesson"
      :lesson="activeLesson"
      @close="showSmartQuizModal = false"
      @quizCreated="handleQuizCreated"
    />

    <!-- MODAL TRACKING & THỐNG KÊ -->
    <LessonTrackingModal
      v-if="showTrackingModal && activeLesson"
      :lesson="activeLesson"
      @close="showTrackingModal = false"
    />
  </div>
</template>
