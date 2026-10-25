<script setup>
import { computed } from 'vue'
import katex from 'katex'
import { marked } from 'marked'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

/**
 * Hàm phân tích nội dung hỗn hợp giữa Markdown và công thức Toán học LaTeX.
 * Hỗ trợ cú pháp:
 * - Block math: $$ ... $$
 * - Inline math: $ ... $
 */
const renderedHtml = computed(() => {
  if (!props.content) return ''

  let text = props.content

  // 1. Thay thế Block Math: $$ ... $$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false
      })
    } catch (err) {
      return `<div class="text-rose-500 font-mono text-xs p-1">[Lỗi công thức: ${math}]</div>`
    }
  })

  // 2. Thay thế Inline Math: $ ... $ (tránh khớp với ký tự $ đứng đơn lẻ)
  text = text.replace(/\$([^\$\n\r]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false
      })
    } catch (err) {
      return `<span class="text-rose-500 font-mono text-xs">[Lỗi: ${math}]</span>`
    }
  })

  // 3. Render Markdown còn lại thành HTML
  try {
    return marked.parse(text, { breaks: true, gfm: true })
  } catch (err) {
    return text
  }
})
</script>

<template>
  <div class="prose prose-slate max-w-none math-content" v-html="renderedHtml"></div>
</template>

<style scoped>
:deep(.math-content p) {
  margin-bottom: 0.5rem;
}
:deep(.math-content ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
</style>
