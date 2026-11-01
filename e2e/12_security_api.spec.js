import { test, expect } from '@playwright/test'
import { API, PASSWORD, call, register, login, uniquePhone } from './support/api.js'

// Kiểm thử bảo mật mức API trên backend lab. Mỗi test khẳng định hành vi AN TOÀN mong muốn:
// test đỏ = lỗ hổng. Mỗi tài khoản chỉ đăng nhập một lần vì hệ thống chỉ cho 1 phiên / tài khoản.

const FUTURE = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19)

async function actor(role, gradeLevel) {
  const phone = uniquePhone()
  const r = await register({ phone, fullName: `Sec ${role} ${phone}`, role, ...(gradeLevel ? { gradeLevel } : {}) })
  expect(r.status, `đăng ký ${role}`).toBe(201)
  const l = await login(phone)
  return { phone, id: l.user.id, token: l.token, refreshToken: l.refreshToken }
}

let tA, tB, sA, sB, classA, inviteA, assignmentA, submissionA

test.beforeAll(async () => {
  tA = await actor('TEACHER')
  tB = await actor('TEACHER')
  sA = await actor('STUDENT', 12)
  sB = await actor('STUDENT', 12)

  const c = await call('POST', '/api/v1/classes', { token: tA.token, body: { name: 'Lớp bảo mật A', gradeLevel: 12, description: 'x' } })
  classA = c.json.data.id
  inviteA = c.json.data.inviteCode
  const j = await call('POST', '/api/v1/classes/join', { token: sA.token, body: { inviteCode: inviteA } })
  expect(j.status).toBe(200)

  const a = await call('POST', '/api/v1/assignments', {
    token: tA.token,
    body: { classId: classA, title: 'Bài bảo mật', dueAt: FUTURE, exerciseIds: [1200001, 1200004] }
  })
  expect(a.status).toBe(201)
  assignmentA = a.json.data.id
  const st = await call('POST', `/api/v1/submissions/assignments/${assignmentA}/start`, { token: sA.token })
  expect(st.status).toBe(201)
  submissionA = st.json.data.id
})

