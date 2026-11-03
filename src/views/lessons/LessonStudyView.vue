<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { lessonService } from '@/services/lessonService'
import { parseStudyMarkdown, parsePracticeMarkdown } from '@/utils/studyContent'
import { loadStudyState, saveStudyState, summarize, percent, emptyStudyState } from '@/utils/studyState'
import { fileHref, fileKindLabel } from '@/utils/fileUrl'
import StudyTheoryPanel from '@/components/study/StudyTheoryPanel.vue'
import StudyPracticePanel from '@/components/study/StudyPracticePanel.vue'
import {
  ArrowLeft,
  BookOpen,
  PencilLine,
  Trophy,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  ArrowRight,
  Sparkles
} from 'lucide-vue-next'

const route = useRoute()
const auth = useAuthStore()
const lessonId = route.params.lessonId

const lesson = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const tab = ref('theory')
const state = ref(emptyStudyState())

const userId = computed(() => auth.user?.id)
const isStudent = computed(() => auth.isStudent)

const theoryDoc = computed(() => parseStudyMarkdown(lesson.value?.theoryContentMd))
const practiceDoc = computed(() => parsePracticeMarkdown(lesson.value?.exerciseContentMd))
const originalTheoryUrl = computed(() => fileHref(lesson.value?.theoryFileUrl))
const originalExerciseUrl = computed(() => fileHref(lesson.value?.exerciseFileUrl))

const theoryTotal = computed(() => theoryDoc.value.topics.length)
const theoryDone = computed(() => Math.min(state.value.doneTopics.filter(id => theoryDoc.value.topics.some(t => t.id === id)).length, theoryTotal.value))
const practiceQuestions = computed(() => practiceDoc.value.questions)
const summary = computed(() => summarize(state.value, theoryTotal.value, practiceQuestions.value))

const theoryPercent = computed(() => percent(summary.value.theoryDone, summary.value.theoryTotal))
const practicePercent = computed(() => percent(summary.value.practiceAnswered, summary.value.practiceTotal))
const quizDone = computed(() => ['SUBMITTED', 'GRADED'].includes(lesson.value?.studentSubmissionStatus))
const hasQuiz = computed(() => !!lesson.value?.quizAssignmentId)

// Tiến độ chung: lý thuyết + luyện tập + bài kiểm tra có trọng số bằng nhau trên những phần có thật
const overallPercent = computed(() => {
  const parts = []
  if (theoryTotal.value) parts.push(theoryPercent.value)
  if (practiceQuestions.value.length) parts.push(practicePercent.value)
  if (hasQuiz.value) parts.push(quizDone.value ? 100 : 0)
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0
})

const quizLabel = computed(() => {
  const s = lesson.value?.studentSubmissionStatus
  if (!hasQuiz.value) return 'Chưa mở'
  if (s === 'GRADED') return `${lesson.value.studentScore ?? 0} điểm`
  if (s === 'SUBMITTED') return 'Đã nộp bài'
  if (s === 'IN_PROGRESS') return 'Đang làm dở'
  return 'Chưa làm'
})

const tabs = computed(() => [
  {
    id: 'theory',
    label: 'Lý thuyết',
    icon: BookOpen,
    sub: theoryTotal.value ? `${summary.value.theoryDone}/${theoryTotal.value} mục` : (originalTheoryUrl.value ? 'Tài liệu' : 'Chưa có'),
    done: theoryTotal.value > 0 && summary.value.theoryDone >= theoryTotal.value
  },
  {
    id: 'practice',
    label: 'Luyện tập',
    icon: PencilLine,
    sub: practiceQuestions.value.length ? `${summary.value.practiceAnswered}/${practiceQuestions.value.length} câu` : (practiceDoc.value.notes || originalExerciseUrl.value ? 'Bài tập' : 'Chưa có'),
    done: practiceQuestions.value.length > 0 && summary.value.practiceAnswered >= practiceQuestions.value.length
  },
  { id: 'quiz', label: 'Kiểm tra', icon: Trophy, sub: quizLabel.value, done: quizDone.value }
])

