<script setup>
import { ref } from 'vue'
import { X, Download, Copy, Check, FileText } from 'lucide-vue-next'

defineEmits(['close'])

const copied = ref(false)

// Mẫu chuẩn: giáo viên soạn trong Word / Google Docs theo đúng khuôn này rồi "Lưu thành PDF".
const SAMPLE = String.raw`Câu 1. Đạo hàm của hàm số $y = x^3 - 2x$ tại $x = 1$ bằng:
A. $1$
B. $3$
C. $-1$
D. $2$
Đáp án: A
Mức độ: Dễ
Lời giải: Ta có $y' = 3x^2 - 2$ nên $y'(1) = 1$.

Câu 2. Cho hàm số $y = x^2$. Xét các mệnh đề:
a) Hàm số đồng biến trên $\mathbb{R}$
b) Hàm số có đúng một điểm cực trị
c) Đồ thị đi qua gốc tọa độ
d) Hàm số là hàm số lẻ
Đáp án: a-S, b-Đ, c-Đ, d-S

Câu 3. Giá trị nhỏ nhất của hàm số $y = x^2 + 1$ bằng bao nhiêu?
Đáp án: 1

Câu 4. Chứng minh hàm số $y = 2x + 1$ đồng biến trên $\mathbb{R}$.
Lời giải: Ta có $y' = 2 > 0$ với mọi $x$.`

