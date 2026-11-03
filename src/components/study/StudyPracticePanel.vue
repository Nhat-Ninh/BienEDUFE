<script setup>
import { computed, ref, watch } from 'vue'
import MathRenderer from '@/components/MathRenderer.vue'
import { parsePracticeMarkdown, checkAnswer } from '@/utils/studyContent'
import { percent } from '@/utils/studyState'
import { CheckCircle2, XCircle, Eye, Trophy, Target, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-vue-next'

const props = defineProps({
  markdown: { type: String, default: '' },
  // { [questionIndex]: { response, correct, revealed } }
  answers: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['answer'])

const PAGE_SIZE = 10
const doc = computed(() => parsePracticeMarkdown(props.markdown))
const questions = computed(() => doc.value.questions)
const page = ref(0)
const draft = ref({}) // đáp số / lựa chọn đang nhập chưa nộp: { [index]: value }
const onlyUnanswered = ref(false)

const isDone = (q) => {
  const a = props.answers[q.index]
  return !!a && (a.revealed || a.response != null)
}
const visible = computed(() => (onlyUnanswered.value ? questions.value.filter(q => !isDone(q)) : questions.value))
const pageCount = computed(() => Math.max(1, Math.ceil(visible.value.length / PAGE_SIZE)))
const pageItems = computed(() => visible.value.slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE))

watch([() => props.markdown, onlyUnanswered], () => { page.value = 0 })
watch(pageCount, (n) => { if (page.value >= n) page.value = n - 1 })

const answered = computed(() => questions.value.filter(isDone).length)
const correct = computed(() => questions.value.filter(q => props.answers[q.index]?.correct === true).length)
const progress = computed(() => percent(answered.value, questions.value.length))
const accuracy = computed(() => percent(correct.value, answered.value))

const submit = (q, response) => {
  emit('answer', q.index, { response, correct: checkAnswer(q, response), revealed: true })
}
const chooseChoice = (q, key) => {
  if (!isDone(q)) submit(q, key)
}
const setTf = (q, i, value) => {
  const cur = Array.isArray(draft.value[q.index]) ? [...draft.value[q.index]] : ['', '', '', '']
  cur[i] = value
  draft.value = { ...draft.value, [q.index]: cur }
}
const submitTf = (q) => {
  const cur = draft.value[q.index]
  if (Array.isArray(cur) && cur.every(Boolean)) submit(q, cur)
}
const submitShort = (q) => {
  const v = String(draft.value[q.index] ?? '').trim()
  if (v) submit(q, v)
}
const reveal = (q) => {
  emit('answer', q.index, { response: props.answers[q.index]?.response ?? null, correct: props.answers[q.index]?.correct ?? null, revealed: true })
}
const selfRate = (q, ok) => {
  emit('answer', q.index, { response: ok ? 'ok' : 'retry', correct: ok, revealed: true })
}

const TYPE_LABEL = { MC: 'Trắc nghiệm', TF: 'Đúng / Sai', SHORT: 'Trả lời ngắn', OPEN: 'Tự luận' }
const choiceClass = (q, c) => {
  const a = props.answers[q.index]
  if (!a) return 'border-slate-200 bg-white hover:border-ocean-400 hover:bg-ocean-50 cursor-pointer'
  if (c.key === q.answer) return 'border-emerald-500 bg-emerald-50'
  if (c.key === a.response) return 'border-rose-400 bg-rose-50'
  return 'border-slate-200 bg-white opacity-60'
}
</script>

<template>
  <div class="space-y-5" data-testid="study-practice">
    <!-- Ghi chú của giáo viên (khi không có câu hỏi nhận dạng được) -->
    <div v-if="doc.notes && questions.length === 0" class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
      <div class="text-[11px] font-extrabold uppercase tracking-wide text-indigo-700 mb-2">Yêu cầu của giáo viên</div>
      <div class="text-[15px] leading-relaxed text-slate-800"><MathRenderer :content="doc.notes" /></div>
    </div>

    <template v-if="questions.length">
      <!-- Tổng quan tiến độ -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-4 shadow-md">
          <div class="flex items-center space-x-2 text-[11px] font-bold text-indigo-100"><Target class="w-4 h-4" /><span>Đã làm</span></div>
          <div class="text-2xl font-extrabold mt-1" data-testid="practice-answered">{{ answered }}<span class="text-sm font-bold text-indigo-200">/{{ questions.length }}</span></div>
          <div class="h-1.5 rounded-full bg-white/20 mt-2 overflow-hidden"><div class="h-full bg-white rounded-full transition-all duration-500" :style="{ width: progress + '%' }"></div></div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
          <div class="flex items-center space-x-2 text-[11px] font-bold text-emerald-700"><Trophy class="w-4 h-4" /><span>Làm đúng</span></div>
          <div class="text-2xl font-extrabold text-slate-900 mt-1" data-testid="practice-correct">{{ correct }}<span class="text-sm font-bold text-slate-400">/{{ answered }}</span></div>
          <div class="text-[11px] text-slate-500 mt-1">Chính xác {{ accuracy }}%</div>
        </div>
        <label class="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm flex items-center justify-between cursor-pointer">
          <span class="text-xs font-bold text-slate-700">Chỉ hiện câu chưa làm</span>
          <input v-model="onlyUnanswered" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-ocean-600" />
        </label>
      </div>

      <p v-if="visible.length === 0" class="text-center text-sm font-bold text-emerald-700 py-10 bg-emerald-50 rounded-3xl border border-emerald-200">
        🎉 Bạn đã làm hết các câu trong bài này!
      </p>

      <article
        v-for="q in pageItems"
        :key="q.index"
        class="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
        :data-testid="`practice-q-${q.index}`"
      >
        <div class="flex items-center justify-between gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
          <div class="flex items-center flex-wrap gap-2 min-w-0">
            <span class="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-extrabold">Câu {{ q.index + 1 }}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">{{ TYPE_LABEL[q.type] }}</span>
            <span v-if="q.group" class="text-[10px] text-slate-400 truncate max-w-[18rem]" :title="q.group">{{ q.group }}</span>
          </div>
          <span v-if="answers[q.index]?.correct === true" class="inline-flex items-center space-x-1 text-[11px] font-extrabold text-emerald-700"><CheckCircle2 class="w-4 h-4" /><span>Đúng</span></span>
          <span v-else-if="answers[q.index]?.correct === false" class="inline-flex items-center space-x-1 text-[11px] font-extrabold text-rose-700"><XCircle class="w-4 h-4" /><span>Chưa đúng</span></span>
        </div>

        <div class="p-5 sm:p-6 space-y-4">
          <div class="text-[15px] leading-relaxed text-slate-900 font-medium"><MathRenderer :content="q.stemMd" /></div>

          <!-- Trắc nghiệm -->
          <div v-if="q.type === 'MC'" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              v-for="c in q.choices"
              :key="c.key"
              type="button"
              :disabled="!!answers[q.index]"
              :data-testid="`choice-${q.index}-${c.key}`"
              :class="['flex items-center space-x-3 p-3 rounded-2xl border-2 text-left transition', choiceClass(q, c)]"
              @click="chooseChoice(q, c.key)"
            >
              <span class="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0">{{ c.key }}</span>
              <span class="text-sm text-slate-800 min-w-0"><MathRenderer :content="c.text" /></span>
            </button>
          </div>

          <!-- Đúng / Sai -->
          <div v-else-if="q.type === 'TF'" class="space-y-2">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div v-for="(label, i) in ['a', 'b', 'c', 'd']" :key="label" class="p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                <span class="text-xs font-extrabold text-slate-700">{{ label }})</span>
                <div class="flex space-x-1">
                  <button
                    v-for="v in ['Đ', 'S']"
                    :key="v"
                    type="button"
                    :disabled="!!answers[q.index]"
                    :class="[
                      'px-2 py-0.5 rounded-md text-[11px] font-bold border',
                      (answers[q.index]?.response ?? draft[q.index])?.[i] === v
                        ? (v === 'Đ' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-600 text-white border-rose-600')
                        : 'bg-white text-slate-600 border-slate-200'
                    ]"
                    @click="setTf(q, i, v)"
                  >{{ v === 'Đ' ? 'Đúng' : 'Sai' }}</button>
                </div>
              </div>
            </div>
            <button
              v-if="!answers[q.index]"
              type="button"
              :disabled="!(Array.isArray(draft[q.index]) && draft[q.index].every(Boolean))"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-40 transition"
              @click="submitTf(q)"
            >Kiểm tra</button>
          </div>

          <!-- Trả lời ngắn -->
          <div v-else-if="q.type === 'SHORT'" class="flex flex-wrap items-center gap-2">
            <input
              :value="answers[q.index]?.response ?? draft[q.index] ?? ''"
              :disabled="!!answers[q.index]"
              type="text"
              placeholder="Nhập đáp số..."
              :data-testid="`short-${q.index}`"
              class="w-full sm:w-64 px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-400 disabled:bg-slate-50"
              @input="draft = { ...draft, [q.index]: $event.target.value }"
              @keyup.enter="submitShort(q)"
            />
            <button
              v-if="!answers[q.index]"
              type="button"
              :data-testid="`check-${q.index}`"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-ocean-600 text-white hover:bg-ocean-700 transition"
              @click="submitShort(q)"
            >Kiểm tra</button>
          </div>

          <!-- Tự luận / không có đáp án máy chấm -->
          <div v-else class="text-[11px] text-slate-500 italic flex items-center space-x-1.5">
            <HelpCircle class="w-3.5 h-3.5" /><span>Hãy tự làm vào vở, sau đó xem lời giải để đối chiếu.</span>
          </div>

          <!-- Lời giải -->
          <div v-if="q.type !== 'OPEN' && !answers[q.index] && (q.solutionMd || q.answer)" class="pt-1">
            <button type="button" class="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-ocean-700" @click="reveal(q)">
              <Eye class="w-3.5 h-3.5" /><span>Bỏ qua, xem đáp án & lời giải</span>
            </button>
          </div>

          <div v-if="q.type === 'OPEN' && !answers[q.index] && (q.solutionMd || q.answer)">
            <button type="button" :data-testid="`reveal-practice-${q.index}`" class="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-ocean-600 text-white hover:bg-ocean-700 shadow-sm transition" @click="reveal(q)">
              <Eye class="w-3.5 h-3.5" /><span>Xem lời giải</span>
            </button>
          </div>

          <div v-if="answers[q.index]?.revealed && (q.solutionMd || q.answer)" class="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2 animate-fade-in" :data-testid="`practice-solution-${q.index}`">
            <div v-if="q.answer" class="text-xs font-extrabold text-emerald-800">Đáp án: <span class="font-mono">{{ q.answer }}</span></div>
            <div v-if="q.solutionMd" class="text-sm leading-relaxed text-slate-800"><MathRenderer :content="q.solutionMd" /></div>
            <div v-if="q.type === 'OPEN' && answers[q.index]?.response == null" class="flex items-center gap-2 pt-1">
              <span class="text-[11px] font-bold text-slate-600">Bạn tự đánh giá:</span>
              <button type="button" class="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white" @click="selfRate(q, true)">Mình làm đúng</button>
              <button type="button" class="px-3 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-300 text-slate-700" @click="selfRate(q, false)">Cần làm lại</button>
            </div>
          </div>
        </div>
      </article>

      <!-- Phân trang -->
      <div v-if="pageCount > 1" class="flex items-center justify-between pt-1">
        <button type="button" :disabled="page === 0" class="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 disabled:opacity-40" @click="page--; $el.scrollIntoView?.({ behavior: 'smooth' })">
          <ChevronLeft class="w-4 h-4" /><span>Trang trước</span>
        </button>
        <span class="text-xs font-bold text-slate-500">Trang {{ page + 1 }}/{{ pageCount }}</span>
        <button type="button" :disabled="page >= pageCount - 1" class="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-ocean-600 text-white disabled:opacity-40" @click="page++; $el.scrollIntoView?.({ behavior: 'smooth' })">
          <span>Trang sau</span><ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </template>
  </div>
</template>
