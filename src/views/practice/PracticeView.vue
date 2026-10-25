<script setup>
import { ref, onMounted, computed } from 'vue'
import { catalogService } from '@/services/catalogService'
import { exerciseService } from '@/services/exerciseService'
import MathRenderer from '@/components/MathRenderer.vue'
import { BookOpen, AlertTriangle, CheckCircle2, ChevronRight, Layers, HelpCircle, Sparkles, GraduationCap } from 'lucide-vue-next'

// Catalog State
const subjects = ref([])
const sections = ref([])
const topics = ref([])
const lessonUnits = ref([])

const selectedSubjectId = ref(null)
const selectedSectionId = ref(null)
const selectedTopicId = ref(null)
const selectedUnit = ref(null)

// Exercise State
const exercises = ref([])
const activeTab = ref('practice') // 'practice' | 'theory' | 'mistakes'
const studentChoices = ref({})
const verifiedAnswers = ref({})
const isLoading = ref(true)

// Grade helper
const gradeList = [
  { grade: 6, label: 'Lớp 6', sub: 'THCS • KNTT / Cánh Diều', code: 'TOAN_6' },
  { grade: 7, label: 'Lớp 7', sub: 'THCS', code: 'TOAN_7' },
  { grade: 8, label: 'Lớp 8', sub: 'THCS', code: 'TOAN_8' },
  { grade: 9, label: 'Lớp 9', sub: 'THCS • Ôn Thi Vào 10', code: 'TOAN_9' },
  { grade: 10, label: 'Lớp 10', sub: 'THPT • CT 2018', code: 'TOAN_10' },
  { grade: 11, label: 'Lớp 11', sub: 'THPT', code: 'TOAN_11' },
  { grade: 12, label: 'Lớp 12', sub: 'THPT • Ôn Thi QG & ĐGNL', code: 'TOAN_12' }
]

const currentGrade = ref(12)

let currentSubjectRequestId = 0

const loadSectionsForSubject = async (subjectId) => {
  const reqId = ++currentSubjectRequestId
  try {
    const secRes = await catalogService.getSections(subjectId)
    if (reqId !== currentSubjectRequestId) return // discard stale response
    sections.value = secRes?.data || secRes || []
    
    if (sections.value.length > 0) {
      selectedSectionId.value = sections.value[0].id
      await loadTopicsForSection(selectedSectionId.value)
    } else {
      sections.value = []
      topics.value = []
      lessonUnits.value = []
      selectedUnit.value = null
      exercises.value = []
    }
  } catch (err) {
    if (reqId === currentSubjectRequestId) {
      console.error('Error loading sections:', err)
    }
  }
}

const loadTopicsForSection = async (sectionId) => {
  try {
    selectedSectionId.value = sectionId
    const topRes = await catalogService.getTopics(sectionId)
    topics.value = topRes?.data || topRes || []
    
    if (topics.value.length > 0) {
      selectedTopicId.value = topics.value[0].id
      await loadLessonUnitsForTopic(selectedTopicId.value)
    } else {
      topics.value = []
      lessonUnits.value = []
      selectedUnit.value = null
      exercises.value = []
    }
  } catch (err) {
    console.error('Error loading topics:', err)
  }
}

const loadLessonUnitsForTopic = async (topicId) => {
  try {
    selectedTopicId.value = topicId
    const unitRes = await catalogService.getLessonUnits(topicId)
    lessonUnits.value = unitRes?.data || unitRes || []
    
    if (lessonUnits.value.length > 0) {
      selectedUnit.value = lessonUnits.value[0]
      await loadExercises(selectedUnit.value.id)
    } else {
      lessonUnits.value = []
      selectedUnit.value = null
      exercises.value = []
    }
  } catch (err) {
    console.error('Error loading lesson units:', err)
  }
}

const switchGrade = async (gradeItem) => {
  currentGrade.value = gradeItem.grade
  isLoading.value = true
  
  // Find subject matching this grade code or id
  const matchedSubject = subjects.value.find(s => s.code === gradeItem.code || s.id === gradeItem.grade)
  if (matchedSubject) {
    selectedSubjectId.value = matchedSubject.id
    await loadSectionsForSubject(matchedSubject.id)
  } else if (subjects.value.length > 0) {
    selectedSubjectId.value = subjects.value[0].id
    await loadSectionsForSubject(selectedSubjectId.value)
  }
  
  isLoading.value = false
}

const selectLessonUnit = async (unit) => {
  selectedUnit.value = unit
  await loadExercises(unit.id)
}

const loadExercises = async (unitId) => {
  try {
    const res = await exerciseService.getByUnit(unitId, 0, 20)
    const list = res.data?.content || res.content || []
    exercises.value = list
  } catch (e) {
    exercises.value = []
  }
}

const selectAnswer = (exerciseId, choiceKey) => {
  studentChoices.value[exerciseId] = choiceKey
}

const verifyAnswer = (exercise) => {
  if (!studentChoices.value[exercise.id]) return
  verifiedAnswers.value[exercise.id] = true
}

