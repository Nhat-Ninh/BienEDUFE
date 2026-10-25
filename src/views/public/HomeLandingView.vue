<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import MathRenderer from '@/components/MathRenderer.vue'
import { 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  BrainCircuit, 
  Share2, 
  Award, 
  Clock, 
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Layers,
  GraduationCap
} from 'lucide-vue-next'

const router = useRouter()

// Interactive Math Specimen state
const selectedGradeTab = ref(12)
const interactiveAnswer = ref(null)
const isAnswerChecked = ref(false)

const specimenQuestions = {
  6: {
    title: 'Toán Lớp 6 • Thứ Tự Phép Tính & Số Nguyên',
    content: `Tính giá trị của biểu thức $A = 2^3 \\cdot 5 - 3^2 + 10$:`,
    choices: [
      { key: 'A', text: '$41$' },
      { key: 'B', text: '$31$' },
      { key: 'C', text: '$39$' },
      { key: 'D', text: '$21$' }
    ],
    correct: 'A',
    solution: `Áp dụng quy tắc ưu tiên thực hiện phép tính:
1. Lũy thừa: $2^3 = 8$ và $3^2 = 9$.
2. Phép nhân: $8 \\cdot 5 = 40$.
3. Phép cộng và trừ theo thứ tự từ trái qua phải:
$$A = 40 - 9 + 10 = 31 + 10 = 41.$$
Vậy đáp án đúng là **A**.`
  },
  9: {
    title: 'Toán Lớp 9 • Rút Gọn Căn Thức Bậc Hai (Ôn Thi Vào 10)',
    content: `Rút gọn biểu thức $P = \\sqrt{(3 - \\sqrt{10})^2} + \\sqrt{10}$ ta được kết quả:`,
    choices: [
      { key: 'A', text: '$3$' },
      { key: 'B', text: '$2\\sqrt{10} - 3$' },
      { key: 'C', text: '$3 - 2\\sqrt{10}$' },
      { key: 'D', text: '$-3$' }
    ],
    correct: 'B',
    solution: `Áp dụng hằng đẳng thức $\\sqrt{A^2} = |A|$:
$$P = |3 - \\sqrt{10}| + \\sqrt{10}$$
Vì $3 = \\sqrt{9} < \\sqrt{10}$ nên $3 - \\sqrt{10} < 0$. Do đó $|3 - \\sqrt{10}| = \\sqrt{10} - 3$.
$$P = (\\sqrt{10} - 3) + \\sqrt{10} = 2\\sqrt{10} - 3.$$
Vậy đáp án đúng là **B**.`
  },
  10: {
    title: 'Toán Lớp 10 • Dấu Tam Thức Bậc Hai (Chương Trình Mới)',
    content: `Tập nghiệm của bất phương trình $x^2 - 4x + 3 < 0$ là:`,
    choices: [
      { key: 'A', text: '$(1; 3)$' },
      { key: 'B', text: '$(-\\infty; 1) \\cup (3; +\\infty)$' },
      { key: 'C', text: '$[1; 3]$' },
      { key: 'D', text: '$(-\\infty; -3) \\cup (-1; +\\infty)$' }
    ],
    correct: 'A',
    solution: `Tam thức bậc hai $f(x) = x^2 - 4x + 3$ có hệ số $a = 1 > 0$.
Nghiệm của $f(x) = 0$ là $x = 1$ hoặc $x = 3$.
Áp dụng quy tắc "Trong trái, ngoài cùng":
$f(x) < 0$ khi và chỉ khi $x$ nằm trong khoảng hai nghiệm: $1 < x < 3$.
Vậy tập nghiệm là $S = (1; 3)$. Đáp án đúng là **A**.`
  },
  12: {
    title: 'Toán Lớp 12 • Cực Trị Chứa Tham Số m (Luyện Thi THPTQG)',
    content: `Tìm tất cả các giá trị thực của tham số $m$ để hàm số $y = \\frac{1}{3}x^3 - mx^2 + (m^2 - m + 1)x + 1$ đạt cực đại tại điểm $x = 1$.`,
    choices: [
      { key: 'A', text: '$m = 1$' },
      { key: 'B', text: '$m = 2$' },
      { key: 'C', text: '$m = 3$' },
      { key: 'D', text: '$m = -1$' }
    ],
    correct: 'B',
    solution: `Ta có $y' = x^2 - 2mx + (m^2 - m + 1)$ và $y'' = 2x - 2m$.
Hàm số đạt cực đại tại $x = 1$ khi:
$$\\begin{cases} y'(1) = 0 \\\\ y''(1) < 0 \\end{cases} \\Leftrightarrow \\begin{cases} 1 - 2m + m^2 - m + 1 = 0 \\\\ 2 - 2m < 0 \\end{cases} \\Leftrightarrow \\begin{cases} m^2 - 3m + 2 = 0 \\\\ m > 1 \\end{cases}$$
Phương trình $m^2 - 3m + 2 = 0$ có nghiệm $m = 1$ hoặc $m = 2$.
Kết hợp điều kiện $m > 1$, ta nhận **$m = 2$**.`
  }
}

