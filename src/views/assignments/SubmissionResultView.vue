<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { submissionService } from '@/services/submissionService'
import MathRenderer from '@/components/MathRenderer.vue'
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  RotateCcw, 
  BookOpen, 
  AlertTriangle, 
  MessageSquare,
  Sparkles,
  Award
} from 'lucide-vue-next'

const route = useRoute()
const submissionId = route.params.submissionId

const submission = ref(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    const res = await submissionService.getMyDetail(submissionId)
    submission.value = res.data || res
  } catch (e) {
    console.error('Error loading submission result:', e)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto pb-12">
    <router-link to="/app/assignments" class="inline-flex items-center space-x-1 text-xs font-semibold text-ocean-600 hover:underline">
      <ArrowLeft class="w-3.5 h-3.5" />
      <span>Về danh sách bài kiểm tra</span>
    </router-link>

    <!-- Score Summary Banner -->
    <div class="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-ocean-50 text-ocean-700 text-xs font-bold uppercase mb-2 border border-ocean-200/60">
          <Award class="w-3.5 h-3.5" />
          <span>Báo Cáo Điểm & Đánh Giá</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">{{ submission?.assignmentTitle || 'Bài Kiểm Tra Toán' }}</h1>
        <p class="text-xs text-slate-500 mt-1">
          Thời gian nộp: <span class="font-semibold text-slate-700">{{ submission?.submittedAt || 'Vừa xong' }}</span>
        </p>
      </div>

      <div class="bg-gradient-to-br from-ocean-50 to-sky-100 p-5 rounded-2xl border border-ocean-200 text-center min-w-44 flex-shrink-0">
        <span class="text-xs font-bold text-ocean-800 uppercase tracking-wide block">Tổng Điểm Đạt Được</span>
        <span class="text-4xl font-extrabold text-ocean-700">
          {{ submission?.totalScore != null ? submission.totalScore : '0.0' }}
        </span>
        <span class="text-xs text-slate-500 font-medium block mt-0.5">/ 10 điểm</span>
      </div>
    </div>

    <!-- Smart Feedback Reminder -->
    <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div class="flex items-center space-x-3">
        <div class="p-2 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
          <RotateCcw class="w-4 h-4" />
        </div>
        <div>
          <h4 class="text-xs font-bold text-slate-900">Chu kỳ ôn ngắt quãng Spaced Repetition 0-1-3-7 ngày</h4>
          <p class="text-[11px] text-slate-600">Các câu hỏi sai đã được tự động lưu vào Sổ tay lỗi sai để bạn luyện tập lại vào ngày mai.</p>
        </div>
      </div>
      <router-link 
        to="/app/mistakes" 
        class="px-3.5 py-1.5 rounded-xl bg-white text-slate-800 border border-slate-200 text-xs font-bold hover:bg-slate-50 transition shadow-xs flex-shrink-0"
      >
        Mở Sổ Tay Sai Lầm
      </router-link>
    </div>

    <!-- Answers Breakdown List -->
    <div class="space-y-4">
      <h2 class="text-base font-bold text-slate-900">Chi tiết bài làm & Lời giải</h2>

      <div 
        v-for="(ans, idx) in (submission?.answers || [])" 
        :key="ans.id || ans.exerciseId || idx"
        class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2">
            <CheckCircle2 v-if="ans.isCorrect === true" class="w-5 h-5 text-emerald-600" />
            <XCircle v-else-if="ans.isCorrect === false" class="w-5 h-5 text-rose-600" />
            <span v-else class="w-5 h-5 rounded-full border border-amber-400 text-amber-600 flex items-center justify-center text-[10px] font-bold">?</span>
            <span class="font-bold text-sm text-slate-900">Câu {{ idx + 1 }}</span>
            <span class="text-xs text-slate-400">({{ ans.exerciseType || 'TRẮC NGHIỆM' }})</span>
          </div>
          <span 
            :class="[
              'px-2.5 py-0.5 rounded-full text-xs font-bold',
              ans.isCorrect === true ? 'bg-emerald-100 text-emerald-800' : ans.isCorrect === false ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
            ]"
          >
            {{ ans.score != null ? `${ans.score} điểm` : (ans.isCorrect ? '+1.0 điểm' : 'Chờ chấm') }}
          </span>
        </div>

        <div class="text-sm font-medium text-slate-800">
          <MathRenderer :content="ans.contentMd || ans.content || ''" />
        </div>

        <div class="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200/60">
          <div class="flex items-start space-x-2">
            <span class="font-bold text-slate-600">Câu trả lời của bạn:</span>
            <code class="font-bold text-ocean-700 bg-white px-2 py-0.5 rounded border border-slate-200">{{ ans.studentAnswer || 'Chưa làm' }}</code>
          </div>
          <div v-if="ans.correctAnswer" class="flex items-start space-x-2">
            <span class="font-bold text-slate-600">Đáp án chính xác:</span>
            <code class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{{ ans.correctAnswer }}</code>
          </div>
        </div>

        <!-- Teacher feedback note if essay was graded -->
        <div v-if="ans.feedbackNote" class="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl text-xs space-y-1">
          <div class="flex items-center space-x-1.5 font-bold text-purple-900">
            <MessageSquare class="w-3.5 h-3.5 text-purple-700" />
            <span>Nhận xét từ Giáo Viên:</span>
          </div>
          <p class="text-slate-700 italic pl-5">{{ ans.feedbackNote }}</p>
        </div>

        <!-- Theory Remediation (chỉ hiện khi sai) -->
        <div v-if="ans.theoryMd" class="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl text-xs space-y-2">
          <div class="flex items-center space-x-1.5 font-bold text-sky-900">
            <BookOpen class="w-4 h-4 text-sky-700" />
            <span>📖 Kiến thức trọng tâm cần ôn lại:</span>
          </div>
          <div class="text-slate-700 pl-5">
            <MathRenderer :content="ans.theoryMd" />
          </div>
        </div>

        <!-- Common Mistakes -->
        <div v-if="ans.commonMistakes" class="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs space-y-2">
          <div class="flex items-center space-x-1.5 font-bold text-rose-900">
            <AlertTriangle class="w-4 h-4 text-rose-600" />
            <span>⚠️ Bẫy & Sai lầm thường gặp:</span>
          </div>
          <div class="text-slate-700 pl-5">
            <MathRenderer :content="ans.commonMistakes" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
