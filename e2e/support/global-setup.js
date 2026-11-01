import { TEACHER, STUDENT, ensureUser } from './api.js'

// Dựng sẵn hai tài khoản mẫu mà các kịch bản cũ dùng (idempotent: đã có thì bỏ qua).
export default async function globalSetup() {
  const t = await ensureUser(TEACHER)
  const s = await ensureUser(STUDENT)
  if (!t.token || !s.token) {
    throw new Error('Không dựng được tài khoản mẫu: backend lab có đang chạy ở cổng 8080 không?')
  }
}
