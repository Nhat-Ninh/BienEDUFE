<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classService } from '@/services/classService'
import { assignmentService } from '@/services/assignmentService'
import { lessonService } from '@/services/lessonService'
import MathRenderer from '@/components/MathRenderer.vue'
import { percent } from '@/utils/studyState'
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
  Eye,
  Pencil,
  PlayCircle,
  Trophy,
  PencilLine,
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
  actionMessage.value = activeLesson.value?.quizAssignmentId
    ? 'Đã lưu thay đổi bài kiểm tra thành công!'
    : 'Đã tạo và xuất bản bài kiểm tra thành công!'
  await loadData()
}

// ───────── Tiến độ học của học sinh trên từng bài ─────────
const progressOf = (lesson) => {
  const p = lesson.studentProgress || {}
  const quizDone = ['SUBMITTED', 'GRADED'].includes(lesson.studentSubmissionStatus)
  const parts = []
  if (p.theoryTotal > 0) parts.push(percent(p.theoryDone, p.theoryTotal))
  if (p.practiceTotal > 0) parts.push(percent(p.practiceAnswered, p.practiceTotal))
  if (lesson.quizAssignmentId) parts.push(quizDone ? 100 : 0)
  const overall = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0
  return {
    overall,
    theory: p.theoryTotal > 0 ? `${p.theoryDone}/${p.theoryTotal} mục` : (lesson.hasTheoryContent || lesson.theoryFileUrl ? 'Chưa học' : 'Chưa có'),
    theoryDone: p.theoryTotal > 0 && p.theoryDone >= p.theoryTotal,
    practice: p.practiceTotal > 0 ? `${p.practiceAnswered}/${p.practiceTotal} câu` : (lesson.hasExerciseContent || lesson.exerciseFileUrl ? 'Chưa làm' : 'Chưa có'),
    practiceDone: p.practiceTotal > 0 && p.practiceAnswered >= p.practiceTotal,
    quiz: !lesson.quizAssignmentId ? 'Chưa mở'
      : lesson.studentSubmissionStatus === 'GRADED' ? `${lesson.studentScore ?? 0} điểm`
      : lesson.studentSubmissionStatus === 'SUBMITTED' ? 'Đã nộp' : 'Chưa làm',
    quizDone,
    started: !!p.lastStudiedAt || overall > 0
  }
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
              {{ classDetail?.gradeLevel ? `Khối ${classDetail.gradeLevel}` : 'Chưa phân khối' }}
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

    <!-- TAB 1: BÀI HỌC (học sinh: lộ trình học · giáo viên: quản lý & theo dõi) -->
    <div v-if="activeTab === 'lessons'" class="space-y-5">
      <div v-if="lessons.length === 0" class="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center">
          <BookOpen class="w-7 h-7 text-ocean-400" />
        </div>
        <h3 class="text-base font-bold text-slate-800">Chưa có bài học nào trong lớp này</h3>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          {{ authStore.isTeacher
            ? 'Hãy bấm "Thêm Tài Liệu Mới" để đưa bài giảng, bài tập và bài kiểm tra lên cho học sinh.'
            : 'Giáo viên sẽ sớm chia sẻ bài giảng và bài tập lên đây.' }}
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

      <div v-else class="space-y-5">
        <article
          v-for="(lesson, idx) in lessons"
          :key="lesson.id"
          :data-testid="`lesson-card-${lesson.id}`"
          class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5 hover:border-ocean-300 hover:shadow-md transition"
        >
          <!-- Tiêu đề bài -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center space-x-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ocean-600 text-white">Bài {{ idx + 1 }}</span>
                <span class="text-xs text-slate-400 truncate">Giảng viên: {{ lesson.teacherName }}</span>
              </div>
              <h3 class="text-lg font-extrabold text-slate-900 leading-snug">{{ lesson.title }}</h3>
              <p v-if="lesson.description" class="text-xs text-slate-500 mt-1 leading-relaxed">{{ lesson.description }}</p>
            </div>

            <!-- Học sinh: vòng tiến độ -->
            <div v-if="authStore.isStudent" class="flex-shrink-0 sm:w-44 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Tiến độ</span><span :data-testid="`lesson-progress-${lesson.id}`">{{ progressOf(lesson).overall }}%</span>
              </div>
              <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-ocean-500 to-emerald-500 transition-all duration-500" :style="{ width: progressOf(lesson).overall + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 3 bước học -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <router-link
              :to="`/app/lessons/${lesson.id}?tab=theory`"
              class="group flex items-center gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-ocean-50 hover:border-ocean-300 transition"
            >
              <span :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', authStore.isStudent && progressOf(lesson).theoryDone ? 'bg-emerald-500 text-white' : 'bg-ocean-100 text-ocean-700']">
                <CheckCircle2 v-if="authStore.isStudent && progressOf(lesson).theoryDone" class="w-5 h-5" />
                <BookOpen v-else class="w-5 h-5" />
              </span>
              <span class="min-w-0">
                <span class="block text-xs font-extrabold text-slate-800">1. Lý thuyết</span>
                <span class="block text-[11px] text-slate-500 truncate">
                  {{ authStore.isStudent ? progressOf(lesson).theory : (lesson.hasTheoryContent ? 'Có bài giảng trên web' : (lesson.theoryFileName ? 'Chỉ có file đính kèm' : 'Chưa có')) }}
                </span>
              </span>
            </router-link>

            <router-link
              :to="`/app/lessons/${lesson.id}?tab=practice`"
              class="group flex items-center gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-indigo-50 hover:border-indigo-300 transition"
            >
              <span :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', authStore.isStudent && progressOf(lesson).practiceDone ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-700']">
                <CheckCircle2 v-if="authStore.isStudent && progressOf(lesson).practiceDone" class="w-5 h-5" />
                <PencilLine v-else class="w-5 h-5" />
              </span>
              <span class="min-w-0">
                <span class="block text-xs font-extrabold text-slate-800">2. Luyện tập</span>
                <span class="block text-[11px] text-slate-500 truncate">
                  {{ authStore.isStudent ? progressOf(lesson).practice : (lesson.hasExerciseContent ? 'Có bài tập trên web' : (lesson.exerciseFileName ? 'Chỉ có file đính kèm' : 'Chưa có')) }}
                </span>
              </span>
            </router-link>

            <router-link
              :to="`/app/lessons/${lesson.id}?tab=quiz`"
              class="group flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 hover:bg-amber-50 hover:border-amber-300 transition"
            >
              <span :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', authStore.isStudent && progressOf(lesson).quizDone ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700']">
                <CheckCircle2 v-if="authStore.isStudent && progressOf(lesson).quizDone" class="w-5 h-5" />
                <Trophy v-else class="w-5 h-5" />
              </span>
              <span class="min-w-0">
                <span class="block text-xs font-extrabold text-slate-800">3. Kiểm tra</span>
                <span class="block text-[11px] text-slate-500 truncate">
                  {{ authStore.isStudent ? progressOf(lesson).quiz : (lesson.quizAssignmentId ? `${lesson.quizQuestionsCount || 0} câu · đã xuất bản` : 'Chưa tạo đề') }}
                </span>
              </span>
            </router-link>
          </div>

          <!-- Hành động -->
          <div class="flex flex-wrap items-center gap-2.5 pt-1">
            <router-link
              :to="`/app/lessons/${lesson.id}`"
              :data-testid="`open-lesson-${lesson.id}`"
              class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-ocean-600 to-indigo-600 hover:from-ocean-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md transition"
            >
              <component :is="authStore.isStudent ? PlayCircle : Eye" class="w-4 h-4" />
              <span>{{ authStore.isStudent ? (progressOf(lesson).started ? 'Tiếp tục học' : 'Vào học') : 'Xem như học sinh' }}</span>
            </router-link>

            <template v-if="authStore.isTeacher">
              <router-link
                :to="`/app/teacher/lessons?edit=${lesson.id}`"
                class="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                <Pencil class="w-3.5 h-3.5" /><span>Sửa bài học</span>
              </router-link>
              <button
                @click="openSmartQuizModal(lesson)"
                class="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 text-xs font-bold transition"
              >
                <Sparkles class="w-3.5 h-3.5" /><span>{{ lesson.quizAssignmentId ? 'Sửa đề kiểm tra' : 'Tạo đề kiểm tra' }}</span>
              </button>
              <button
                @click="openTrackingModal(lesson)"
                class="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-ocean-50 border border-ocean-200 hover:bg-ocean-100 text-ocean-800 text-xs font-bold transition"
              >
                <BarChart3 class="w-3.5 h-3.5" /><span>Tiến độ & bảng điểm</span>
              </button>
            </template>
          </div>
        </article>
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
