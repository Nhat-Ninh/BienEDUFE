<script setup>
import { FileText, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-vue-next'

const mockAssignments = [
  { id: 1, title: 'Đề kiểm tra 15 phút: Khảo sát sự biến thiên hàm số', className: 'Toán 12 - Luyện thi THPT', dueAt: '2026-10-30 23:59', status: 'PENDING', totalScore: 10 },
  { id: 2, title: 'Bài tập về nhà: Nguyên hàm từng phần và đổi biến số', className: 'Toán 12 - Luyện thi THPT', dueAt: '2026-11-05 23:59', status: 'COMPLETED', totalScore: 10 },
  { id: 3, title: 'Trắc nghiệm chuyên đề: Hình học giải tích Oxyz', className: 'Toán 12 - Luyện thi THPT', dueAt: '2026-11-10 23:59', status: 'PENDING', totalScore: 10 },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Bài Tập & Đề Thi</h1>
        <p class="text-xs text-slate-500 mt-1">Danh sách bài kiểm tra và bài tập giao cho học sinh</p>
      </div>

      <button class="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow transition">
        <Plus class="w-4 h-4" />
        <span>Giao Bài Mới</span>
      </button>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="divide-y divide-slate-100">
        <div 
          v-for="item in mockAssignments" 
          :key="item.id"
          class="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div class="flex items-start space-x-3.5">
            <div class="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-slate-800 text-sm leading-snug">{{ item.title }}</h4>
              <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span>{{ item.className }}</span>
                <span>•</span>
                <span class="flex items-center space-x-1">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                  <span>Hạn nộp: {{ item.dueAt }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3 self-end md:self-center">
            <span 
              :class="[
                'px-2.5 py-1 text-xs font-semibold rounded-full',
                item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              ]"
            >
              {{ item.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang mở' }}
            </span>
            <button class="px-3.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 border border-sky-200 rounded-lg transition">
              Vào làm bài
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
