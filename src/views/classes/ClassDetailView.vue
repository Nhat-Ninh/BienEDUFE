<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classService } from '@/services/classService'
import { assignmentService } from '@/services/assignmentService'
import { lessonService } from '@/services/lessonService'
import MathRenderer from '@/components/MathRenderer.vue'
import SmartPdfQuizModal from '@/components/SmartPdfQuizModal.vue'
import LessonTrackingModal from '@/components/LessonTrackingModal.vue'
import { 
  Users, 
  FileText, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  BookOpen, 
  Sparkles, 
  BarChart3, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'

const route = useRoute()
const classId = route.params.classId
const authStore = useAuthStore()

const classDetail = ref(null)
const students = ref([])
const assignments = ref([])
const lessons = ref([])
const isLoading = ref(true)
const activeTab = ref('lessons') // 'lessons', 'assignments', 'students'

// Modals
const showAddStudentModal = ref(false)
const showSmartQuizModal = ref(false)
const showTrackingModal = ref(false)
const activeLesson = ref(null)
const studentPhone = ref('')
const actionMessage = ref('')

const loadData = async () => {
  isLoading.value = true
  try {
    const [detailRes, assignRes, lessonRes] = await Promise.allSettled([
      classService.getClassDetail(classId),
      assignmentService.getForClass(classId),
      lessonService.getLessonsForClass(classId)
    ])

    if (detailRes.status === 'fulfilled') {
      classDetail.value = detailRes.value.data || detailRes.value
    }
    if (assignRes.status === 'fulfilled') {
      assignments.value = assignRes.value.data?.content || assignRes.value.content || []
    }
    if (lessonRes.status === 'fulfilled') {
      lessons.value = lessonRes.value.data || lessonRes.value || []
    }

    if (authStore.isTeacher) {
      const studentRes = await classService.getStudentsInClass(classId)
      students.value = studentRes.data || studentRes || []
    }
  } catch (e) {
    console.error('Error loading class data:', e)
  } finally {
    isLoading.value = false
  }
}

const handleAddStudent = async () => {
  if (!studentPhone.value) return
  try {
    await classService.addStudentByPhone(classId, { phone: studentPhone.value.trim() })
    actionMessage.value = 'Thêm học sinh thành công!'
    studentPhone.value = ''
    showAddStudentModal.value = false
    await loadData()
  } catch (e) {
    actionMessage.value = e.message || 'Không tìm thấy học sinh với số điện thoại này.'
  }
}

const handleRemoveStudent = async (studentId) => {
  if (!confirm('Bạn có chắc muốn xóa học sinh này khỏi lớp?')) return
  try {
    await classService.removeStudent(classId, studentId)
    await loadData()
  } catch (e) {
    alert(e.message || 'Lỗi khi xóa học sinh.')
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
  actionMessage.value = 'Đã tạo và xuất bản bài kiểm tra thành công!'
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-16">
    <!-- Breadcrumb & Title -->
    <div>
      <router-link to="/app/classes" class="inline-flex items-center space-x-1 text-xs font-semibold text-ocean-600 hover:underline mb-2">
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Quay lại danh sách lớp</span>
      </router-link>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-ocean-50 text-ocean-700">
              Khối {{ classDetail?.gradeLevel || 12 }}
            </span>
            <span v-if="classDetail?.inviteCode" class="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              Mã vào lớp: {{ classDetail.inviteCode }}
            </span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 mt-1">{{ classDetail?.name || 'Chi Tiết Lớp Học' }}</h1>
          <p class="text-xs text-slate-500">{{ classDetail?.description || 'Lớp học Toán BienEDU' }}</p>
        </div>

        <div class="flex items-center space-x-3">
          <router-link
            v-if="authStore.isTeacher"
            to="/app/teacher/lessons"
            class="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            <Plus class="w-4 h-4" />
            <span>Thêm Tài Liệu Mới</span>
          </router-link>

          <button
            v-if="authStore.isTeacher"
            @click="showAddStudentModal = true"
            class="inline-flex items-center space-x-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            <Users class="w-4 h-4" />
            <span>Thêm Học Sinh Vào Lớp</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Alert message -->
    <div v-if="actionMessage" class="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex justify-between items-center border border-emerald-200 shadow-xs animate-fade-in">
      <div class="flex items-center space-x-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span class="font-bold">{{ actionMessage }}</span>
      </div>
      <button @click="actionMessage = ''" class="font-bold">✕</button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center space-x-3 border-b border-slate-200 pb-2">
      <button
        @click="activeTab = 'lessons'"
        data-testid="tab-lessons"
        :class="[
          'px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2',
          activeTab === 'lessons'
            ? 'bg-ocean-600 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
        ]"
      >
        <BookOpen class="w-4 h-4" />
        <span>Tài Liệu & Bài Học ({{ lessons.length }})</span>
      </button>

      <button
        @click="activeTab = 'assignments'"
        data-testid="tab-assignments"
        :class="[
          'px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2',
          activeTab === 'assignments'
            ? 'bg-ocean-600 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
        ]"
      >
        <FileText class="w-4 h-4" />
        <span>Bài Tập Chung ({{ assignments.length }})</span>
      </button>

      <button
        v-if="authStore.isTeacher"
        @click="activeTab = 'students'"
        data-testid="tab-students"
        :class="[
          'px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2',
          activeTab === 'students'
            ? 'bg-ocean-600 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
        ]"
      >
        <Users class="w-4 h-4" />
        <span>Danh Sách Học Sinh ({{ students.length }})</span>
      </button>
    </div>

    <!-- TAB 1: TÀI LIỆU & BÀI HỌC (Lý Thuyết PDF & Bài Tập PDF & Làm Bài Kiểm Tra) -->
    <div v-if="activeTab === 'lessons'" class="space-y-6">
      <div v-if="lessons.length === 0" class="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center">
          <BookOpen class="w-7 h-7 text-ocean-400" />
        </div>
        <h3 class="text-base font-bold text-slate-800">Chưa có bài học nào trong lớp này</h3>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          {{ authStore.isTeacher 
            ? 'Hãy bấm "Thêm Tài Liệu Mới" để tải lên file PDF Lý thuyết & Bài tập và tạo bài kiểm tra cho học sinh.' 
            : 'Giáo viên sẽ sớm chia sẻ tài liệu bài giảng và bài tập lên đây.' }}
        </p>
        <router-link
          v-if="authStore.isTeacher"
          to="/app/teacher/lessons"
          class="inline-flex items-center space-x-1.5 px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow transition"
        >
          <Plus class="w-4 h-4" />
          <span>Thêm Bài Học Cho Lớp Ngay</span>
        </router-link>
      </div>

      <div v-else class="space-y-6">
        <div 
          v-for="(lesson, idx) in lessons" 
          :key="lesson.id"
          class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5 hover:border-ocean-300 transition"
        >
          <!-- Lesson Title & Info -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div class="flex items-center space-x-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ocean-600 text-white">
                  Bài {{ idx + 1 }}
                </span>
                <span class="text-xs text-slate-400">Giảng viên: {{ lesson.teacherName }}</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 leading-snug">
                {{ lesson.title }}
              </h3>
              <p v-if="lesson.description" class="text-xs text-slate-500 mt-1">
                {{ lesson.description }}
              </p>
            </div>
          </div>

          <!-- 3-Column Breakdown: Theory | Practice | Quiz -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            
            <!-- 1. Lý Thuyết -->
            <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3 flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-ocean-900 flex items-center space-x-1.5">
                    <FileText class="w-3.5 h-3.5 text-ocean-600" />
                    <span>1. Lý Thuyết</span>
                  </span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-ocean-100 text-ocean-800">PDF</span>
                </div>

                <div v-if="lesson.theoryFileName" class="text-xs font-semibold text-slate-800 truncate" :title="lesson.theoryFileName">
                  📄 {{ lesson.theoryFileName }}
                </div>
                <div v-else class="text-[11px] text-slate-400 italic">
                  Không có file PDF đính kèm
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
                <span v-else class="text-[11px] text-slate-400 block text-center py-1">Chưa cập nhật file</span>
              </div>
            </div>

            <!-- 2. Bài Tập Tự Luyện -->
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
                  Không có file PDF bài tập
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
                <span v-else class="text-[11px] text-slate-400 block text-center py-1">Chưa cập nhật file</span>
              </div>
            </div>

            <!-- 3. Bài Kiểm Tra Theo Bài Lý Thuyết (Interactive Quiz & Tracking) -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80 space-y-3 flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <Sparkles class="w-3.5 h-3.5 text-amber-600" />
                    <span>3. Bài Kiểm Tra Đánh Giá</span>
                  </span>

                  <!-- Status Badge -->
                  <span 
                    v-if="authStore.isStudent"
                    :class="[
                      'text-[10px] font-bold px-2 py-0.5 rounded',
                      lesson.studentSubmissionStatus === 'GRADED' ? 'bg-emerald-100 text-emerald-800' :
                      lesson.studentSubmissionStatus === 'SUBMITTED' ? 'bg-sky-100 text-sky-800' :
                      lesson.quizAssignmentId ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                    ]"
                  >
                    {{ lesson.studentSubmissionStatus === 'GRADED' ? 'Đã chấm điểm' : 
                       lesson.studentSubmissionStatus === 'SUBMITTED' ? 'Đã nộp bài' : 
                       lesson.quizAssignmentId ? 'Chưa làm' : 'Chưa mở' }}
                  </span>
                  <span 
                    v-else
                    :class="[
                      'text-[10px] font-bold px-2 py-0.5 rounded',
                      lesson.quizAssignmentId ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    ]"
                  >
                    {{ lesson.quizAssignmentId ? 'Đã xuất bản' : 'Chưa tạo đề' }}
                  </span>
                </div>

                <!-- Quiz Info -->
                <div v-if="lesson.quizAssignmentId" class="space-y-1.5">
                  <div class="text-xs font-bold text-slate-900 leading-snug">
                    {{ lesson.quizTitle || 'Bài kiểm tra trắc nghiệm' }}
                  </div>
                  <div class="text-[11px] text-slate-600">
                    Số câu: <strong>{{ lesson.quizQuestionsCount || 0 }} câu hỏi</strong>
                  </div>

                  <!-- Student Score badge if graded -->
                  <div v-if="authStore.isStudent && lesson.studentScore != null" class="p-2 bg-emerald-100/80 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-extrabold flex items-center justify-between">
                    <span>Kết quả đạt được:</span>
                    <span class="text-sm text-emerald-700">{{ lesson.studentScore }} / 10 điểm</span>
                  </div>
                </div>

                <div v-else class="text-[11px] text-slate-500 leading-relaxed">
                  {{ authStore.isTeacher ? 'Chưa có bài kiểm tra. Bấm tạo đề từ PDF để tự động bóc tách câu hỏi.' : 'Giáo viên chưa mở bài kiểm tra cho bài học này.' }}
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="pt-2">
                <!-- FOR STUDENT -->
                <template v-if="authStore.isStudent">
                  <router-link
                    v-if="lesson.quizAssignmentId && lesson.studentSubmissionStatus === 'GRADED' && lesson.studentSubmissionId"
                    :to="`/app/submissions/${lesson.studentSubmissionId}`"
                    class="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs"
                  >
                    <span>🔍 Xem Chi Tiết Lời Giải & Điểm</span>
                  </router-link>

                  <router-link
                    v-else-if="lesson.quizAssignmentId"
                    :to="`/app/assignments/${lesson.quizAssignmentId}/do`"
                    class="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs"
                  >
                    <span>✍️ Làm Bài Kiểm Tra Ngay</span>
                  </router-link>

                  <span v-else class="text-[11px] text-slate-400 block text-center py-1">
                    Chưa có đề kiểm tra
                  </span>
                </template>

                <!-- FOR TEACHER -->
                <template v-else>
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
                    <span>Tạo Đề Thi Từ PDF ⚡</span>
                  </button>
                </template>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: BÀI TẬP CHUNG -->
    <div v-else-if="activeTab === 'assignments'" class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 class="text-base font-bold text-slate-900">Bài tập & Đề thi của lớp</h2>
        <span class="text-xs text-slate-400">{{ assignments.length }} bài</span>
      </div>

      <div v-if="assignments.length === 0" class="text-center py-10 text-xs text-slate-400">
        Chưa có bài tập nào được giao cho lớp này.
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div v-for="item in assignments" :key="item.id" class="py-3 flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold text-slate-800">{{ item.title }}</h4>
            <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
              <Clock class="w-3 h-3" />
              <span>Hạn nộp: {{ item.dueAt || 'Không giới hạn' }}</span>
            </div>
          </div>
          <router-link
            :to="authStore.isTeacher ? `/app/teacher/grading` : `/app/assignments/${item.id}/do`"
            class="px-3 py-1.5 text-xs font-semibold bg-ocean-50 text-ocean-700 hover:bg-ocean-100 rounded-lg transition"
          >
            {{ authStore.isTeacher ? 'Xem bài nộp' : 'Làm bài' }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- TAB 3: DANH SÁCH HỌC SINH (Giáo viên) -->
    <div v-else-if="activeTab === 'students' && authStore.isTeacher" class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 class="text-base font-bold text-slate-900">Danh sách học sinh ({{ students.length }})</h2>
      </div>

      <div v-if="students.length === 0" class="text-center py-10 text-xs text-slate-400">
        Chưa có học sinh nào trong danh sách. Hãy gửi mã mời hoặc thêm bằng số điện thoại.
      </div>

      <div v-else class="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        <div v-for="st in students" :key="st.id" class="py-2.5 flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
              {{ st.fullName?.charAt(0) || 'H' }}
            </div>
            <div>
              <div class="text-xs font-bold text-slate-800">{{ st.fullName }}</div>
              <div class="text-[10px] text-slate-400">{{ st.phone || st.email }}</div>
            </div>
          </div>

          <button
            @click="handleRemoveStudent(st.id)"
            class="text-slate-400 hover:text-rose-600 p-1 transition"
            title="Xóa học sinh khỏi lớp"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Add Student -->
    <div v-if="showAddStudentModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-base font-bold text-slate-900">Thêm Học Sinh Bằng SĐT</h3>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại của học sinh</label>
          <input 
            v-model="studentPhone"
            type="tel" 
            placeholder="0912345678"
            class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-2">
          <button @click="showAddStudentModal = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
          <button @click="handleAddStudent" class="px-5 py-2 text-xs font-bold bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl shadow-sm">Thêm Ngay</button>
        </div>
      </div>
    </div>

    <!-- Modal Smart PDF Parser -->
    <SmartPdfQuizModal
      v-if="showSmartQuizModal && activeLesson"
      :lesson="activeLesson"
      @close="showSmartQuizModal = false"
      @quizCreated="handleQuizCreated"
    />

    <!-- Modal Tracking -->
    <LessonTrackingModal
      v-if="showTrackingModal && activeLesson"
      :lesson="activeLesson"
      @close="showTrackingModal = false"
    />
  </div>
</template>
