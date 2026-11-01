// Tiện ích gọi thẳng API backend (lab) để dựng dữ liệu và thử các lỗ hổng phân quyền.
export const API = process.env.E2E_API_URL || 'http://localhost:8080'
export const PASSWORD = 'Password123@'

export const TEACHER = { phone: '0987654321', fullName: 'Thầy Tùng', role: 'TEACHER' }
export const STUDENT = { phone: '0911223344', fullName: 'An Học Sinh', role: 'STUDENT', gradeLevel: 12 }

export async function call(method, path, { token, body, headers } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  let json = null
  try { json = await res.json() } catch { /* không phải JSON */ }
  return { status: res.status, json, headers: res.headers }
}

export async function register(user) {
  return call('POST', '/api/v1/auth/register', {
    body: { password: PASSWORD, email: `${user.phone}@bienedu.vn`, ...user }
  })
}

export async function login(phone, password = PASSWORD) {
  const r = await call('POST', '/api/v1/auth/login', { body: { identifier: phone, password } })
  return { ...r, token: r.json?.data?.accessToken, refreshToken: r.json?.data?.refreshToken, user: r.json?.data?.user }
}

/** Tạo (hoặc đăng nhập nếu đã có) một tài khoản và trả về token. */
export async function ensureUser(user) {
  await register(user)
  return login(user.phone)
}

let seq = 0
export const uniquePhone = () => {
  seq += 1
  return `09${String(Date.now()).slice(-6)}${String(seq).padStart(2, '0')}`
}
