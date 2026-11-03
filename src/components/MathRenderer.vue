<script setup>
import { computed } from 'vue'
import katex from 'katex'
import { Marked } from 'marked'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i

// Nội dung do giáo viên / bóc tách từ file nhập vào rồi hiển thị cho học sinh: không cho HTML thô lọt qua
// (<script>, <img onerror=...>) và chỉ cho liên kết an toàn.
const markdown = new Marked({ gfm: true, breaks: true })
markdown.use({
  renderer: {
    html({ text, raw }) {
      return escapeHtml(text ?? raw ?? '')
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens)
      if (!href || !SAFE_HREF.test(href.trim())) return inner
      const t = title ? ` title="${escapeHtml(title)}"` : ''
      return `<a href="${escapeHtml(href.trim())}"${t} target="_blank" rel="noopener noreferrer">${inner}</a>`
    },
    image({ text }) {
      return escapeHtml(text || '[hình]')
    }
  }
})

const renderMath = (math, displayMode) => {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      maxExpand: 1000
    })
  } catch (err) {
    const tag = displayMode ? 'div' : 'span'
    return `<${tag} class="text-rose-500 font-mono text-xs">[Lỗi công thức: ${escapeHtml(math)}]</${tag}>`
  }
}

// Ký tự vùng riêng của Unicode: không bao giờ xuất hiện trong đề và không bị Markdown biến đổi
const OPEN = ''
const CLOSE = ''

/**
 * Hiển thị nội dung hỗn hợp Markdown + công thức LaTeX:
 * - Block math: $$ ... $$
 * - Inline math: $ ... $  (viết \$ để có ký tự đô la thật)
 * Công thức được render bằng KaTeX và tạm cất ra ngoài trước khi chạy Markdown,
 * nên ký tự * _ trong công thức không bị Markdown hiểu nhầm là in đậm / in nghiêng.
 */
const renderedHtml = computed(() => {
  if (!props.content) return ''

  const stash = []
  const put = (html) => {
    stash.push(html)
    return `${OPEN}${stash.length - 1}${CLOSE}`
  }

  let text = String(props.content).replace(/[]/g, '')

  text = text.replace(/\\\$/g, () => put('$'))
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => put(renderMath(math, true)))
  text = text.replace(/\$([^$\n\r]+?)\$/g, (_, math) => put(renderMath(math, false)))

  let html
  try {
    html = markdown.parse(text)
  } catch (err) {
    html = escapeHtml(text)
  }
  return html.replace(new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g'), (_, i) => stash[Number(i)] ?? '')
})
</script>

<template>
  <div class="math-content max-w-none break-words" v-html="renderedHtml"></div>
</template>

<style scoped>
.math-content :deep(p) {
  margin-bottom: 0.5rem;
}
.math-content :deep(p:last-child) {
  margin-bottom: 0;
}
.math-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.math-content :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.math-content :deep(h1),
.math-content :deep(h2),
.math-content :deep(h3),
.math-content :deep(h4) {
  font-weight: 800;
  margin: 0.75rem 0 0.35rem;
}
.math-content :deep(h3) {
  font-size: 1.05em;
}
.math-content :deep(strong) {
  font-weight: 700;
}
.math-content :deep(blockquote) {
  border-left: 3px solid #cbd5e1;
  padding-left: 0.75rem;
  margin: 0.4rem 0;
  color: #475569;
}
.math-content :deep(table) {
  border-collapse: collapse;
  margin: 0.5rem 0;
}
.math-content :deep(th),
.math-content :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.25rem 0.5rem;
}
.math-content :deep(a) {
  color: #0369a1;
  text-decoration: underline;
}
/* Công thức dài cuộn ngang thay vì làm vỡ bố cục trên điện thoại */
.math-content :deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem 0;
}
</style>