onMounted(async () => {
  isLoading.value = true
  try {
    const subRes = await catalogService.getSubjects().catch(() => null)
    subjects.value = subRes?.data || subRes || []

    if (subjects.value.length > 0) {
      // Default to Grade 12 or first subject
      const defaultSub = subjects.value.find(s => s.code === 'TOAN_12' || s.id === 12) || subjects.value[0]
      selectedSubjectId.value = defaultSub.id
      if (defaultSub.code === 'TOAN_12' || defaultSub.id === 12) currentGrade.value = 12
      else if (defaultSub.code?.startsWith('TOAN_')) currentGrade.value = parseInt(defaultSub.code.replace('TOAN_', ''))
      
      await loadSectionsForSubject(selectedSubjectId.value)
    }
  } catch (e) {
    console.error('Failed to init catalog:', e)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header with Grade Switcher -->
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center space-x-2 text-xs font-semibold text-ocean-600 bg-ocean-50 px-3 py-1 rounded-full mb-1">
            <GraduationCap class="w-3.5 h-3.5" />
            <span>Chương trình Toán THCS & THPT Chuẩn K12</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Luyện Tập Toán Theo Khối Lớp & Chuyên Đề</h1>
          <p class="text-xs text-slate-500 mt-0.5">Chọn khối lớp để xem cây kiến thức, học lý thuyết cốt lõi, bẫy sai lầm và luyện giải câu hỏi phân loại</p>
        </div>

        <!-- Tab Switcher -->
        <div class="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs self-start sm:self-auto">
          <button
            @click="activeTab = 'practice'"
            :class="[
              'px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer',
              activeTab === 'practice' ? 'bg-ocean-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Luyện Bài Tập
          </button>
          <button
            @click="activeTab = 'theory'"
            :class="[
              'px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer',
              activeTab === 'theory' ? 'bg-ocean-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Lý Thuyết Cốt Lõi
          </button>
          <button
            @click="activeTab = 'mistakes'"
            :class="[
              'px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer',
              activeTab === 'mistakes' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Bẫy Sai Lầm Thường Gặp
          </button>
        </div>
      </div>

      <!-- Grade Selector Bar: 6 to 12 -->
      <div class="bg-white p-2 border border-slate-200/90 rounded-2xl shadow-xs overflow-x-auto flex items-center gap-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 whitespace-nowrap">Khối Lớp:</span>
        <div class="flex items-center space-x-2">
          <button
            v-for="g in gradeList"
            :key="g.grade"
            @click="switchGrade(g)"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer',
              currentGrade === g.grade 
                ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-500/20' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            ]"
          >
            <span>{{ g.label }}</span>
            <span :class="['text-[10px] px-1.5 py-0.5 rounded-full font-medium', currentGrade === g.grade ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600']">
              {{ g.sub }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main 2-column Layout: Left Topics Tree, Right Exercises/Theory -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- Left: Curriculum Tree Menu -->
      <div class="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <Layers class="w-4 h-4 text-ocean-600" />
            <span>Mục Lục Chương Trình Lớp {{ currentGrade }}</span>
          </div>
          <span class="text-[10px] bg-ocean-50 text-ocean-700 font-bold px-2 py-0.5 rounded-full">
            {{ sections.length }} chương
          </span>
        </div>

        <div v-if="isLoading" class="py-12 text-center text-xs text-slate-400">
          Đang tải danh mục bài học...
        </div>

        <div v-else-if="sections.length === 0" class="py-8 text-center text-xs text-slate-500">
          Chưa có nội dung cho lớp này trong hệ thống.
        </div>

        <div v-else class="space-y-4 text-xs">
          <!-- Sections Accordion -->
          <div v-for="sec in sections" :key="sec.id" class="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              @click="loadTopicsForSection(sec.id)"
              :class="[
                'w-full text-left p-3 font-bold transition flex items-center justify-between',
                selectedSectionId === sec.id ? 'bg-ocean-100/60 text-ocean-900' : 'text-slate-800 hover:bg-slate-100'
              ]"
            >
              <span>{{ sec.name }}</span>
              <ChevronRight :class="['w-3.5 h-3.5 transition-transform text-slate-400', selectedSectionId === sec.id ? 'rotate-90 text-ocean-600' : '']" />
            </button>

            <!-- Topics & Lesson Units under selected section -->
            <div v-if="selectedSectionId === sec.id" class="p-2 space-y-2 bg-white">
              <div v-for="top in topics" :key="top.id" class="space-y-1">
                <div class="px-2 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  {{ top.name }}
                </div>

                <div class="space-y-1">
                  <button
                    v-for="lu in lessonUnits"
                    :key="lu.id"
                    @click="selectLessonUnit(lu)"
                    :class="[
                      'w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between text-xs cursor-pointer',
                      selectedUnit?.id === lu.id 
                        ? 'bg-ocean-50 text-ocean-800 font-bold border border-ocean-200' 
                        : 'hover:bg-slate-50 text-slate-600'
                    ]"
                  >
                    <span class="truncate pr-2">{{ lu.title || lu.name }}</span>
                    <Sparkles v-if="selectedUnit?.id === lu.id" class="w-3.5 h-3.5 text-ocean-600 flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Content Area -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- Unit Title Card -->
        <div v-if="selectedUnit" class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
          <div class="flex items-center space-x-2 text-xs font-semibold text-ocean-600 mb-1">
            <BookOpen class="w-4 h-4" />
            <span>Toán Lớp {{ currentGrade }} • Dạng bài chuẩn</span>
          </div>
          <h2 class="text-xl font-bold text-slate-900">
            {{ selectedUnit.title || selectedUnit.name }}
          </h2>
        </div>

        <!-- TAB 1: PRACTICE EXERCISES -->
        <div v-if="activeTab === 'practice'" class="space-y-6">
          <div v-if="exercises.length === 0" class="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500 space-y-3">
            <HelpCircle class="w-8 h-8 text-slate-300 mx-auto" />
            <p class="text-sm font-semibold">Chưa có câu hỏi luyện tập cho dạng bài này.</p>
            <p class="text-xs text-slate-400">Vui lòng chọn dạng bài khác trong mục lục bên trái.</p>
          </div>

          <div 
            v-for="(ex, idx) in exercises" 
            :key="ex.id"
            class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4"
          >
            <!-- Question Header -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <span class="text-xs font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-lg">
                Câu {{ idx + 1 }} • {{ ex.difficulty || 'MEDIUM' }}
              </span>
              <span class="text-xs text-slate-400 font-mono">
                #EX-{{ ex.id }}
              </span>
            </div>

            <!-- Question Content with KaTeX -->
            <div class="text-slate-800 text-sm leading-relaxed">
              <MathRenderer :content="ex.contentMd || ex.content" />
            </div>

            <!-- Multiple Choice Options -->
            <div v-if="ex.choicesJson || ex.choices" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                v-for="choice in (ex.choicesJson || ex.choices)"
                :key="choice.key"
                @click="selectAnswer(ex.id, choice.key)"
                :disabled="verifiedAnswers[ex.id]"
                :class="[
                  'p-3.5 text-left text-xs rounded-2xl border transition flex items-start space-x-3 cursor-pointer',
                  studentChoices[ex.id] === choice.key 
                    ? 'border-ocean-600 bg-ocean-50/60 font-semibold text-ocean-900 ring-2 ring-ocean-500/20' 
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                ]"
              >
                <span class="w-5 h-5 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-700 flex-shrink-0">
                  {{ choice.key }}
                </span>
                <span class="flex-1">
                  <MathRenderer :content="choice.text" />
                </span>
              </button>
            </div>

            <!-- Check Button & Feedback -->
            <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div v-if="verifiedAnswers[ex.id]" class="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
                <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                <span>Đã ghi nhận câu trả lời của bạn!</span>
              </div>
              <div v-else class="text-xs text-slate-400">
                Chọn phương án và bấm kiểm tra để xem lời giải
              </div>

              <button
                v-if="!verifiedAnswers[ex.id]"
                @click="verifyAnswer(ex)"
                :disabled="!studentChoices[ex.id]"
                class="px-5 py-2 text-xs font-bold bg-ocean-600 hover:bg-ocean-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition shadow-xs cursor-pointer"
              >
                Kiểm Tra Đáp Án
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: THEORY -->
        <div v-else-if="activeTab === 'theory'" class="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-4">
          <div class="flex items-center space-x-2 text-xs font-bold text-ocean-700 uppercase tracking-wider pb-3 border-b border-slate-100">
            <BookOpen class="w-4 h-4 text-ocean-600" />
            <span>Phương Pháp Giải & Lý Thuyết Cốt Lõi</span>
          </div>

          <div v-if="selectedUnit?.theoryMd" class="prose prose-slate max-w-none text-sm leading-relaxed">
            <MathRenderer :content="selectedUnit.theoryMd" />
          </div>
          <div v-else class="text-slate-400 text-xs py-8 text-center">
            Chưa có tài liệu lý thuyết số hóa cho dạng bài này.
          </div>
        </div>

        <!-- TAB 3: COMMON MISTAKES -->
        <div v-else-if="activeTab === 'mistakes'" class="bg-white rounded-3xl border border-rose-200/90 p-8 shadow-sm space-y-4">
          <div class="flex items-center space-x-2 text-xs font-bold text-rose-700 uppercase tracking-wider pb-3 border-b border-rose-100">
            <AlertTriangle class="w-4 h-4 text-rose-600" />
            <span>Nhận Diện Các Bẫy Sai Lầm Kinh Điển Của Học Sinh</span>
          </div>

          <div v-if="selectedUnit?.commonMistakes" class="prose prose-rose max-w-none text-sm leading-relaxed bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
            <MathRenderer :content="selectedUnit.commonMistakes" />
          </div>
          <div v-else class="text-slate-400 text-xs py-8 text-center">
            Chưa cập nhật bẫy sai lầm cho dạng bài này.
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