// ───────────────────────── tải bài học & lưu tiến độ ─────────────────────────
const load = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await lessonService.getLessonDetail(lessonId)
    lesson.value = res.data || res
    state.value = isStudent.value ? loadStudyState(userId.value, lessonId) : emptyStudyState()

    const wanted = route.query.tab
    if (['theory', 'practice', 'quiz'].includes(wanted)) tab.value = wanted
    else if (!theoryDoc.value.hasContent && !originalTheoryUrl.value && (practiceQuestions.value.length || practiceDoc.value.notes)) tab.value = 'practice'
  } catch (e) {
    errorMessage.value = e.detail || e.message || 'Không mở được bài học này.'
  } finally {
    isLoading.value = false
  }
}

let saveTimer = null
const pushProgress = () => {
  saveTimer = null
  lessonService.updateProgress(lessonId, summary.value).catch(() => {
    // Mất mạng thoáng qua: trạng thái đã lưu trên máy, lần học sau sẽ gửi lại
  })
}
const syncProgress = () => {
  if (!isStudent.value || !lesson.value) return
  saveStudyState(userId.value, lessonId, state.value)
  clearTimeout(saveTimer)
  saveTimer = setTimeout(pushProgress, 500)
}

// Rời trang khi còn thay đổi chưa gửi (bấm sang làm bài kiểm tra ngay) thì gửi luôn, không bỏ mất tiến độ
onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    pushProgress()
  }
})

const toggleDone = (topicId) => {
  const set = new Set(state.value.doneTopics)
  set.has(topicId) ? set.delete(topicId) : set.add(topicId)
  state.value = { ...state.value, doneTopics: [...set] }
  syncProgress()
}
const openTopic = (topicId) => {
  state.value = { ...state.value, lastTopic: topicId }
  if (isStudent.value) saveStudyState(userId.value, lessonId, state.value)
}
const answerQuestion = (index, value) => {
  if (!isStudent.value) return
  state.value = { ...state.value, practice: { ...state.value.practice, [index]: value } }
  syncProgress()
}

watch(() => route.query.tab, (t) => { if (['theory', 'practice', 'quiz'].includes(t)) tab.value = t })
onMounted(load)