const currentSample = computed(() => {
  return specimenQuestions[selectedGradeTab.value] || specimenQuestions[12]
})

const changeSpecimenGrade = (grade) => {
  selectedGradeTab.value = grade
  interactiveAnswer.value = null
  isAnswerChecked.value = false
}

const checkAnswer = (key) => {
  if (isAnswerChecked.value) return
  interactiveAnswer.value = key
  isAnswerChecked.value = true
}

const resetSample = () => {
  interactiveAnswer.value = null
  isAnswerChecked.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[#fafcff] text-slate-800 flex flex-col selection:bg-ocean-100 selection:text-ocean-900">
    <!-- Navigation Bar -->
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <router-link to="/" class="flex items-center space-x-3 group">
          <img src="/logo.png" alt="BienEDU Logo" class="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
          <div class="hidden sm:block">
            <span class="text-xs uppercase tracking-widest font-semibold text-ocean-600 block">Nền tảng Toán 12</span>
            <span class="text-sm font-bold text-slate-800 tracking-tight">Học Có Lộ Trình</span>
          </div>
        </router-link>

        <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#roadmap" class="hover:text-ocean-600 transition-colors">Lộ trình học</a>
          <a href="#system" class="hover:text-ocean-600 transition-colors">Phương pháp</a>
          <a href="#topics" class="hover:text-ocean-600 transition-colors">Chuyên đề Toán</a>
          <router-link to="/pricing" class="hover:text-ocean-600 transition-colors">Bảng giá</router-link>
        </nav>

        <div class="flex items-center space-x-3">
          <router-link 
            to="/auth/login" 
            class="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-ocean-600 hover:bg-slate-50 rounded-xl transition"
          >
            Đăng nhập
          </router-link>
          <router-link 
            to="/auth/register" 
            class="px-5 py-2.5 text-sm font-semibold text-white bg-ocean-600 hover:bg-ocean-700 rounded-xl shadow-md shadow-ocean-500/20 hover:shadow-ocean-500/30 transition-all transform hover:-translate-y-0.5"
          >
            Vào Học Ngay
          </router-link>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <!-- Hero Section -->
      <section class="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <!-- Background subtle decorative wave glow -->
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-ocean-300/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-1/2 -left-40 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <!-- Left Copy -->
            <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-ocean-50 border border-ocean-200/70 text-ocean-700 text-xs font-semibold tracking-wide">
                <Sparkles class="w-3.5 h-3.5 text-ocean-600" />
                <span>Toán THCS & THPT Chuẩn K12 • Lớp 6 đến Lớp 12</span>
              </div>

              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Dạy & Học Toán <br class="hidden sm:inline" />
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-ocean-600 via-sky-600 to-indigo-700">
                  Lớp 6 Đến Lớp 12
                </span>
              </h1>

              <p class="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Học chuẩn kiến thức SGK mới (KNTT, Cánh Diều, Chân Trời), ôn thi bứt phá vào 10 và Tốt nghiệp THPT với <strong class="text-slate-800 font-semibold">Sổ tay lỗi sai Spaced Repetition</strong> độc quyền.
              </p>

              <div class="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <router-link 
                  to="/auth/register"
                  class="w-full sm:w-auto px-7 py-3.5 bg-ocean-600 hover:bg-ocean-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-ocean-500/25 hover:shadow-ocean-500/40 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Bắt đầu học thử miễn phí</span>
                  <ArrowRight class="w-4 h-4" />
                </router-link>

                <a 
                  href="#roadmap"
                  class="w-full sm:w-auto px-6 py-3.5 text-slate-700 hover:text-slate-900 font-semibold text-base bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition shadow-sm text-center"
                >
                  Khám phá lộ trình 3 bước
                </a>
              </div>

              <!-- Social proof metrics -->
              <div class="pt-6 grid grid-cols-3 gap-6 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div class="text-2xl font-bold text-slate-900">100%</div>
                  <div class="text-xs text-slate-500 font-medium mt-0.5">Công thức KaTeX chuẩn</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-slate-900">0 - 1 - 3 - 7</div>
                  <div class="text-xs text-slate-500 font-medium mt-0.5">Chu kỳ ôn ngắt quãng</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-slate-900">Minh bạch</div>
                  <div class="text-xs text-slate-500 font-medium mt-0.5">Báo cáo Zalo cho phụ huynh</div>
                </div>
              </div>
            </div>

            <!-- Right Interactive Specimen / Live Test -->
            <div class="lg:col-span-5">
              <div class="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-7 relative">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full bg-rose-400"></span>
                    <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
                    <span class="text-xs font-semibold text-slate-500 pl-2">Giải Thử Trực Tiếp (Live KaTeX)</span>
                  </div>
                  <button 
                    v-if="isAnswerChecked" 
                    @click="resetSample"
                    class="text-xs font-semibold text-ocean-600 hover:underline"
                  >
                    Làm lại
                  </button>
                </div>

                <!-- Specimen Grade Switcher -->
                <div class="pt-3 pb-1 flex items-center space-x-1.5 overflow-x-auto">
                  <button
                    v-for="g in [6, 9, 10, 12]"
                    :key="g"
                    @click="changeSpecimenGrade(g)"
                    :class="[
                      'px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer',
                      selectedGradeTab === g 
                        ? 'bg-ocean-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    ]"
                  >
                    {{ g === 9 ? 'Lớp 9 (Vào 10)' : g === 12 ? 'Lớp 12 (THPTQG)' : `Lớp ${g}` }}
                  </button>
                </div>

                <div class="pt-3 space-y-4">
                  <div class="inline-block px-2.5 py-1 rounded-md bg-ocean-50 text-ocean-700 text-xs font-bold uppercase tracking-wide">
                    {{ currentSample.title }}
                  </div>

                  <div class="text-sm font-medium text-slate-800 leading-relaxed">
                    <MathRenderer :content="currentSample.content" />
                  </div>

                  <!-- Choices -->
                  <div class="space-y-2 pt-1">
                    <button
                      v-for="c in currentSample.choices"
                      :key="c.key"
                      @click="checkAnswer(c.key)"
                      :disabled="isAnswerChecked"
                      :class="[
                        'w-full text-left p-3 rounded-xl border text-sm font-medium transition flex items-center space-x-3 cursor-pointer',
                        interactiveAnswer === c.key 
                          ? 'border-ocean-500 bg-ocean-50/70 text-ocean-900 ring-2 ring-ocean-200' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700',
                        isAnswerChecked && c.key === currentSample.correct
                          ? '!border-emerald-500 !bg-emerald-50 !text-emerald-900 !ring-emerald-200'
                          : '',
                        isAnswerChecked && interactiveAnswer === c.key && c.key !== currentSample.correct
                          ? '!border-rose-500 !bg-rose-50 !text-rose-900'
                          : ''
                      ]"
                    >
                      <span 
                        :class="[
                          'w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0',
                          interactiveAnswer === c.key ? 'bg-ocean-600 text-white' : 'bg-slate-100 text-slate-600'
                        ]"
                      >
                        {{ c.key }}
                      </span>
                      <div class="flex-1">
                        <MathRenderer :content="c.text" />
                      </div>
                    </button>
                  </div>

                  <!-- Live Feedback Box -->
                  <div 
                    v-if="isAnswerChecked"
                    :class="[
                      'p-4 rounded-xl border text-xs leading-relaxed transition-all animation-slide-up',
                      interactiveAnswer === currentSample.correct 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    ]"
                  >
                    <div class="font-bold flex items-center space-x-1.5 mb-1.5">
                      <CheckCircle2 v-if="interactiveAnswer === currentSample.correct" class="w-4 h-4 text-emerald-600" />
                      <HelpCircle v-else class="w-4 h-4 text-amber-600" />
                      <span>
                        {{ interactiveAnswer === currentSample.correct ? 'Rất chính xác!' : 'Chưa đúng, hãy xem phân tích sau:' }}
                      </span>
                    </div>
                    <div class="border-t border-slate-200/60 pt-2 text-slate-800">
                      <MathRenderer :content="currentSample.solution" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- Roadmap Section (3 Bước Học Cốt Lõi) -->
      <section id="roadmap" class="py-20 bg-white border-y border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs uppercase font-bold text-ocean-600 tracking-widest block mb-2">Phương pháp học tập</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              3 Bước học rõ ràng — Không lan man, dứt điểm từng phần
            </h2>
            <p class="text-slate-600 mt-3 text-base">
              Học sinh thường mất điểm không phải vì bài quá khó, mà vì chưa nắm chắc cấu trúc bài toán và lặp lại lỗi sai cũ.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Step 1 -->
            <div class="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-ocean-300 hover:shadow-lg transition-all group">
              <div class="w-12 h-12 rounded-2xl bg-ocean-600 text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-md shadow-ocean-500/20 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2">Hiểu bản chất lý thuyết</h3>
              <p class="text-slate-600 text-sm leading-relaxed mb-4">
                Tóm tắt trọng tâm lý thuyết từng chuyên đề dưới dạng Markdown & sơ đồ. Không học vẹt công thức, nắm vững điều kiện áp dụng và bản chất hình học/đại số.
              </p>
              <div class="text-xs font-semibold text-ocean-600 flex items-center space-x-1">
                <span>Ví dụ mẫu từng bước</span>
                <ChevronRight class="w-3.5 h-3.5" />
              </div>
            </div>

            <!-- Step 2 -->
            <div class="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-ocean-300 hover:shadow-lg transition-all group">
              <div class="w-12 h-12 rounded-2xl bg-sky-500 text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2">Luyện tập nhận diện bẫy</h3>
              <p class="text-slate-600 text-sm leading-relaxed mb-4">
                Hệ thống ngân hàng câu hỏi phân cấp từ Nhận biết, Thông hiểu đến Vận dụng cao. Đặc biệt gắn cờ cảnh báo các lỗi sai kinh điển học sinh hay mắc phải.
              </p>
              <div class="text-xs font-semibold text-sky-600 flex items-center space-x-1">
                <span>Phân loại dạng bài thông minh</span>
                <ChevronRight class="w-3.5 h-3.5" />
              </div>
            </div>

            <!-- Step 3 -->
            <div class="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-ocean-300 hover:shadow-lg transition-all group">
              <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2">Sổ tay lỗi sai & Luyện đề</h3>
              <p class="text-slate-600 text-sm leading-relaxed mb-4">
                Mọi câu hỏi làm sai tự động đưa vào <em>Sổ tay lỗi sai</em>. Thuật toán Spaced Repetition sẽ nhắc học sinh làm lại vào ngày thứ 1, 3, 7 cho đến khi thành thạo 100%.
              </p>
              <div class="text-xs font-semibold text-indigo-600 flex items-center space-x-1">
                <span>Ôn tập ngắt quãng khoa học</span>
                <ChevronRight class="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Topics Covered -->
      <section id="topics" class="py-20 bg-[#fafcff]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span class="text-xs uppercase font-bold text-ocean-600 tracking-widest block mb-2">Chương trình chuẩn</span>
              <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Trọng tâm Toán 12 & Luyện thi THPTQG</h2>
            </div>
            <router-link to="/auth/register" class="mt-4 md:mt-0 text-sm font-semibold text-ocean-600 hover:text-ocean-700 flex items-center space-x-1">
              <span>Xem ngân hàng bài tập</span>
              <ArrowRight class="w-4 h-4" />
            </router-link>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-md">Chuyên đề 1</span>
                <span class="text-xs text-slate-400">12 bài giảng • 350 bài tập</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base mb-1">Ứng dụng Đạo hàm & Khảo sát Hàm số</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất, tiệm cận, bảng biến thiên và bài toán tương giao đồ thị chứa tham số $m$.
              </p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-md">Chuyên đề 2</span>
                <span class="text-xs text-slate-400">10 bài giảng • 280 bài tập</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base mb-1">Hàm số Lũy thừa, Mũ & Logarit</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Biến đổi công thức mũ - logarit, phương trình - bất phương trình và bài toán tối ưu thực tế, lãi suất ngân hàng.
              </p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-md">Chuyên đề 3</span>
                <span class="text-xs text-slate-400">14 bài giảng • 420 bài tập</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base mb-1">Nguyên hàm, Tích phân & Ứng dụng</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Phương pháp đổi biến, từng phần, tính diện tích hình phẳng, thể tích khối tròn xoay và bài toán chuyển động vật lý.
              </p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-md">Chuyên đề 4</span>
                <span class="text-xs text-slate-400">12 bài giảng • 360 bài tập</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base mb-1">Hình học Không gian Oxyz</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Hệ tọa độ Oxyz, phương trình mặt phẳng, đường thẳng, mặt cầu, góc và khoảng cách, bài toán cực trị hình học không gian.
              </p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-md">Chuyên đề 5</span>
                <span class="text-xs text-slate-400">8 bài giảng • 200 bài tập</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base mb-1">Xác suất & Thống kê Mô tả</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Quy tắc cộng - nhân, tổ hợp, chỉnh hợp, xác suất có điều kiện, công thức xác suất toàn phần và các bài toán mẫu thực tiễn.
              </p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">Luyện đề</span>
                <span class="text-xs text-slate-400">40 đề chuẩn cấu trúc</span>
              </div>
              <h4 class="font-bold text-slate-900 text-base mb-1">Luyện Đề Bấm Giờ Thi Thật</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Đề thi 50 câu 90 phút bấm giờ tự động, chấm điểm tức thì, thống kê phân tích ma trận điểm mạnh điểm yếu.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing & Commercial Packages -->
      <section id="pricing" class="py-20 bg-white border-t border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs uppercase font-bold text-ocean-600 tracking-widest block mb-2">Học phí & Khóa học</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Đầu tư thông minh cho kỳ thi quan trọng nhất
            </h2>
            <p class="text-slate-600 mt-3 text-base">
              Lựa chọn gói học phù hợp với mục tiêu điểm số của bạn. Cam kết tiến bộ rõ rệt sau 4 tuần học có lộ trình.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            <!-- Plan 1 -->
            <div class="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
              <div>
                <h3 class="text-lg font-bold text-slate-900">Trải Nghiệm Cơ Bản</h3>
                <p class="text-xs text-slate-500 mt-1">Dành cho học sinh làm quen phương pháp</p>
                <div class="mt-6 mb-6">
                  <span class="text-4xl font-extrabold text-slate-900">0đ</span>
                  <span class="text-xs text-slate-500 font-medium"> / 7 ngày thử nghiệm</span>
                </div>
                <ul class="space-y-3 text-sm text-slate-600">
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-600 flex-shrink-0" />
                    <span>Học thử 3 bài giảng chuyên đề</span>
                  </li>
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-600 flex-shrink-0" />
                    <span>Ngân hàng 50 câu trắc nghiệm KaTeX</span>
                  </li>
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-600 flex-shrink-0" />
                    <span>Trải nghiệm Sổ tay lỗi sai cơ bản</span>
                  </li>
                </ul>
              </div>

              <router-link
                to="/auth/register"
                class="mt-8 block w-full py-3 px-4 text-center font-semibold text-sm rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Đăng Ký Miễn Phí
              </router-link>
            </div>

            <!-- Plan 2 (Featured) -->
            <div class="p-8 rounded-3xl bg-ocean-600 text-white shadow-xl shadow-ocean-500/25 relative flex flex-col justify-between transform md:-translate-y-2">
              <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-ocean-700 font-bold text-xs uppercase px-3 py-1 rounded-full shadow tracking-wider">
                Được Chọn Nhiều Nhất
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">Chuyên Sâu Toán 12</h3>
                <p class="text-xs text-ocean-100 mt-1">Bứt phá mục tiêu 8.0 - 9.0 điểm THPTQG</p>
                <div class="mt-6 mb-6">
                  <span class="text-4xl font-extrabold text-white">650.000đ</span>
                  <span class="text-xs text-ocean-200 font-medium"> / Toàn bộ khóa học</span>
                </div>
                <ul class="space-y-3 text-sm text-ocean-50">
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-200 flex-shrink-0" />
                    <span>Toàn bộ 6 chuyên đề Toán 12 đầy đủ</span>
                  </li>
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-200 flex-shrink-0" />
                    <span>Ngân hàng 2000+ câu hỏi trắc nghiệm có lời giải</span>
                  </li>
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-200 flex-shrink-0" />
                    <span>Sổ tay lỗi sai Spaced Repetition không giới hạn</span>
                  </li>
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-200 flex-shrink-0" />
                    <span>Báo cáo phân tích năng lực & Share link Zalo</span>
                  </li>
                </ul>
              </div>

              <router-link
                to="/auth/register"
                class="mt-8 block w-full py-3 px-4 text-center font-bold text-sm rounded-xl bg-white text-ocean-700 hover:bg-ocean-50 shadow transition cursor-pointer"
              >
                Đăng Ký Khóa Học Ngay
              </router-link>
            </div>

            <!-- Plan 3 -->
            <div class="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
              <div>
                <h3 class="text-lg font-bold text-slate-900">Chiến Binh 9+ (Kèm 1:1)</h3>
                <p class="text-xs text-slate-500 mt-1">Luyện đề vận dụng cao cùng Thầy Biên</p>
                <div class="mt-6 mb-6">
                  <span class="text-4xl font-extrabold text-slate-900">1.250.000đ</span>
                  <span class="text-xs text-slate-500 font-medium"> / Kỳ luyện thi</span>
                </div>
                <ul class="space-y-3 text-sm text-slate-600">
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-600 flex-shrink-0" />
                    <span>Bao gồm toàn bộ quyền lợi gói Chuyên Sâu</span>
                  </li>
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-600 flex-shrink-0" />
                    <span>Chấm & Nhận xét bài thi tự luận 1:1 bởi Thầy Biên</span>
                  </li>
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-600 flex-shrink-0" />
                    <span>Nhóm giải đáp thắc mắc chuyên biệt 24/7</span>
                  </li>
                  <li class="flex items-center space-x-2.5">
                    <CheckCircle2 class="w-4 h-4 text-ocean-600 flex-shrink-0" />
                    <span>40 Đề thực chiến dự đoán bám sát ma trận Bộ GD</span>
                  </li>
                </ul>
              </div>

              <router-link
                to="/auth/register"
                class="mt-8 block w-full py-3 px-4 text-center font-semibold text-sm rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Tư Vấn Gói 9+
              </router-link>
            </div>

          </div>
        </div>
      </section>

      <!-- CTA Footer Banner -->
      <section class="py-16 bg-gradient-to-r from-ocean-700 via-ocean-600 to-indigo-700 text-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Sẵn sàng bắt đầu hành trình bứt phá điểm Toán 12?
          </h2>
          <p class="text-ocean-100 max-w-xl mx-auto text-base">
            Gia nhập cùng hàng trăm học sinh đang theo học lộ trình BienEDU để việc học Toán trở nên nhẹ nhàng, chắc chắn và hiệu quả.
          </p>
          <div class="pt-2 flex justify-center space-x-4">
            <router-link
              to="/auth/register"
              class="px-8 py-3.5 bg-white text-ocean-700 hover:bg-ocean-50 font-bold rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
            >
              Tạo Tài Khoản Học Thử Ngay
            </router-link>
          </div>
        </div>
      </section>
    </main>

    <!-- Commercial Footer -->
    <footer class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <img src="/logo.png" alt="BienEDU" class="h-10 w-auto bg-white p-1 rounded-lg" />
            <span class="text-lg font-bold text-white tracking-tight">BienEDU</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Hệ thống đào tạo và quản lý học tập môn Toán trực tuyến theo chuẩn mô hình sư phạm thực nghiệm hiện đại.
          </p>
        </div>

        <div>
          <h5 class="text-white font-semibold text-sm mb-3">Chương Trình Học</h5>
          <ul class="space-y-2 text-xs">
            <li><a href="#topics" class="hover:text-white transition">Hàm số & Đạo hàm</a></li>
            <li><a href="#topics" class="hover:text-white transition">Nguyên hàm & Tích phân</a></li>
            <li><a href="#topics" class="hover:text-white transition">Hình học Oxyz</a></li>
            <li><a href="#topics" class="hover:text-white transition">Đề thi thử THPT Quốc Gia</a></li>
          </ul>
        </div>

        <div>
          <h5 class="text-white font-semibold text-sm mb-3">Tính Năng Độc Quyền</h5>
          <ul class="space-y-2 text-xs">
            <li><span class="text-slate-300">Sổ tay lỗi sai Spaced Repetition</span></li>
            <li><span class="text-slate-300">Công thức KaTeX siêu tốc</span></li>
            <li><span class="text-slate-300">Báo cáo tuần gửi Phụ huynh Zalo</span></li>
            <li><span class="text-slate-300">Chấm điểm tự luận 1:1</span></li>
          </ul>
        </div>

        <div>
          <h5 class="text-white font-semibold text-sm mb-3">Liên Hệ & Hỗ Trợ</h5>
          <p class="text-xs text-slate-400 mb-2">Thầy giáo phụ trách: <strong>Thầy Biên</strong></p>
          <p class="text-xs text-slate-400 mb-2">Email: <code>hotro@bienedu.vn</code></p>
          <p class="text-xs text-slate-400">Website chính thức: <code>bienedu.vn</code></p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 BienEDU. Bản quyền thuộc về Thầy Cô & Đội ngũ Phát triển. Mọi quyền được bảo lưu.
      </div>
    </footer>
  </div>
</template>
