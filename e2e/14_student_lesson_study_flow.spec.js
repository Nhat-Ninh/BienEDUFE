import { test, expect } from '@playwright/test'
import { call, login, TEACHER, STUDENT, uniquePhone } from './support/api.js'

/**
 * Luồng học trọn vẹn của một bài học, đứng ở cả hai phía:
 *   Giáo viên đăng bài giảng + bài tập + bài kiểm tra → Học sinh học lý thuyết (xem lời giải ví dụ, đánh dấu đã hiểu)
 *   → luyện tập (kiểm tra đáp án ngay) → làm bài kiểm tra → xem lời giải → Giáo viên xem tiến độ từng học sinh.
 */

const THEORY = `# Chuyên đề 1 – Đạo hàm

## Dạng 1.1 – Đạo hàm đa thức

**Kiến thức cần nhớ.** Đạo hàm của $x^n$ là $nx^{n-1}$.

**Cách làm.** Đạo hàm từng hạng tử rồi cộng lại.

### Ví dụ 1

Tính đạo hàm của $f(x) = 3x^2 - 2x + 5$.

> **Lời giải:** $f'(x) = 6x - 2$.

## Dạng 1.2 – Đạo hàm phân thức

### Ví dụ 1

Tính đạo hàm của $f(x) = \\frac{1}{x}$.

> **Đáp án:** $-\\frac{1}{x^2}$
> **Lời giải:** Áp dụng $(x^{-1})' = -x^{-2}$.
`

const EXERCISE = `### Dạng 1.1 – Cơ bản

**Câu 1.** Đạo hàm của $y = x^2$ là:

- **A.** $x$
- **B.** $2x$
- **C.** $2$
- **D.** $0$

> **Đáp án:** B
> **Lời giải:** $(x^2)' = 2x$.

**Câu 2.** Tính $f'(1)$ biết $f(x) = x^3$. Đáp số bằng bao nhiêu?

> **Đáp án:** 3
> **Lời giải:** $f'(x) = 3x^2$ nên $f'(1) = 3$.

**Câu 3.** Chứng minh $(x)' = 1$.

> **Lời giải:** Theo định nghĩa, $\\lim_{h\\to 0} \\frac{(x+h)-x}{h} = 1$.
`

async function setup() {
  const teacher = await login(TEACHER.phone)
  const student = await login(STUDENT.phone)
  expect(teacher.token).toBeTruthy()

  const cls = await call('POST', '/api/v1/classes', { token: teacher.token, body: { name: `Lớp học thử ${uniquePhone().slice(-5)}`, gradeLevel: 12 } })
  const classId = cls.json.data.id
  await call('POST', `/api/v1/classes/${classId}/students`, { token: teacher.token, body: { phone: STUDENT.phone } })

  const title = `Đạo hàm cơ bản ${Date.now().toString().slice(-6)}`
  const lesson = await call('POST', '/api/v1/lessons', {
    token: teacher.token,
    body: { classId, title, description: 'Làm quen khái niệm đạo hàm', theoryContentMd: THEORY, exerciseContentMd: EXERCISE }
  })
  expect(lesson.status).toBe(201)
  const lessonId = lesson.json.data.id

  const quiz = await call('POST', `/api/v1/lessons/${lessonId}/quiz`, {
    token: teacher.token,
    body: {
      title: `Kiểm tra: ${title}`,
      description: 'Bài kiểm tra ngắn',
      questions: [{
        contentMd: 'Đạo hàm của $y = 5x$ là:',
        type: 'MULTIPLE_CHOICE',
        choices: [{ key: 'A', text: '$5$' }, { key: 'B', text: '$5x$' }, { key: 'C', text: '$0$' }, { key: 'D', text: '$x$' }],
        correctAnswer: 'A',
        solutionMd: 'Hàm bậc nhất $y = ax$ có đạo hàm bằng hằng số $a$, nên $y\' = 5$.'
      }]
    }
  })
  expect(quiz.status).toBe(201)
  return { classId, lessonId, title, teacherToken: teacher.token, studentToken: student.token }
}