const goNext = () => {
  if (!nextStep.value) return
  tab.value = nextStep.value.to
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const nextStep = computed(() => {
  if (tab.value === 'theory' && (practiceQuestions.value.length || practiceDoc.value.notes)) return { to: 'practice', text: 'Sang phần Luyện tập' }
  if ((tab.value === 'theory' || tab.value === 'practice') && hasQuiz.value) return { to: 'quiz', text: 'Làm bài kiểm tra' }
  return null
})
</script>

<template>
  <div class="max-w-6xl mx-auto pb-20 space-y-6" data-testid="lesson-study">
    <router-link
      :to="lesson?.classId ? `/app/classes/${lesson.classId}` : '/app/classes'"
      class="inline-flex items-center space-x-1 text-xs font-semibold text-ocean-600 hover:underline"
    >
      <ArrowLeft class="w-3.5 h-3.5" /><span>Quay lại lớp {{ lesson?.className || '' }}</span>
    </router-link>

    <div v-if="isLoading" class="py-24 text-center text-sm text-slate-400">Đang mở bài học...</div>
    <div v-else-if="errorMessage" class="py-16 text-center bg-white rounded-3xl border border-rose-200 text-sm font-bold text-rose-700">{{ errorMessage }}</div>

    <template v-else-if="lesson">
      <div v-if="!isStudent" class="p-3 rounded-2xl bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-900 flex items-center space-x-2" data-testid="preview-banner">
        <Eye class="w-4 h-4 flex-shrink-0" />
        <span>Bạn đang xem bài học như học sinh sẽ thấy. Tiến độ và câu trả lời ở đây không được lưu.</span>
      </div>

      <!-- Đầu trang bài học -->
      <header class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-ocean-900 to-indigo-900 p-6 sm:p-9 text-white shadow-xl">
        <div class="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-ocean-400/20 blur-2xl"></div>
        <div class="absolute left-1/3 -bottom-20 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl"></div>
        <div class="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div class="space-y-2 min-w-0">
            <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold backdrop-blur-sm">
              <Sparkles class="w-3.5 h-3.5 text-amber-300" /><span>{{ lesson.className }} · {{ lesson.teacherName }}</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold leading-tight" data-testid="lesson-title">{{ lesson.title }}</h1>
            <p v-if="lesson.description" class="text-sm text-ocean-100 max-w-2xl leading-relaxed">{{ lesson.description }}</p>
          </div>

          <div v-if="isStudent" class="flex-shrink-0 w-full sm:w-56 space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-bold text-ocean-100">
              <span>Tiến độ bài học</span><span data-testid="overall-percent">{{ overallPercent }}%</span>
            </div>
            <div class="h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-all duration-700" :style="{ width: overallPercent + '%' }"></div>
            </div>
          </div>
        </div>
      </header>

      <!-- 3 bước: Lý thuyết → Luyện tập → Kiểm tra -->
      <nav class="grid grid-cols-3 gap-2 sm:gap-3 sticky top-2 z-20" aria-label="Các bước học">
        <button
          v-for="(t, i) in tabs"
          :key="t.id"
          type="button"
          :data-testid="`study-tab-${t.id}`"
          :aria-current="tab === t.id ? 'step' : undefined"
          :class="[
            'flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-2xl border-2 text-center sm:text-left transition shadow-sm backdrop-blur',
            tab === t.id ? 'bg-ocean-600 border-ocean-600 text-white shadow-lg' : 'bg-white/95 border-slate-200 text-slate-700 hover:border-ocean-300'
          ]"
          @click="tab = t.id"
        >
          <span
            :class="['w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              t.done ? 'bg-emerald-500 text-white' : tab === t.id ? 'bg-white/20 text-white' : 'bg-ocean-50 text-ocean-600']"
          >
            <CheckCircle2 v-if="t.done" class="w-5 h-5" />
            <component :is="t.icon" v-else class="w-5 h-5" />
          </span>
          <span class="min-w-0 w-full">
            <span class="hidden sm:block text-[10px] font-bold uppercase tracking-wide opacity-70">Bước {{ i + 1 }}</span>
            <span class="block text-xs sm:text-sm font-extrabold leading-tight sm:truncate">{{ t.label }}</span>
            <span class="block text-[10px] sm:text-[11px] font-semibold opacity-80 truncate">{{ t.sub }}</span>
          </span>
        </button>
      </nav>

      <!-- LÝ THUYẾT -->
      <section v-show="tab === 'theory'" class="space-y-4">
        <div v-if="originalTheoryUrl && theoryDoc.hasContent" class="flex justify-end">
          <a :href="originalTheoryUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 hover:text-ocean-700">
            <Download class="w-3.5 h-3.5" /><span>Tải tài liệu gốc ({{ fileKindLabel(lesson.theoryFileName, 'PDF') }})</span>
          </a>
        </div>

        <StudyTheoryPanel
          v-if="theoryDoc.hasContent"
          :markdown="lesson.theoryContentMd"
          :done-topics="state.doneTopics"
          :start-topic-id="state.lastTopic"
          :readonly="!isStudent"
          @toggle-done="toggleDone"
          @open-topic="openTopic"
        />

        <div v-else class="bg-white rounded-3xl border border-slate-200/90 p-10 text-center space-y-4 shadow-sm" data-testid="theory-empty">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-ocean-50 text-ocean-500 flex items-center justify-center"><FileText class="w-8 h-8" /></div>
          <h3 class="text-base font-extrabold text-slate-800">
            {{ originalTheoryUrl ? 'Giáo viên mới đính kèm tài liệu, chưa soạn bài giảng trên web' : 'Giáo viên chưa đăng lý thuyết cho bài này' }}
          </h3>
          <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {{ originalTheoryUrl ? 'Bạn vẫn có thể tải tài liệu về đọc. Khi giáo viên số hóa nội dung, bài giảng sẽ hiện ngay tại đây.' : 'Bạn có thể sang bước Luyện tập hoặc Kiểm tra nếu giáo viên đã mở.' }}
          </p>
          <a v-if="originalTheoryUrl" :href="originalTheoryUrl" target="_blank" rel="noopener noreferrer"
             class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold shadow transition">
            <Download class="w-4 h-4" /><span>Tải tài liệu {{ lesson.theoryFileName }}</span>
          </a>
        </div>
      </section>

      <!-- LUYỆN TẬP -->
      <section v-show="tab === 'practice'" class="space-y-4">
        <div v-if="originalExerciseUrl && practiceQuestions.length" class="flex justify-end">
          <a :href="originalExerciseUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 hover:text-ocean-700">
            <Download class="w-3.5 h-3.5" /><span>Tải đề gốc ({{ fileKindLabel(lesson.exerciseFileName, 'PDF') }})</span>
          </a>
        </div>

        <StudyPracticePanel
          v-if="practiceQuestions.length || practiceDoc.notes"
          :markdown="lesson.exerciseContentMd"
          :answers="state.practice"
          @answer="answerQuestion"
        />

        <div v-else class="bg-white rounded-3xl border border-slate-200/90 p-10 text-center space-y-4 shadow-sm" data-testid="practice-empty">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><PencilLine class="w-8 h-8" /></div>
          <h3 class="text-base font-extrabold text-slate-800">{{ originalExerciseUrl ? 'Bài tập được đính kèm dưới dạng file' : 'Giáo viên chưa đăng bài tập tự luyện' }}</h3>
          <a v-if="originalExerciseUrl" :href="originalExerciseUrl" target="_blank" rel="noopener noreferrer"
             class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition">
            <Download class="w-4 h-4" /><span>Tải bài tập {{ lesson.exerciseFileName }}</span>
          </a>
        </div>
      </section>

      <!-- KIỂM TRA -->
      <section v-show="tab === 'quiz'" data-testid="study-quiz">
        <div v-if="hasQuiz" class="bg-white rounded-3xl border border-amber-200/80 p-8 shadow-sm space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div class="space-y-1.5">
              <div class="inline-flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-700"><Trophy class="w-4 h-4" /><span>Bài kiểm tra đánh giá</span></div>
              <h3 class="text-xl font-extrabold text-slate-900">{{ lesson.quizTitle }}</h3>
              <p class="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{{ lesson.quizQuestionsCount || 0 }} câu hỏi</span>
                <span v-if="lesson.quizDurationMinutes" class="inline-flex items-center space-x-1"><Clock class="w-3.5 h-3.5" /><span>{{ lesson.quizDurationMinutes }} phút</span></span>
                <span v-if="lesson.quizDueAt" class="inline-flex items-center space-x-1"><Clock class="w-3.5 h-3.5" /><span>Hạn nộp {{ new Date(lesson.quizDueAt).toLocaleDateString('vi-VN') }}</span></span>
              </p>
            </div>
            <div v-if="lesson.studentScore != null" class="px-6 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div class="text-[11px] font-bold text-emerald-700 uppercase">Điểm của bạn</div>
              <div class="text-3xl font-extrabold text-emerald-700">{{ lesson.studentScore }}</div>
            </div>
          </div>

          <p v-if="isStudent && !quizDone && theoryTotal && summary.theoryDone < theoryTotal" class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
            💡 Bạn mới học {{ summary.theoryDone }}/{{ theoryTotal }} mục lý thuyết. Ôn thêm trước khi làm bài sẽ cho kết quả tốt hơn — nhưng bạn vẫn có thể làm bài bất cứ lúc nào.
          </p>

          <div v-if="isStudent">
            <router-link
              v-if="lesson.studentSubmissionStatus === 'GRADED' && lesson.studentSubmissionId"
              :to="`/app/submissions/${lesson.studentSubmissionId}`"
              class="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow transition"
              data-testid="view-result"
            ><span>🔍 Xem lời giải & điểm</span></router-link>
            <span v-else-if="lesson.studentSubmissionStatus === 'SUBMITTED'" class="inline-block px-5 py-3 rounded-2xl bg-sky-50 border border-sky-200 text-sm font-bold text-sky-800">
              Bạn đã nộp bài, đang chờ giáo viên chấm các câu tự luận.
            </span>
            <router-link
              v-else
              :to="`/app/assignments/${lesson.quizAssignmentId}/do`"
              class="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-extrabold shadow transition"
              data-testid="start-quiz"
            ><span>{{ lesson.studentSubmissionStatus === 'IN_PROGRESS' ? '✍️ Tiếp tục làm bài' : '✍️ Làm bài kiểm tra ngay' }}</span></router-link>
          </div>
        </div>
        <div v-else class="bg-white rounded-3xl border border-slate-200/90 p-10 text-center space-y-2 shadow-sm">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center"><Trophy class="w-8 h-8" /></div>
          <h3 class="text-base font-extrabold text-slate-800">Giáo viên chưa mở bài kiểm tra</h3>
          <p class="text-xs text-slate-500">Khi có đề, bạn sẽ làm bài tại đây sau khi học xong.</p>
        </div>
      </section>

      <div v-if="nextStep" class="flex justify-end">
        <button
          type="button"
          data-testid="next-step"
          class="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold shadow-lg transition"
          @click="goNext"
        >
          <span>{{ nextStep.text }}</span><ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </template>
  </div>
</template>
