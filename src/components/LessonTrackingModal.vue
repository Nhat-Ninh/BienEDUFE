<script setup>
import { ref, onMounted } from 'vue'
import { lessonService } from '@/services/lessonService'
import MathRenderer from '@/components/MathRenderer.vue'
import { 
  X, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Award, 
  Search, 
  TrendingUp,
  FileText
} from 'lucide-vue-next'

const props = defineProps({
  lesson: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const trackingData = ref(null)
const isLoading = ref(true)
const searchQuery = ref('')
const activeTab = ref('students') // 'students' or 'questions'

const loadTracking = async () => {
  isLoading.value = true
  try {
    const res = await lessonService.getLessonTracking(props.lesson.id)
    trackingData.value = res.data || res
  } catch (err) {
    console.error('Error loading lesson tracking:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadTracking)
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div>
          <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-1">
            <BarChart3 class="w-3.5 h-3.5 text-emerald-600" />
            <span>Thống Kê Kết Quả Bài Kiểm Tra</span>
          </div>
          <h2 class="text-lg font-bold text-slate-900">
            {{ lesson.title }}
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Lớp: {{ trackingData?.className || lesson.className }} • Đề thi: {{ trackingData?.quizTitle || 'Bài kiểm tra' }}
          </p>
        </div>
        <button 
          @click="$emit('close')"
          class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="p-12 text-center text-xs text-slate-400">
        Đang tải dữ liệu tracking từ cơ sở dữ liệu...
      </div>

      <!-- Content -->
      <div v-else class="p-6 overflow-y-auto flex-1 space-y-6">

        <!-- KPI Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span class="text-[11px] text-slate-500 font-medium">Tỷ lệ hoàn thành</span>
            <div class="text-2xl font-bold text-slate-900 mt-1">
              {{ trackingData?.completionRate || 0 }}%
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">
              {{ trackingData?.submittedCount || 0 }}/{{ trackingData?.totalStudents || 0 }} học sinh đã nộp
            </div>
          </div>

          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span class="text-[11px] text-slate-500 font-medium">Điểm trung bình</span>
            <div class="text-2xl font-bold text-ocean-700 mt-1">
              {{ trackingData?.averageScore != null ? trackingData.averageScore : '0.0' }}
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">Thang điểm 10</div>
          </div>

          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span class="text-[11px] text-slate-500 font-medium">Điểm cao nhất</span>
            <div class="text-2xl font-bold text-emerald-600 mt-1">
              {{ trackingData?.highestScore != null ? trackingData.highestScore : '0.0' }}
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">Thủ khoa lớp</div>
          </div>

          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span class="text-[11px] text-slate-500 font-medium">Điểm thấp nhất</span>
            <div class="text-2xl font-bold text-amber-600 mt-1">
              {{ trackingData?.lowestScore != null ? trackingData.lowestScore : '0.0' }}
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">Cần củng cố thêm</div>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex items-center space-x-2 border-b border-slate-200 pb-2">
          <button
            @click="activeTab = 'students'"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-xl transition',
              activeTab === 'students' 
                ? 'bg-ocean-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            👥 Danh Sách Học Sinh ({{ trackingData?.students?.length || 0 }})
          </button>
          <button
            @click="activeTab = 'questions'"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-xl transition',
              activeTab === 'questions' 
                ? 'bg-ocean-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            📊 Ma Trận Câu Hỏi & Bẫy Sai Lầm ({{ trackingData?.questionStats?.length || 0 }})
          </button>
        </div>

        <!-- TAB 1: Danh sách học sinh -->
        <div v-if="activeTab === 'students'" class="space-y-3">
          <div v-if="!trackingData?.students || trackingData.students.length === 0" class="py-10 text-center text-xs text-slate-400">
            Chưa có học sinh nào trong lớp.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4 font-bold">Học sinh</th>
                  <th class="py-3 px-4 font-bold">Số điện thoại</th>
                  <th class="py-3 px-4 font-bold">Trạng thái</th>
                  <th class="py-3 px-4 font-bold text-center">Điểm số</th>
                  <th class="py-3 px-4 font-bold">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="st in trackingData.students" :key="st.studentId" class="hover:bg-slate-50/80 transition">
                  <td class="py-3 px-4">
                    <div class="flex items-center space-x-2.5">
                      <div class="w-7 h-7 rounded-full bg-ocean-50 text-ocean-700 font-bold text-xs flex items-center justify-center">
                        {{ st.studentName?.charAt(0) || 'H' }}
                      </div>
                      <span class="font-bold text-slate-800">{{ st.studentName }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-slate-500 font-mono text-[11px]">{{ st.studentPhone || '---' }}</td>
                  <td class="py-3 px-4">
                    <span 
                      :class="[
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        st.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800' :
                        st.status === 'SUBMITTED' ? 'bg-sky-100 text-sky-800' :
                        'bg-slate-100 text-slate-500'
                      ]"
                    >
                      {{ st.status === 'GRADED' ? 'Đã chấm điểm' : st.status === 'SUBMITTED' ? 'Đã nộp bài' : 'Chưa nộp bài' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span v-if="st.score != null" class="font-extrabold text-sm text-ocean-700">
                      {{ st.score }} / 10
                    </span>
                    <span v-else class="text-slate-300 font-bold">--</span>
                  </td>
                  <td class="py-3 px-4 text-slate-400 text-[11px]">
                    {{ st.submittedAt ? new Date(st.submittedAt).toLocaleString('vi-VN') : '---' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 2: Ma trận phân tích câu hỏi -->
        <div v-else class="space-y-3.5">
          <div v-if="!trackingData?.questionStats || trackingData.questionStats.length === 0" class="py-10 text-center text-xs text-slate-400">
            Chưa có câu hỏi nào được ghi nhận.
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="qs in trackingData.questionStats" 
              :key="qs.exerciseId"
              class="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs">
                    Câu {{ qs.questionIndex }}
                  </span>
                  <span class="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Đáp án đúng: {{ qs.correctAnswer }}
                  </span>
                </div>

                <!-- Accuracy Badge -->
                <div class="flex items-center space-x-2">
                  <span 
                    :class="[
                      'px-2.5 py-1 rounded-full text-xs font-bold',
                      qs.accuracyPercent >= 80 ? 'bg-emerald-100 text-emerald-800' :
                      qs.accuracyPercent >= 50 ? 'bg-ocean-100 text-ocean-800' :
                      'bg-rose-100 text-rose-800 flex items-center space-x-1'
                    ]"
                  >
                    <AlertTriangle v-if="qs.accuracyPercent < 50" class="w-3.5 h-3.5 inline mr-1 text-rose-600" />
                    <span>Tỷ lệ làm đúng: {{ qs.accuracyPercent }}%</span>
                  </span>
                </div>
              </div>

              <!-- Question Content -->
              <div class="text-xs text-slate-700 font-medium">
                <MathRenderer :content="qs.contentMd" />
              </div>

              <!-- Progress bar -->
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all duration-500',
                    qs.accuracyPercent >= 80 ? 'bg-emerald-500' :
                    qs.accuracyPercent >= 50 ? 'bg-ocean-600' :
                    'bg-rose-500'
                  ]"
                  :style="{ width: `${qs.accuracyPercent}%` }"
                ></div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-400">
                <span>Số học sinh làm đúng: {{ qs.correctCount }} / {{ qs.totalAttempts }} lượt làm</span>
                <span v-if="qs.accuracyPercent < 50" class="text-rose-600 font-semibold">
                  ⚠️ Bẫy sai lầm cao! Thầy cô nên sửa bài này trên lớp.
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-slate-100 flex justify-end flex-shrink-0 bg-slate-50/50 rounded-b-3xl">
        <button
          @click="$emit('close')"
          class="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition"
        >
          Đóng
        </button>
      </div>

    </div>
  </div>
</template>