test.describe('Xác thực & phiên', () => {
  test('Không có token -> 401 cho mọi API riêng tư', async () => {
    for (const p of ['/api/v1/auth/me', '/api/v1/classes', '/api/v1/catalog/subjects', '/api/v1/mistakes', '/api/v1/assignments']) {
      const r = await call('GET', p)
      expect(r.status, p).toBe(401)
    }
  })

  test('Token bị sửa chữ ký / alg=none / rác -> 401', async () => {
    const [h, p, s] = sA.token.split('.')
    const tampered = `${h}.${p}.${s.slice(0, -3)}AAA`
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${p}.`
    const forgedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url').toString()), sub: String(tA.id), role: 'TEACHER' })).toString('base64url')
    for (const t of [tampered, none, `${h}.${forgedPayload}.${s}`, 'abc.def.ghi', 'x']) {
      const r = await call('GET', '/api/v1/auth/me', { token: t })
      expect(r.status).toBe(401)
    }
  })

  test('Sau khi đăng xuất, access token cũ bị thu hồi (401)', async () => {
    const u = await actor('STUDENT', 8)
    expect((await call('GET', '/api/v1/auth/me', { token: u.token })).status).toBe(200)
    expect((await call('POST', '/api/v1/auth/logout', { token: u.token })).status).toBe(200)
    expect((await call('GET', '/api/v1/auth/me', { token: u.token })).status).toBe(401)
    const rf = await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: u.refreshToken } })
    expect(rf.status).toBe(401)
  })

  test('Đăng nhập ở thiết bị khác thu hồi phiên cũ (1 phiên / tài khoản)', async () => {
    const u = await actor('STUDENT', 8)
    const second = await login(u.phone)
    expect(second.status).toBe(200)
    expect((await call('GET', '/api/v1/auth/me', { token: u.token })).status).toBe(401)
  })

  test('Refresh token đoán mò / của người khác -> 401', async () => {
    for (const rt of [`${sA.id}:00000000-0000-0000-0000-000000000000`, `${tA.id}:${sA.refreshToken.split(':')[1]}`, 'junk', '1:2:3']) {
      const r = await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: rt } })
      expect(r.status, rt).toBe(401)
    }
  })

  test('Giới hạn thử mật khẩu: dò mật khẩu liên tiếp phải bị chặn (429)', async () => {
    const u = await actor('STUDENT', 8)
    const codes = []
    for (let i = 0; i < 15; i++) {
      codes.push((await call('POST', '/api/v1/auth/login', { body: { identifier: u.phone, password: `Sai${i}Pass!` } })).status)
    }
    expect(codes.includes(429), `mã trạng thái: ${codes.join(',')}`).toBe(true)
  })

  test('SQL injection / dữ liệu lạ ở đăng nhập không gây 500', async () => {
    for (const identifier of ["' OR '1'='1", "admin'--", 'a'.repeat(5000), '${jndi:ldap://x}']) {
      const r = await call('POST', '/api/v1/auth/login', { body: { identifier, password: 'x'.repeat(10) } })
      expect([400, 401, 429]).toContain(r.status)
    }
  })

  test('Đăng ký: không leo thang role ADMIN, không ghi đè trạng thái tài khoản', async () => {
    const admin = await register({ phone: uniquePhone(), fullName: 'Hacker', role: 'ADMIN' })
    expect(admin.status).toBe(403)
    const phone = uniquePhone()
    const r = await call('POST', '/api/v1/auth/register', {
      body: { phone, fullName: 'Mass Assign', password: PASSWORD, role: 'STUDENT', status: 'BANNED', id: 1, gradeLevel: 9 }
    })
    expect(r.status).toBe(201)
    expect(r.json.data.user.status).toBe('ACTIVE')
    expect(r.json.data.user.id).not.toBe(1)
  })
})

test.describe('Phân quyền theo vai trò', () => {
  test('Học sinh không gọi được API của giáo viên (403)', async () => {
    const calls = [
      ['POST', '/api/v1/classes', { name: 'x', gradeLevel: 9 }],
      ['GET', '/api/v1/exercises/1200001'],
      ['POST', '/api/v1/assignments', { classId: classA, title: 't', exerciseIds: [1200001] }],
      ['GET', `/api/v1/submissions/assignments/${assignmentA}`],
      ['GET', `/api/v1/submissions/${submissionA}/teacher`],
      ['POST', '/api/v1/submissions/grade-essay', { submissionAnswerId: 1, score: 10 }],
      ['GET', '/api/v1/feedback-templates'],
      ['GET', '/api/v1/lessons/teacher']
    ]
    for (const [m, p, b] of calls) {
      const r = await call(m, p, { token: sA.token, body: b })
      expect(r.status, `${m} ${p}`).toBe(403)
    }
  })

  test('Giáo viên không gọi được API của học sinh (403)', async () => {
    for (const [m, p, b] of [
      ['POST', '/api/v1/classes/join', { inviteCode: inviteA }],
      ['GET', '/api/v1/mistakes'],
      ['POST', '/api/v1/subscriptions/checkout', { planId: 1 }],
      ['POST', `/api/v1/submissions/assignments/${assignmentA}/start`]
    ]) {
      const r = await call(m, p, { token: tB.token, body: b })
      expect(r.status, `${m} ${p}`).toBe(403)
    }
  })

  test('Giáo viên không đặt được khối lớp (API chỉ cho học sinh)', async () => {
    const r = await call('PUT', '/api/v1/auth/me/grade-level', { token: tA.token, body: { gradeLevel: 10 } })
    expect(r.status).toBe(403)
  })
})

test.describe('Khối lớp của học sinh', () => {
  test('Đăng ký lưu khối, /me trả về khối, đổi khối hợp lệ, từ chối khối sai', async () => {
    const u = await actor('STUDENT', 9)
    const me = await call('GET', '/api/v1/auth/me', { token: u.token })
    expect(me.json.data.gradeLevel).toBe(9)
    expect((await call('PUT', '/api/v1/auth/me/grade-level', { token: u.token, body: { gradeLevel: 10 } })).json.data.gradeLevel).toBe(10)
    for (const g of [5, 13, 0, -1, null, 'abc']) {
      const r = await call('PUT', '/api/v1/auth/me/grade-level', { token: u.token, body: { gradeLevel: g } })
      expect(r.status, `gradeLevel=${g}`).toBe(400)
    }
    expect((await call('GET', '/api/v1/auth/me', { token: u.token })).json.data.gradeLevel).toBe(10)
  })

  test('Đăng ký học sinh với khối ngoài 6-12 bị từ chối; giáo viên bỏ qua khối gửi lên', async () => {
    expect((await register({ phone: uniquePhone(), fullName: 'x', role: 'STUDENT', gradeLevel: 13 })).status).toBe(400)
    const t = await register({ phone: uniquePhone(), fullName: 'y', role: 'TEACHER', gradeLevel: 12 })
    expect(t.json.data.user.gradeLevel).toBeNull()
  })
})

test.describe('IDOR: truy cập chéo dữ liệu của người khác', () => {
  test('Giáo viên B không đọc/sửa được lớp, bài giao, bài nộp của giáo viên A', async () => {
    const t = tB.token
    const cases = [
      ['GET', `/api/v1/classes/${classA}/students`],
      ['PATCH', `/api/v1/classes/${classA}/archive`],
      ['POST', `/api/v1/classes/${classA}/students`, { phone: sB.phone }],
      ['DELETE', `/api/v1/classes/${classA}/students/${sA.id}`],
      ['GET', `/api/v1/assignments/${assignmentA}/teacher`],
      ['GET', `/api/v1/submissions/assignments/${assignmentA}`],
      ['GET', `/api/v1/submissions/${submissionA}/teacher`],
      ['GET', `/api/v1/skill-map/students/${sA.id}?classId=${classA}`],
      ['GET', `/api/v1/skill-map/students/${sA.id}`]
    ]
    for (const [m, p, b] of cases) {
      const r = await call(m, p, { token: t, body: b })
      expect([403, 404], `${m} ${p} -> ${r.status}`).toContain(r.status)
    }
    // lớp của A vẫn nguyên vẹn
    const still = await call('GET', `/api/v1/classes/${classA}`, { token: tA.token })
    expect(still.json.data.status).toBe('ACTIVE')
  })

  test('Học sinh B (không thuộc lớp) không đọc được lớp, bài giao, bài học, bài nộp của lớp A', async () => {
    const t = sB.token
    for (const [m, p] of [
      ['GET', `/api/v1/classes/${classA}`],
      ['GET', `/api/v1/assignments/${assignmentA}`],
      ['GET', `/api/v1/assignments/class/${classA}`],
      ['GET', `/api/v1/lessons/classes/${classA}`],
      ['POST', `/api/v1/submissions/assignments/${assignmentA}/start`],
      ['GET', `/api/v1/submissions/${submissionA}`],
      ['GET', `/api/v1/submissions/assignments/${assignmentA}/my`]
    ]) {
      const r = await call(m, p, { token: t })
      expect([403, 404], `${m} ${p} -> ${r.status}`).toContain(r.status)
    }
  })

  test('Học sinh không nộp được bài thay người khác / câu hỏi ngoài bài giao không được tính', async () => {
    const r = await call('POST', `/api/v1/submissions/assignments/${assignmentA}/submit`, {
      token: sB.token,
      body: [{ exerciseId: 1200001, studentAnswer: 'A' }]
    })
    expect([403, 404]).toContain(r.status)
  })
})

test.describe('Rò rỉ đáp án & chấm điểm', () => {
  test('Học sinh không thấy correctAnswer ở danh sách câu hỏi và chi tiết bài giao', async () => {
    const list = await call('GET', '/api/v1/exercises?lessonUnitId=120001', { token: sA.token })
    expect(list.status).toBe(200)
    expect(JSON.stringify(list.json)).not.toMatch(/correctAnswer/i)
    const detail = await call('GET', `/api/v1/assignments/${assignmentA}`, { token: sA.token })
    expect(detail.status).toBe(200)
    expect(JSON.stringify(detail.json)).not.toMatch(/correctAnswer/i)
  })

  test('Gửi trùng một câu đúng nhiều lần chỉ được tính một lần', async () => {
    const r = await call('POST', `/api/v1/submissions/assignments/${assignmentA}/submit`, {
      token: sA.token,
      body: [
        ...Array.from({ length: 10 }, () => ({ exerciseId: 1200001, studentAnswer: 'A' })),
        { exerciseId: 1200004, studentAnswer: 'Lời giải tự luận' }
      ]
    })
    expect(r.status).toBe(200)
    const total = Number(r.json.data.totalScore ?? r.json.data.score ?? 0)
    expect(total).toBeLessThanOrEqual(10)
    // nộp lần hai bị từ chối
    const again = await call('POST', `/api/v1/submissions/assignments/${assignmentA}/submit`, {
      token: sA.token, body: [{ exerciseId: 1200001, studentAnswer: 'A' }]
    })
    expect(again.status).toBe(409)
  })

  test('Giáo viên B không chấm được bài tự luận của lớp A; giáo viên A chấm được', async () => {
    const detail = await call('GET', `/api/v1/submissions/${submissionA}/teacher`, { token: tA.token })
    expect(detail.status).toBe(200)
    const essay = (detail.json.data.answers || []).find(a => a.exerciseType === 'ESSAY') || detail.json.data.answers?.[0]
    expect(essay, 'bài nộp phải có câu trả lời').toBeTruthy()
    const body = { submissionAnswerId: essay.id, score: 5, feedbackNote: 'ok' }
    const other = await call('POST', '/api/v1/submissions/grade-essay', { token: tB.token, body })
    expect([403, 404]).toContain(other.status)
    const own = await call('POST', '/api/v1/submissions/grade-essay', { token: tA.token, body })
    expect(own.status).toBe(200)
  })

  test('Không nộp bài sau hạn chót', async () => {
    const c = await call('POST', '/api/v1/classes', { token: tA.token, body: { name: 'Lớp hạn nộp', gradeLevel: 12, description: 'x' } })
    const cid = c.json.data.id
    await call('POST', '/api/v1/classes/join', { token: sA.token, body: { inviteCode: c.json.data.inviteCode } })
    const past = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 19)
    const a = await call('POST', '/api/v1/assignments', { token: tA.token, body: { classId: cid, title: 'Quá hạn', dueAt: past, exerciseIds: [1200001] } })
    const late = a.status === 201 ? await call('POST', `/api/v1/submissions/assignments/${a.json.data.id}/start`, { token: sA.token }) : a
    // Mong muốn: tạo bài hạn trong quá khứ bị chặn (400) hoặc học sinh không nộp được sau hạn (400/403/409)
    expect([400, 403, 409], `tạo=${a.status}, bắt đầu làm=${late.status}`).toContain(a.status === 201 ? late.status : a.status)
  })
})

test.describe('Upload / tải tệp', () => {
  const upload = async (token, name, content, type = 'application/octet-stream') => {
    const fd = new FormData()
    fd.append('file', new Blob([content], { type }), name)
    const res = await fetch(`${API}/api/v1/files/upload`, { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} })
    let json = null
    try { json = await res.json() } catch { /* */ }
    return { status: res.status, json }
  }

  test('Upload cần đăng nhập', async () => {
    expect((await upload(null, 'a.pdf', '%PDF-1.4 test')).status).toBe(401)
  })

  test('Chặn HTML/SVG/JS/script và đuôi kép (XSS lưu trữ)', async () => {
    for (const name of ['x.html', 'x.svg', 'x.js', 'x.php', 'evil.pdf.html', 'x.exe', 'x', '.htaccess', 'x.pdf.svg']) {
      const r = await upload(sA.token, name, '<script>alert(1)</script>', 'text/html')
      expect(r.status, name).toBe(400)
    }
  })

  test('Chặn tệp giả đuôi: nội dung HTML đặt tên .pdf / .png không được nhận', async () => {
    for (const name of ['fake.pdf', 'fake.png', 'fake.jpg']) {
      const r = await upload(sA.token, name, '<html><script>alert(1)</script></html>', 'application/pdf')
      expect(r.status, name).toBe(400)
    }
  })

  test('Nhận PDF hợp lệ, tải lại được và chống path traversal', async () => {
    const ok = await upload(sA.token, 'bai tap.pdf', '%PDF-1.4\n%test\n', 'application/pdf')
    expect(ok.status).toBe(200)
    const url = ok.json.data.fileUrl
    expect((await fetch(`${API}${url}`)).status).toBe(200)
    for (const p of ['..%2f..%2fpom.xml', '..%5c..%5cpom.xml', '%2e%2e/%2e%2e/pom.xml', '....//....//pom.xml']) {
      const r = await fetch(`${API}/api/v1/files/download/${p}`)
      expect([400, 401, 404], p).toContain(r.status)
    }
  })

  test('Phản hồi tải tệp có nosniff và không thi hành script', async () => {
    const ok = await upload(sA.token, 'a.png', Buffer.from('89504e470d0a1a0a0000000d', 'hex'), 'image/png')
    expect(ok.status).toBe(200)
    const r = await fetch(`${API}${ok.json.data.fileUrl}`)
    expect(r.headers.get('x-content-type-options')).toBe('nosniff')
  })
})

test.describe('Thanh toán / gói học', () => {
  test('Học sinh không tự xác nhận thanh toán gói trả phí để lấy VIP miễn phí', async () => {
    test.skip(process.env.E2E_PAYMENT_SELF_CONFIRM === 'true', 'lab đang bật tự xác nhận để chạy luồng demo')
    const u = await actor('STUDENT', 10)
    const plans = await call('GET', '/api/v1/subscriptions/plans')
    const paid = plans.json.data.find(p => Number(p.price) > 0)
    const co = await call('POST', '/api/v1/subscriptions/checkout', { token: u.token, body: { planId: paid.id, method: 'BANK_TRANSFER' } })
    expect(co.status).toBe(201)
    const conf = await call('POST', `/api/v1/subscriptions/confirm-payment/${co.json.data.paymentId}`, { token: u.token })
    // Mong muốn: không có tiền về thì không thể tự xác nhận (403). 200 nghĩa là VIP miễn phí.
    expect(conf.status, 'confirm-payment tự xác nhận được = lấy VIP miễn phí').toBe(403)
  })

  test('Học sinh không xác nhận thanh toán của người khác', async () => {
    const u1 = await actor('STUDENT', 10)
    const u2 = await actor('STUDENT', 10)
    const plans = await call('GET', '/api/v1/subscriptions/plans')
    const paid = plans.json.data.find(p => Number(p.price) > 0)
    const co = await call('POST', '/api/v1/subscriptions/checkout', { token: u1.token, body: { planId: paid.id } })
    const r = await call('POST', `/api/v1/subscriptions/confirm-payment/${co.json.data.paymentId}`, { token: u2.token })
    expect(r.status).toBe(403)
  })
})

test.describe('Cấu hình & lộ thông tin', () => {
  test('Header bảo mật và không lộ stack trace', async () => {
    const r = await call('GET', '/api/v1/auth/me')
    expect(r.headers.get('x-content-type-options')).toBe('nosniff')
    expect(r.headers.get('x-powered-by')).toBeNull()
    const bad = await fetch(`${API}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"identifier": ' })
    const txt = await bad.text()
    expect(bad.status).toBe(400)
    expect(txt).not.toMatch(/at com\.example|java\.lang|org\.springframework|Exception in/)
    const nf = await fetch(`${API}/api/v1/khong-ton-tai`, { headers: { Authorization: `Bearer ${sA.token}` } })
    expect(await nf.text()).not.toMatch(/at com\.example|java\.lang|org\.springframework/)
  })

  test('Actuator chỉ lộ health', async () => {
    for (const p of ['/actuator/env', '/actuator/heapdump', '/actuator/beans', '/actuator/mappings', '/actuator/configprops']) {
      const r = await fetch(`${API}${p}`)
      expect([401, 403, 404], p).toContain(r.status)
    }
    const h = await (await fetch(`${API}/actuator/health`)).json()
    expect(h.status).toBe('UP')
    expect(h.components).toBeUndefined()
    expect(h.details).toBeUndefined()
  })

  test('CORS không phản chiếu origin lạ kèm credentials', async () => {
    const r = await fetch(`${API}/api/v1/auth/me`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' }
    })
    const acao = r.headers.get('access-control-allow-origin')
    expect(acao).not.toBe('https://evil.example')
    expect(acao).not.toBe('*')
  })

  test('Phân trang cực lớn không làm sập (không 5xx)', async () => {
    for (const q of ['size=1000000', 'size=-1', 'page=-5', 'size=abc', 'page=99999999999']) {
      const r = await call('GET', `/api/v1/classes?${q}`, { token: tA.token })
      expect(r.status, q).toBeLessThan(500)
    }
  })

  test('Báo cáo công khai: token sai -> 404, không lộ dữ liệu; token mới vô hiệu token cũ', async () => {
    expect((await call('GET', '/api/v1/reports/weekly/public/' + 'a'.repeat(32))).status).toBe(404)
    const t1 = (await call('POST', '/api/v1/reports/weekly/share', { token: sA.token })).json.data
    expect((await call('GET', `/api/v1/reports/weekly/public/${t1}`)).status).toBe(200)
    expect(t1).toMatch(/^[0-9a-f]{32}$/)
    const t2 = (await call('POST', '/api/v1/reports/weekly/share', { token: sA.token })).json.data
    expect(t2).not.toBe(t1)
    expect((await call('GET', `/api/v1/reports/weekly/public/${t1}`)).status).toBe(404)
  })
})
