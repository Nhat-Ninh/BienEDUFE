<script setup>
import { computed, ref, watch } from 'vue'
import MathRenderer from '@/components/MathRenderer.vue'
import { parseStudyMarkdown } from '@/utils/studyContent'
import { percent } from '@/utils/studyState'
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lightbulb,
  Search,
  Sparkles
} from 'lucide-vue-next'

const props = defineProps({
  markdown: { type: String, default: '' },
  doneTopics: { type: Array, default: () => [] },
  startTopicId: { type: String, default: null },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['toggle-done', 'open-topic'])

const doc = computed(() => parseStudyMarkdown(props.markdown))
const activeId = ref(null)
const revealed = ref(new Set())
const search = ref('')
const openChapters = ref(new Set())
const showToc = ref(false)

const topics = computed(() => doc.value.topics)
const activeTopic = computed(() => topics.value.find(t => t.id === activeId.value) || topics.value[0] || null)
const activeIndex = computed(() => topics.value.findIndex(t => t.id === activeTopic.value?.id))
const doneSet = computed(() => new Set(props.doneTopics))
const overall = computed(() => percent(doneSet.value.size, topics.value.length))

watch(
  () => doc.value,
  () => {
    const start = topics.value.find(t => t.id === props.startTopicId) || topics.value[0]
    activeId.value = start?.id ?? null
    if (start) openChapters.value = new Set([start.chapterId])
  },
  { immediate: true }
)

const chapterProgress = (chapter) => {
  const done = chapter.topics.filter(t => doneSet.value.has(t.id)).length
  return { done, total: chapter.topics.length }
}

const filteredChapters = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return doc.value.chapters
  return doc.value.chapters
    .map(c => ({ ...c, topics: c.topics.filter(t => t.title.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) }))
    .filter(c => c.topics.length > 0)
})

