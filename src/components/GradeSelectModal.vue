<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { GRADES, GRADE_INFO } from '@/constants/grades'
import { GraduationCap, X, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  // required = học sinh bắt buộc chọn khối (tài khoản cũ chưa có), không đóng được
  required: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const authStore = useAuthStore()
const selected = ref(authStore.gradeLevel || null)
const isSaving = ref(false)
const errorMessage = ref('')

watch(() => props.open, (v) => {
  if (v) {
    selected.value = authStore.gradeLevel || null
    errorMessage.value = ''
  }
})

const save = async () => {
  if (!selected.value) {
    errorMessage.value = 'Vui lòng chọn khối lớp.'
    return
  }
  isSaving.value = true
  errorMessage.value = ''
  try {
    await authStore.setGradeLevel(selected.value)
    emit('close')
  } catch (err) {
    errorMessage.value = err.detail || err.message || 'Không thể lưu khối lớp. Vui lòng thử lại.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
    data-testid="grade-select-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="grade-select-title"
  >
    <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-10 h-10 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center">
            <GraduationCap class="w-5 h-5" />
          </div>
          <div>
            <h3 id="grade-select-title" class="text-base font-bold text-slate-900">
              {{ required ? 'Bạn đang học lớp mấy?' : 'Đổi khối lớp' }}
            </h3>
            <p class="text-xs text-slate-500">Nội dung luyện tập sẽ hiển thị đúng theo khối lớp bạn chọn.</p>
          </div>
        </div>
        <button v-if="!required" type="button" class="text-slate-400 hover:text-slate-600" aria-label="Đóng" @click="emit('close')">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div v-if="errorMessage" class="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
        <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="g in GRADES"
          :key="g"
          type="button"
          :data-testid="`grade-option-${g}`"
          :class="[
            'text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition',
            selected === g
              ? 'border-ocean-500 bg-ocean-50 text-ocean-800 ring-2 ring-ocean-200'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          ]"
          @click="selected = g"
        >
          <div>{{ GRADE_INFO[g].label }}</div>
          <div class="text-[10px] font-normal text-slate-500">{{ GRADE_INFO[g].sub }}</div>
        </button>
      </div>

      <button
        type="button"
        data-testid="grade-select-save"
        :disabled="isSaving || !selected"
        class="w-full py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:bg-ocean-300 text-white font-bold text-sm rounded-xl transition"
        @click="save"
      >
        {{ isSaving ? 'Đang lưu...' : 'Xác nhận khối lớp' }}
      </button>
    </div>
  </div>
</template>
