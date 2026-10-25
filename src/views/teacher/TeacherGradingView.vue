<script setup>
import { ref, onMounted } from 'vue'
import { assignmentService } from '@/services/assignmentService'
import { submissionService } from '@/services/submissionService'
import { feedbackTemplateService } from '@/services/feedbackTemplateService'
import MathRenderer from '@/components/MathRenderer.vue'
import { 
  CheckSquare, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  Check, 
  Clock, 
  User, 
  Award,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'

const assignments = ref([])
const selectedAssignmentId = ref(null)
const submissions = ref([])
const currentSubmission = ref(null)
const isLoadingAssignments = ref(true)
const isLoadingSubmissions = ref(false)
const isLoadingDetail = ref(false)

const templates = ref([])
const newTemplateText = ref('')
const showTemplateModal = ref(false)

const gradeScore = ref(2.0)
const gradeFeedback = ref('')
const isGrading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const loadInitialData = async () => {
  isLoadingAssignments.value = true
  try {
    const [assignRes, tplRes] = await Promise.all([
      assignmentService.getMyAssignments(0, 50),
      feedbackTemplateService.getMyTemplates().catch(() => ({ data: [] }))
    ])

    assignments.value = assignRes.data?.content || assignRes.content || []
    templates.value = tplRes.data || tplRes || [
      { id: 1, content: 'Trình bày mạch lạc, lập luận chặt chẽ. Rất đáng khen!' },
      { id: 2, content: 'Cần lưu ý kiểm tra lại điều kiện nghiệm trước khi kết luận.' },
      { id: 3, content: 'Bước biến đổi tích phân chính xác, áp dụng đúng công thức.' }
    ]

    if (assignments.value.length > 0) {
      selectedAssignmentId.value = assignments.value[0].id
      await loadSubmissions(selectedAssignmentId.value)
    }
  } catch (err) {
    console.error('Error loading initial grading data:', err)
  } finally {
    isLoadingAssignments.value = false
  }
}

const loadSubmissions = async (assignmentId) => {
  if (!assignmentId) return
  isLoadingSubmissions.value = true
  submissions.value = []
  currentSubmission.value = null
  try {
    const res = await submissionService.getForAssignment(assignmentId)
    submissions.value = res.data?.content || res.content || []

    if (submissions.value.length > 0) {
      await selectSubmission(submissions.value[0])
    }
  } catch (err) {
    console.error('Error fetching submissions for assignment:', err)
  } finally {
    isLoadingSubmissions.value = false
  }
}

const selectSubmission = async (sub) => {
  isLoadingDetail.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    const res = await submissionService.getDetailForTeacher(sub.id)
    currentSubmission.value = res.data || res
    
    // Find first essay answer to pre-populate score & feedback
    const firstEssay = currentSubmission.value?.answers?.find(a => a.exerciseType === 'ESSAY')
    if (firstEssay) {
      gradeScore.value = firstEssay.score != null ? Number(firstEssay.score) : 2.0
      gradeFeedback.value = firstEssay.feedbackNote || ''
    }
  } catch (err) {
    console.error('Error fetching submission detail for teacher:', err)
  } finally {
    isLoadingDetail.value = false
  }
}

const addTemplateToFeedback = (text) => {
  if (gradeFeedback.value) {
    gradeFeedback.value += ' ' + text
  } else {
    gradeFeedback.value = text
  }
}

const handleCreateTemplate = async () => {
  if (!newTemplateText.value) return
  try {
    await feedbackTemplateService.create({ content: newTemplateText.value })
    newTemplateText.value = ''
    showTemplateModal.value = false
    const tplRes = await feedbackTemplateService.getMyTemplates()
    templates.value = tplRes.data || tplRes || []
  } catch (err) {
    alert(err.message || 'Lỗi khi tạo mẫu nhận xét.')
  }
}

const handleGrade = async (answer) => {
  if (!answer?.id) {
    alert('Không tìm thấy thông tin câu trả lời tự luận.')
    return
  }

  isGrading.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await submissionService.gradeEssay({
      submissionAnswerId: answer.id,
      score: gradeScore.value,
      feedback: gradeFeedback.value
    })
    successMsg.value = '✓ Chấm điểm và gửi nhận xét thành công!'
    // Refresh submission
    await selectSubmission(currentSubmission.value)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Lỗi khi lưu điểm.'
  } finally {
    isGrading.value = false
  }
}