const select = (topic) => {
  activeId.value = topic.id
  openChapters.value = new Set([...openChapters.value, topic.chapterId])
  showToc.value = false
  emit('open-topic', topic.id)
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

const go = (delta) => {
  const next = topics.value[activeIndex.value + delta]
  if (next) select(next)
}

const toggleChapter = (id) => {
  const next = new Set(openChapters.value)
  next.has(id) ? next.delete(id) : next.add(id)
  openChapters.value = next
}

const toggleReveal = (key) => {
  const next = new Set(revealed.value)
  next.has(key) ? next.delete(key) : next.add(key)
  revealed.value = next
}

const calloutKind = (md) => {
  if (/^\*\*(Kiến\s*thức|Định\s*(nghĩa|lí|lý)|Tính\s*chất|Công\s*thức)/i.test(md)) return 'knowledge'
  if (/^\*\*(Cách\s*làm|Phương\s*pháp)/i.test(md)) return 'method'
  if (/^\*\*(Lưu\s*ý|Chú\s*ý)/i.test(md)) return 'note'
  return 'plain'
}
/** Thẻ đã có tiêu đề "Kiến thức cần nhớ" / "Cách làm" nên bỏ nhãn in đậm lặp lại ở đầu đoạn */
const bodyOf = (md) => (calloutKind(md) === 'plain' ? md : md.replace(/^\*\*[^*]+\*\*\s*/, ''))
const CALLOUT = {
  knowledge: 'border-sky-300 bg-sky-50/70',
  method: 'border-amber-300 bg-amber-50/70',
  note: 'border-rose-300 bg-rose-50/70',
  plain: 'border-slate-200 bg-white'
}
const CALLOUT_LABEL = { knowledge: 'Kiến thức cần nhớ', method: 'Cách làm', note: 'Lưu ý', plain: '' }
</script>

<template>
  <div v-if="doc.hasContent" class="grid grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)] gap-5 items-start" data-testid="study-theory">
    <!-- Mục lục -->
    <aside class="lg:sticky lg:top-20 space-y-3">
      <button
        type="button"
        class="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
        @click="showToc = !showToc"
      >
        <span class="flex items-center space-x-2"><BookOpen class="w-4 h-4 text-ocean-600" /><span>{{ activeTopic?.title }}</span></span>
        <ChevronDown :class="['w-4 h-4 transition', showToc ? 'rotate-180' : '']" />
      </button>

      <div :class="[showToc ? 'block' : 'hidden', 'lg:block bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden']">
        <div class="p-4 space-y-3 border-b border-slate-100 bg-gradient-to-br from-ocean-50 to-sky-50">
          <div class="flex items-center justify-between text-[11px] font-bold text-ocean-900">
            <span>Mục lục bài học</span>
            <span data-testid="theory-progress-text">{{ doneSet.size }}/{{ topics.length }} mục · {{ overall }}%</span>
          </div>
          <div class="h-2 rounded-full bg-white/80 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-ocean-500 to-emerald-500 transition-all duration-500" :style="{ width: overall + '%' }"></div>
          </div>
          <div v-if="topics.length > 6" class="relative">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="search"
              type="text"
              placeholder="Tìm mục học..."
              class="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-ocean-400"
            />
          </div>
        </div>

        <nav class="max-h-[60vh] overflow-y-auto p-2 space-y-1" aria-label="Mục lục">
          <div v-for="chapter in filteredChapters" :key="chapter.id">
            <button
              v-if="doc.chapters.length > 1 || chapter.title !== 'Nội dung'"
              type="button"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 transition"
              @click="toggleChapter(chapter.id)"
            >
              <span class="text-[11px] font-extrabold text-slate-800 leading-snug pr-2">{{ chapter.title }}</span>
              <span class="flex items-center space-x-1.5 flex-shrink-0">
                <span class="text-[10px] font-bold text-slate-400">{{ chapterProgress(chapter).done }}/{{ chapterProgress(chapter).total }}</span>
                <ChevronDown :class="['w-3.5 h-3.5 text-slate-400 transition', openChapters.has(chapter.id) || search ? 'rotate-180' : '']" />
              </span>
            </button>
            <ul v-show="openChapters.has(chapter.id) || search || doc.chapters.length === 1" class="space-y-0.5 pl-1">
              <li v-for="topic in chapter.topics" :key="topic.id">
                <button
                  type="button"
                  :data-testid="`toc-${topic.id}`"
                  :class="[
                    'w-full flex items-start space-x-2 px-3 py-2 rounded-xl text-left text-xs transition',
                    activeTopic?.id === topic.id ? 'bg-ocean-600 text-white shadow-sm' : 'text-slate-600 hover:bg-ocean-50'
                  ]"
                  @click="select(topic)"
                >
                  <CheckCircle2 v-if="doneSet.has(topic.id)" :class="['w-4 h-4 flex-shrink-0 mt-px', activeTopic?.id === topic.id ? 'text-emerald-200' : 'text-emerald-500']" />
                  <Circle v-else :class="['w-4 h-4 flex-shrink-0 mt-px', activeTopic?.id === topic.id ? 'text-white/70' : 'text-slate-300']" />
                  <span class="leading-snug font-semibold">{{ topic.title }}</span>
                </button>
              </li>
            </ul>
          </div>
          <p v-if="filteredChapters.length === 0" class="px-3 py-6 text-center text-[11px] text-slate-400">Không có mục nào khớp "{{ search }}".</p>
        </nav>
      </div>
    </aside>

    <!-- Nội dung mục đang học -->
    <section v-if="activeTopic" class="space-y-4 min-w-0" :aria-label="activeTopic.title">
      <header class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-700 via-indigo-700 to-violet-700 p-6 sm:p-7 text-white shadow-lg">
        <div class="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10"></div>
        <div class="absolute right-16 bottom-[-3rem] w-32 h-32 rounded-full bg-white/5"></div>
        <div class="relative space-y-2">
          <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold backdrop-blur-sm">
            <Sparkles class="w-3.5 h-3.5 text-amber-300" />
            <span>{{ activeTopic.chapterTitle }}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-extrabold leading-snug" data-testid="topic-title">{{ activeTopic.title }}</h2>
          <p class="text-xs text-ocean-100">
            Mục {{ activeIndex + 1 }}/{{ topics.length }}
            <template v-if="activeTopic.exampleCount"> · {{ activeTopic.exampleCount }} ví dụ có lời giải</template>
          </p>
        </div>
      </header>

      <template v-for="(block, bi) in activeTopic.blocks" :key="`${activeTopic.id}-${bi}`">
        <!-- Lý thuyết / mẹo -->
        <article
          v-if="block.type === 'text'"
          :class="['rounded-3xl border-l-4 border p-5 sm:p-6 shadow-sm', CALLOUT[calloutKind(block.md)]]"
        >
          <div v-if="calloutKind(block.md) !== 'plain'" class="flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wide mb-2"
               :class="calloutKind(block.md) === 'knowledge' ? 'text-sky-700' : calloutKind(block.md) === 'method' ? 'text-amber-700' : 'text-rose-700'">
            <Lightbulb class="w-3.5 h-3.5" />
            <span>{{ CALLOUT_LABEL[calloutKind(block.md)] }}</span>
          </div>
          <div class="text-[15px] leading-relaxed text-slate-800"><MathRenderer :content="bodyOf(block.md)" /></div>
        </article>

        <!-- Ví dụ có lời giải -->
        <article v-else class="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden" :data-testid="`example-${bi}`">
          <div class="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
            <span class="inline-flex items-center space-x-2">
              <span class="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold">{{ block.title }}</span>
            </span>
            <button
              v-if="block.solutionMd || block.answer"
              type="button"
              :data-testid="`reveal-${bi}`"
              class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition"
              :class="revealed.has(`${activeTopic.id}-${bi}`) ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-ocean-600 text-white hover:bg-ocean-700 shadow-sm'"
              @click="toggleReveal(`${activeTopic.id}-${bi}`)"
            >
              <component :is="revealed.has(`${activeTopic.id}-${bi}`) ? EyeOff : Eye" class="w-3.5 h-3.5" />
              <span>{{ revealed.has(`${activeTopic.id}-${bi}`) ? 'Ẩn lời giải' : 'Xem lời giải' }}</span>
            </button>
          </div>
          <div class="p-5 sm:p-6 space-y-3">
            <div class="text-[15px] leading-relaxed text-slate-900 font-medium"><MathRenderer :content="block.bodyMd" /></div>
            <div
              v-if="revealed.has(`${activeTopic.id}-${bi}`)"
              class="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-1.5 animate-fade-in"
              :data-testid="`solution-${bi}`"
            >
              <div v-if="block.answer" class="text-xs font-extrabold text-emerald-800">Đáp án: <span class="font-mono">{{ block.answer }}</span></div>
              <div v-if="block.solutionMd" class="text-sm leading-relaxed text-slate-800"><MathRenderer :content="block.solutionMd" /></div>
            </div>
          </div>
        </article>
      </template>

      <!-- Hoàn thành mục + điều hướng -->
      <footer class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          :disabled="activeIndex <= 0"
          class="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
          data-testid="prev-topic"
          @click="go(-1)"
        >
          <ChevronLeft class="w-4 h-4" /><span>Mục trước</span>
        </button>

        <button
          v-if="!readonly"
          type="button"
          data-testid="mark-done"
          :class="[
            'inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl text-sm font-extrabold shadow-md transition',
            doneSet.has(activeTopic.id) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
          ]"
          @click="emit('toggle-done', activeTopic.id)"
        >
          <CheckCircle2 class="w-5 h-5" />
          <span>{{ doneSet.has(activeTopic.id) ? 'Đã hiểu mục này (bấm để bỏ)' : 'Đã hiểu mục này' }}</span>
        </button>

        <button
          type="button"
          :disabled="activeIndex >= topics.length - 1"
          class="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-40 transition shadow-sm"
          data-testid="next-topic"
          @click="go(1)"
        >
          <span>Mục tiếp theo</span><ChevronRight class="w-4 h-4" />
        </button>
      </footer>
    </section>
  </div>
</template>