async function uiLogin(page, phone) {
  await page.goto('/auth/login')
  await page.fill('input[type="text"]', phone)
  await page.fill('input[type="password"]', 'Password123@')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
}

test.describe('14. Luồng học một bài học: giáo viên đăng → học sinh học → giáo viên theo dõi', () => {
  test('Học sinh học lý thuyết, luyện tập, làm kiểm tra và giáo viên thấy tiến độ', async ({ page }) => {
    const ctx = await setup()

    // ───────────── HỌC SINH ─────────────
    await uiLogin(page, STUDENT.phone)
    // Trang tổng quan nhắc học tiếp các bài giáo viên đã giao
    await expect(page.locator('[data-testid="continue-learning"]')).toBeVisible({ timeout: 10000 })
    await page.goto(`/app/classes/${ctx.classId}`)
    const card = page.locator(`[data-testid="lesson-card-${ctx.lessonId}"]`)
    await expect(card).toBeVisible()
    await expect(page.locator(`[data-testid="lesson-progress-${ctx.lessonId}"]`)).toHaveText('0%')

    // Bấm vào bài học: không mở file PDF mà vào khung học
    await page.click(`[data-testid="open-lesson-${ctx.lessonId}"]`)
    await expect(page).toHaveURL(new RegExp(`/app/lessons/${ctx.lessonId}`))
    await expect(page.locator('[data-testid="lesson-title"]')).toHaveText(ctx.title)

    // Lý thuyết: mục lục, nội dung, lời giải ẩn cho tới khi bấm
    await expect(page.locator('[data-testid="topic-title"]')).toContainText('Dạng 1.1')
    await expect(page.locator('[data-testid="solution-0"]')).toHaveCount(0)
    await page.locator('[data-testid^="reveal-"]').first().click()
    await expect(page.locator('[data-testid^="solution-"]').first()).toBeVisible()
    await expect(page.locator('.katex').first()).toBeVisible()

    await page.click('[data-testid="mark-done"]')
    await expect(page.locator('[data-testid="theory-progress-text"]')).toContainText('1/2 mục')
    await page.click('[data-testid="next-topic"]')
    await expect(page.locator('[data-testid="topic-title"]')).toContainText('Dạng 1.2')
    await page.click('[data-testid="mark-done"]')
    await expect(page.locator('[data-testid="theory-progress-text"]')).toContainText('2/2 mục')

    // Luyện tập: trắc nghiệm có phản hồi ngay, đáp số, tự luận
    await page.click('[data-testid="next-step"]')
    await expect(page.locator('[data-testid="study-practice"]')).toBeVisible()
    await page.click('[data-testid="choice-0-B"]')
    await expect(page.locator('[data-testid="practice-q-0"]').getByText('Đúng', { exact: true })).toBeVisible()
    await expect(page.locator('[data-testid="practice-solution-0"]')).toBeVisible()

    await page.fill('[data-testid="short-1"]', '4')
    await page.click('[data-testid="check-1"]')
    await expect(page.locator('[data-testid="practice-q-1"]').getByText('Chưa đúng')).toBeVisible()

    await page.click('[data-testid="reveal-practice-2"]')
    await expect(page.locator('[data-testid="practice-solution-2"]')).toBeVisible()
    await page.getByRole('button', { name: 'Mình làm đúng' }).click()
    await expect(page.locator('[data-testid="practice-answered"]')).toContainText('3')
    await expect(page.locator('[data-testid="practice-correct"]')).toContainText('2')

    // Kiểm tra
    await page.click('[data-testid="study-tab-quiz"]')
    await page.click('[data-testid="start-quiz"]')
    await expect(page).toHaveURL(/\/app\/assignments\/\d+\/do/)
    await page.locator('button:has(span:text-is("A"))').first().click()
    await page.click('button:has-text("Nộp Bài")')
    await page.click('button:has-text("Nộp Bài Luôn")')
    await expect(page).toHaveURL(/\/app\/submissions\/\d+/, { timeout: 10000 })

    // Kết quả có lời giải của chính câu hỏi (trước đây bị mất khi lưu đề)
    await expect(page.locator('[data-testid="solution-0"]')).toContainText('đạo hàm bằng hằng số')

    // Quay lại lớp: tiến độ 100%
    await page.goto(`/app/classes/${ctx.classId}`)
    await expect(page.locator(`[data-testid="lesson-progress-${ctx.lessonId}"]`)).toHaveText('100%', { timeout: 10000 })
    await expect(page.locator(`[data-testid="open-lesson-${ctx.lessonId}"]`)).toContainText('Tiếp tục học')

    // Máy chủ đã lưu tiến độ (giáo viên theo dõi được)
    const detail = await call('GET', `/api/v1/lessons/${ctx.lessonId}`, { token: (await login(STUDENT.phone)).token })
    expect(detail.json.data.studentProgress).toMatchObject({ theoryDone: 2, theoryTotal: 2, practiceAnswered: 3, practiceTotal: 3, practiceCorrect: 2 })

    // ───────────── GIÁO VIÊN ─────────────
    await page.goto('/auth/login')
    await uiLogin(page, TEACHER.phone)
    await page.goto(`/app/classes/${ctx.classId}`)
    await expect(page.locator(`[data-testid="open-lesson-${ctx.lessonId}"]`)).toContainText('Xem như học sinh')

    await page.locator(`[data-testid="lesson-card-${ctx.lessonId}"]`).getByRole('button', { name: /Tiến độ & bảng điểm/ }).click()
    // Bảng tiến độ trong cửa sổ theo dõi (không đăng nhập lại bằng API vì mỗi tài khoản chỉ có một phiên)
    await expect(page.locator('[data-testid^="track-theory-"]').filter({ hasText: '2/2 mục' })).toBeVisible({ timeout: 8000 })
    await expect(page.locator('[data-testid^="track-practice-"]').filter({ hasText: '3/3 câu · đúng 2' })).toBeVisible()

    await page.keyboard.press('Escape')
    await page.goto(`/app/lessons/${ctx.lessonId}`)
    await expect(page.locator('[data-testid="preview-banner"]')).toBeVisible()
    await expect(page.locator('[data-testid="mark-done"]')).toHaveCount(0)
  })

  test('Bài chỉ có file đính kèm không còn mở thẳng PDF: học sinh thấy khung hướng dẫn tải về', async ({ page }) => {
    const teacher = await login(TEACHER.phone)
    const cls = await call('POST', '/api/v1/classes', { token: teacher.token, body: { name: `Lớp file ${uniquePhone().slice(-5)}`, gradeLevel: 12 } })
    const classId = cls.json.data.id
    await call('POST', `/api/v1/classes/${classId}/students`, { token: teacher.token, body: { phone: STUDENT.phone } })
    const lesson = await call('POST', '/api/v1/lessons', {
      token: teacher.token,
      body: { classId, title: 'Chỉ có file', theoryFileName: 'ly-thuyet.pdf', theoryFileUrl: '/api/v1/files/download/ly-thuyet.pdf' }
    })
    const lessonId = lesson.json.data.id

    await uiLogin(page, STUDENT.phone)
    await page.goto(`/app/lessons/${lessonId}`)
    await expect(page.locator('[data-testid="theory-empty"]')).toContainText('chưa soạn bài giảng trên web')
    await expect(page.locator('[data-testid="theory-empty"] a')).toHaveAttribute('href', /ly-thuyet\.pdf$/)
    await expect(page.locator('[data-testid="study-tab-quiz"]')).toBeVisible()
  })
})