onMounted(loadInitialData)
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Chấm Điểm & Nhận Xét Bài Tự Luận</h1>
        <p class="text-xs text-slate-500 mt-0.5">Soi chi tiết bài giải tự luận và sử dụng mẫu nhận xét nhanh thông minh</p>
      </div>

      <button
        @click="showTemplateModal = true"
        class="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
      >
        <Plus class="w-3.5 h-3.5 text-ocean-600" />
        <span>Thêm Mẫu Nhận Xét Nhanh</span>
      </button>
    </div>

    <!-- Assignment Selector Toolbar -->
    <div class="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
      <div class="flex items-center space-x-2 text-xs font-semibold text-slate-700 flex-shrink-0">
        <Filter class="w-4 h-4 text-ocean-600" />
        <span>Chọn bài kiểm tra cần chấm:</span>
      </div>

      <select 
        v-model="selectedAssignmentId"
        @change="loadSubmissions(selectedAssignmentId)"
        class="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500 font-medium"
      >
        <option v-for="a in assignments" :key="a.id" :value="a.id">
          {{ a.title }} (Lớp: {{ a.className || 'Toán' }} — Hạn nộp: {{ a.dueAt }})
        </option>
      </select>
    </div>

    <!-- Status Messages -->
    <div v-if="successMsg" class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
      <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <span>{{ successMsg }}</span>
    </div>

    <div v-if="errorMsg" class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
      <AlertCircle class="w-4 h-4 text-rose-600 flex-shrink-0" />
      <span>{{ errorMsg }}</span>
    </div>

    <!-- Main Grid: Submissions Roster Sidebar & Grading Pane -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Submissions List (Left Col) -->
      <div class="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm space-y-3 h-fit max-h-[700px] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Danh Sách Học Sinh Nộp Bài</h3>
          <span class="text-[11px] font-bold text-ocean-600 bg-ocean-50 px-2 py-0.5 rounded-full">{{ submissions.length }} bài</span>
        </div>

        <div v-if="isLoadingSubmissions" class="text-center py-8 text-xs text-slate-400">
          Đang tải danh sách bài nộp...
        </div>

        <div v-else-if="submissions.length === 0" class="text-center py-8 text-xs text-slate-400 space-y-2">
          <User class="w-8 h-8 text-slate-300 mx-auto" />
          <p>Chưa có học sinh nào nộp bài cho đề thi này.</p>
        </div>

        <div v-else class="space-y-2">
          <button
            v-for="sub in submissions"
            :key="sub.id"
            @click="selectSubmission(sub)"
            :class="[
              'w-full text-left p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer',
              currentSubmission?.id === sub.id 
                ? 'border-ocean-500 bg-ocean-50/80 ring-1 ring-ocean-200 shadow-xs' 
                : 'border-slate-100 hover:bg-slate-50'
            ]"
          >
            <div>
              <h4 class="text-xs font-bold text-slate-900 leading-tight">
                {{ sub.studentName || `Học sinh #${sub.studentId}` }}
              </h4>
              <div class="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                <Clock class="w-3 h-3" />
                <span>{{ sub.submittedAt || 'Mới nộp' }}</span>
              </div>
            </div>

            <div class="text-right">
              <span 
                :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-bold block mb-1',
                  sub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                ]"
              >
                {{ sub.status === 'GRADED' ? 'Đã chấm' : 'Chờ chấm' }}
              </span>
              <span class="text-xs font-black text-slate-800">{{ sub.totalScore != null ? `${sub.totalScore}đ` : '—' }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Grading Workspace (Right Col) -->
      <div class="lg:col-span-8 space-y-6">
        <div v-if="!currentSubmission" class="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
          Chọn một bài nộp ở cột bên trái để bắt đầu chấm điểm.
        </div>

        <div v-else class="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <!-- Student Info Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <span 
                :class="[
                  'text-xs font-bold px-2.5 py-0.5 rounded-md uppercase',
                  currentSubmission.status === 'GRADED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                ]"
              >
                {{ currentSubmission.status === 'GRADED' ? 'Bài Đã Chốt Điểm' : 'Bài Đang Chờ Giáo Viên Chấm' }}
              </span>
              <h2 class="text-lg font-bold text-slate-900 mt-1.5">
                {{ currentSubmission.studentName || `Học sinh ID: ${currentSubmission.studentId}` }}
              </h2>
              <div class="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                <span>{{ currentSubmission.assignmentTitle }}</span>
                <span>•</span>
                <span>Nộp lúc: {{ currentSubmission.submittedAt }}</span>
              </div>
            </div>

            <div class="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-right">
              <span class="text-[11px] text-slate-400 font-medium block">Tổng điểm hiện tại:</span>
              <span class="text-2xl font-black text-ocean-700">{{ currentSubmission.totalScore != null ? currentSubmission.totalScore : 0 }} <span class="text-xs font-semibold">/ 10</span></span>
            </div>
          </div>

          <!-- Answers Loop (Focusing on ESSAY) -->
          <div 
            v-for="(ans, idx) in currentSubmission.answers" 
            :key="ans.id || idx"
            class="space-y-4 pt-2 border-t border-slate-100 first:border-0 first:pt-0"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-slate-900">Câu {{ idx + 1 }}:</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{{ ans.exerciseType }}</span>
              </div>
              <span class="text-xs font-bold text-slate-700">Điểm: {{ ans.score != null ? ans.score : 'Chờ chấm' }}</span>
            </div>

            <!-- Question Prompt -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-sm text-slate-800 font-medium leading-relaxed">
              <MathRenderer :content="ans.contentMd || ans.content || ''" />
            </div>

            <!-- Student Answer Box -->
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bài làm của học sinh:</span>
              <div class="p-4 bg-slate-50/60 rounded-2xl border border-ocean-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap shadow-inner">
                {{ ans.studentAnswer || '(Không có câu trả lời)' }}
              </div>
            </div>

            <!-- If ESSAY: Show Score & Comment Panel -->
            <div v-if="ans.exerciseType === 'ESSAY'" class="space-y-4 bg-ocean-50/40 p-4 sm:p-5 rounded-2xl border border-ocean-100">
              <!-- Quick Feedback Template Pills -->
              <div class="space-y-2">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                  <Sparkles class="w-3.5 h-3.5 text-amber-500" />
                  <span>Chèn nhanh mẫu nhận xét:</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="tpl in templates"
                    :key="tpl.id"
                    type="button"
                    @click="addTemplateToFeedback(tpl.content)"
                    class="px-3 py-1 bg-white hover:bg-ocean-50 hover:text-ocean-700 border border-slate-200 rounded-xl text-xs text-slate-600 transition cursor-pointer"
                  >
                    + {{ tpl.content }}
                  </button>
                </div>
              </div>

              <!-- Score & Comment Form -->
              <div class="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                <div class="md:col-span-3">
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Cho điểm (0 - 2.5)</label>
                  <input 
                    v-model.number="gradeScore"
                    type="number" 
                    step="0.25"
                    min="0"
                    max="10"
                    class="w-full px-3.5 py-2 text-base font-bold text-ocean-700 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                </div>

                <div class="md:col-span-9">
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Nhận xét chi tiết cho học sinh</label>
                  <input 
                    v-model="gradeFeedback"
                    type="text" 
                    placeholder="Các bước biến đổi chính xác, lập luận chặt chẽ..."
                    class="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button
                  @click="handleGrade(ans)"
                  :disabled="isGrading"
                  class="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Award class="w-3.5 h-3.5" />
                  <span>{{ isGrading ? 'Đang lưu...' : 'Lưu Điểm Tự Luận' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Create Modal -->
    <div v-if="showTemplateModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-base font-bold text-slate-900">Thêm Mẫu Nhận Xét Nhanh</h3>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Nội dung mẫu nhận xét</label>
          <input 
            v-model="newTemplateText"
            type="text" 
            placeholder="Ví dụ: Cần chú ý điều kiện mẫu số khác không trước khi chia..."
            class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-2">
          <button @click="showTemplateModal = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Hủy</button>
          <button @click="handleCreateTemplate" class="px-5 py-2 text-xs font-bold bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl shadow-sm cursor-pointer">Lưu Mẫu</button>
        </div>
      </div>
    </div>
  </div>
</template>
