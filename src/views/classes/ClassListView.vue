<script setup>
import { Users, Plus, BookOpen } from 'lucide-vue-next'

const mockClasses = [
  { id: 1, name: 'Toán 12 - Luyện thi THPT Quốc Gia', gradeLevel: 12, studentCount: 35, teacherName: 'Thầy Biên' },
  { id: 2, name: 'Toán 11 - Hình học không gian & Lượng giác', gradeLevel: 11, studentCount: 28, teacherName: 'Thầy Biên' },
  { id: 3, name: 'Toán 10 - Đại số & Bất đẳng thức nâng cao', gradeLevel: 10, studentCount: 30, teacherName: 'Thầy Biên' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Danh Sách Lớp Học</h1>
        <p class="text-xs text-slate-500 mt-1">Quản lý lớp học và danh sách học sinh theo khối</p>
      </div>

      <button class="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow transition">
        <Plus class="w-4 h-4" />
        <span>Thêm Lớp Mới</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div 
        v-for="cls in mockClasses" 
        :key="cls.id"
        class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-sky-100 text-sky-700">
              Khối {{ cls.gradeLevel }}
            </span>
            <span class="text-xs text-slate-400 font-medium">35 bài tập</span>
          </div>
          <h3 class="font-bold text-slate-800 text-base leading-snug">{{ cls.name }}</h3>
          <p class="text-xs text-slate-500 mt-1">Giáo viên phụ trách: {{ cls.teacherName }}</p>
        </div>

        <div class="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
          <div class="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
            <Users class="w-4 h-4 text-slate-400" />
            <span>{{ cls.studentCount }} Học sinh</span>
          </div>
          <button class="text-xs font-semibold text-sky-600 hover:text-sky-700">
            Xem chi tiết →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