const copySample = async () => {
  try {
    await navigator.clipboard.writeText(SAMPLE)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch (e) {
    copied.value = false
  }
}

const rules = [
  { title: 'Bắt đầu mỗi câu bằng "Câu N."', desc: 'Trên một dòng riêng. Cũng nhận "Bài N." hoặc "Ví dụ N.". Số thứ tự tăng dần: 1, 2, 3…' },
  { title: 'Trắc nghiệm: phương án A. B. C. D.', desc: 'Mỗi phương án 1 dòng (hoặc cả 4 phương án trên cùng 1 dòng). Chữ cái in hoa, theo sau là dấu chấm.' },
  { title: 'Đúng / Sai: bốn ý a) b) c) d)', desc: 'Chữ cái thường kèm dấu ")". Đáp án ghi dạng a-Đ, b-S, c-Đ, d-S.' },
  { title: 'Đáp án: …', desc: 'Trắc nghiệm ghi một chữ cái (Đáp án: B). Trả lời ngắn ghi đáp số (Đáp án: 12,5). Không ghi đáp án = tự luận.' },
  { title: 'Lời giải: … và Mức độ: …', desc: 'Không bắt buộc. Mức độ chọn Dễ / Trung bình / Khó (hoặc NB / TH / VD).' },
  { title: 'Công thức đặt trong $…$', desc: 'Viết bằng LaTeX, ví dụ $\\frac{a}{b}$, $\\sqrt{x}$, $x^2$. Đây là cách duy nhất để phân số, căn, mũ không bị vỡ khi đọc từ PDF.' }
]

const formats = [
  { name: 'PDF', desc: 'Xuất từ Word / Google Docs / LaTeX (bôi đen được chữ). Không nhận PDF scan, chụp ảnh. Công thức dạng mũ, phân số, căn được tự khôi phục (x², (a+b)/c, √(x+1)).' },
  { name: 'Word .docx', desc: 'Nhận trực tiếp, không cần xuất PDF. Công thức Chèn → Phương trình (Equation) tự chuyển thành LaTeX; danh sách đánh số A. B. C. D. của Word cũng được đọc. File .doc đời cũ: Lưu thành .docx trước.' },
  { name: 'Markdown .md / văn bản .txt', desc: 'Dùng cho kết quả xuất từ Mathpix, ChatGPT, Gemini, Notion. Ký hiệu **đậm**, #, -, > và \\( … \\) được tự làm sạch.' },
  { name: 'LaTeX .tex', desc: 'Đọc trực tiếp, không cần biên dịch. Hỗ trợ gói ex_test (\\begin{ex}, \\choice, \\True, \\loigiai), lớp exam (\\question) và enumerate.' }
]

const files = [
  { name: 'Mau-Bai-Kiem-Tra.pdf', label: 'Mẫu Bài kiểm tra lý thuyết', hint: 'Trắc nghiệm, đúng/sai, trả lời ngắn, tự luận' },
  { name: 'Mau-Bai-Kiem-Tra.docx', label: 'Mẫu Word (.docx)', hint: 'Có công thức Equation và danh sách A. B. C. D. tự đánh số' },
  { name: 'Mau-Bai-Kiem-Tra.md', label: 'Mẫu Markdown (.md)', hint: 'Giống kết quả xuất từ Mathpix / ChatGPT' },
  { name: 'Mau-Bai-Kiem-Tra.tex', label: 'Mẫu LaTeX (.tex)', hint: 'Kiểu ex_test: \\begin{ex} … \\choice … \\True' },
  { name: 'Mau-Bai-Tap-Tu-Luyen.pdf', label: 'Mẫu Bài tập tự luyện', hint: 'Chia theo Dạng, đáp án và lời giải ở cuối file' },
  { name: 'Mau-Tai-Lieu-Ly-Thuyet.pdf', label: 'Mẫu Tài liệu lý thuyết', hint: 'Chuyên đề → Dạng → Ví dụ (giống file sách mẫu)' }
]
</script>

<template>
  <div class="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh]" data-testid="pdf-template-guide">
      <div class="p-6 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
        <div>
          <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-ocean-50 text-ocean-700 text-[11px] font-bold mb-1">
            <FileText class="w-3.5 h-3.5" />
            <span>Định dạng file để hệ thống bóc tách chính xác</span>
          </div>
          <h3 class="text-lg font-bold text-slate-900">Hướng dẫn soạn file đề &amp; tài liệu</h3>
          <p class="text-xs text-slate-500 mt-0.5">Soạn theo khuôn dưới đây ở bất kỳ định dạng nào bên dưới (PDF, Word, Markdown, văn bản, LaTeX). Không chụp ảnh / scan.</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 flex-shrink-0" aria-label="Đóng hướng dẫn">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1 space-y-6">
        <div class="space-y-2">
          <span class="text-xs font-bold text-slate-700">Định dạng file nhận được</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="fmt in formats" :key="fmt.name" class="p-3 rounded-xl border border-ocean-100 bg-ocean-50/40">
              <div class="text-xs font-bold text-ocean-900">{{ fmt.name }}</div>
              <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{{ fmt.desc }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="r in rules" :key="r.title" class="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <div class="text-xs font-bold text-slate-800">{{ r.title }}</div>
            <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{{ r.desc }}</p>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700">Ví dụ một bài kiểm tra hoàn chỉnh</span>
            <button @click="copySample" class="text-[11px] font-bold text-ocean-700 hover:text-ocean-900 flex items-center space-x-1">
              <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
              <span>{{ copied ? 'Đã sao chép' : 'Sao chép' }}</span>
            </button>
          </div>
          <pre class="p-4 bg-slate-900 text-slate-100 text-[11px] leading-relaxed rounded-2xl overflow-x-auto font-mono whitespace-pre-wrap">{{ SAMPLE }}</pre>
        </div>

        <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-1">
          <div class="font-bold">Lưu ý khi dùng PDF sách có sẵn</div>
          <p>Hệ thống đọc được tiêu đề, số câu, phương án, đáp án và lời giải, và khôi phục mũ, chỉ số, phân số, căn từ vị trí chữ trong PDF. Công thức phức tạp (hệ phương trình, ma trận, tích phân) có thể chưa đúng — hãy kiểm tra ở bước xem trước, hoặc dùng file Word / LaTeX / Markdown để công thức chính xác tuyệt đối.</p>
          <p>Hình vẽ, đồ thị và bảng biến thiên dạng hình không đọc được: câu có hình được đánh dấu cảnh báo để bạn mô tả lại bằng chữ.</p>
          <p>Phần đáp án / lời giải có thể đặt ở cuối file (tiêu đề đứng riêng "Lời giải" hoặc "Đáp án", sau đó là "Câu 1.", "Câu 2."…) — hệ thống tự ghép lại theo số câu.</p>
        </div>

        <div class="space-y-2">
          <span class="text-xs font-bold text-slate-700">Tải file mẫu</span>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              v-for="f in files"
              :key="f.name"
              :href="`/templates/${f.name}`"
              :download="f.name"
              class="p-3 rounded-xl border border-ocean-200 bg-white hover:bg-ocean-50 transition flex flex-col space-y-1"
            >
              <span class="text-xs font-bold text-ocean-800 flex items-center space-x-1.5">
                <Download class="w-3.5 h-3.5" />
                <span>{{ f.label }}</span>
              </span>
              <span class="text-[11px] text-slate-500">{{ f.hint }}</span>
            </a>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-slate-100 flex justify-end flex-shrink-0 bg-slate-50/50 rounded-b-3xl">
        <button @click="$emit('close')" class="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-md transition">
          Đã hiểu
        </button>
      </div>
    </div>
  </div>
</template>
