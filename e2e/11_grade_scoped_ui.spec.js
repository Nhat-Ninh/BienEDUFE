import { test, expect } from '@playwright/test'
import { PASSWORD, call, register, login, uniquePhone } from './support/api.js'

// Giao diện phải hiển thị đúng khối lớp mà học sinh đã đăng ký (không mặc định Toán 12).
const uiLogin = async (page, phone) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/auth/login')
  await page.fill('input[type="text"]', phone)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
}

const newStudent = async (gradeLevel) => {
  const phone = uniquePhone()
  const r = await register({ phone, fullName: `HS Lớp ${gradeLevel ?? 'cũ'}`, role: 'STUDENT', ...(gradeLevel ? { gradeLevel } : {}) })
  expect(r.status).toBe(201)
  return phone
}

test.describe('11. Hiển thị đúng khối lớp học sinh đăng ký', () => {
  test('Form đăng ký bắt buộc chọn khối lớp cho học sinh, giáo viên thì không cần', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/auth/register')
    await expect(page.locator('[data-testid="register-grade"]')).toBeVisible()
    await expect(page.locator('[data-testid="register-grade"] option')).toHaveCount(8) // placeholder + 7 khối

    await page.fill('input[placeholder*="Nguyễn Văn An"]', 'Học Sinh Thiếu Khối')
    await page.fill('input[type="tel"]', uniquePhone())
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    // Trình duyệt chặn gửi form vì ô khối lớp bắt buộc (required) còn trống
    await expect(page).toHaveURL(/\/auth\/register/)
    await expect(page.locator('[data-testid="register-grade"]:invalid')).toHaveCount(1)

    await page.click('button:has-text("Giáo Viên / Trợ Giảng")')
    await expect(page.locator('[data-testid="register-grade"]')).toHaveCount(0)
  })

  test('Đăng ký lớp 10: Navbar, Dashboard và Luyện tập chỉ hiện lớp 10', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/auth/register')
    await page.fill('input[placeholder*="Nguyễn Văn An"]', 'Học Sinh Lớp Mười')
    await page.fill('input[type="tel"]', uniquePhone())
    await page.selectOption('[data-testid="register-grade"]', '10')
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })

    await expect(page.locator('[data-testid="navbar-grade-badge"]')).toHaveText('Lớp 10')
    await expect(page.locator('[data-testid="dashboard-badge"]')).toContainText('Toán Lớp 10')

    await page.goto('/app/practice')
    await expect(page.locator('[data-testid="practice-title"]')).toContainText('Lớp 10')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 10')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Chương 1: Mệnh Đề & Tập Hợp')).toBeVisible()
    await expect(page.locator('[data-testid="grade-selector"] button')).toHaveCount(1)
    await expect(page.locator('text=Ôn Thi QG')).toHaveCount(0)
    await expect(page.locator('text=Cực trị').first()).toHaveCount(0)
  })

  test('Lớp 7, 8, 11 có nội dung mẫu (không bị trống)', async ({ page }) => {
    for (const g of [7, 8, 11]) {
      const phone = await newStudent(g)
      await uiLogin(page, phone)
      await page.goto('/app/practice')
      await expect(page.locator(`text=Mục Lục Chương Trình Lớp ${g}`)).toBeVisible({ timeout: 8000 })
      await expect(page.locator('text=Chưa có nội dung cho lớp này')).toHaveCount(0)
      await page.locator('aside, main').first().waitFor()
      // Câu hỏi của khối hiện ra ở cột phải
      await expect(page.locator('span:has-text("Câu 1 •")').first()).toBeVisible({ timeout: 8000 })
    }
  })

  test('Tài khoản cũ chưa có khối: bị bắt chọn khối, chọn xong hiện đúng nội dung và nhớ sau khi tải lại', async ({ page }) => {
    const phone = await newStudent(null)
    await uiLogin(page, phone)

    const modal = page.locator('[data-testid="grade-select-modal"]')
    await expect(modal).toBeVisible()
    await expect(modal.locator('button[aria-label="Đóng"]')).toHaveCount(0) // bắt buộc, không đóng được
    await expect(page.locator('[data-testid="grade-select-save"]')).toBeDisabled()

    await page.click('[data-testid="grade-option-8"]')
    await page.click('[data-testid="grade-select-save"]')
    await expect(modal).toHaveCount(0)
    await expect(page.locator('[data-testid="navbar-grade-badge"]')).toHaveText('Lớp 8')

    await page.goto('/app/practice')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 8')).toBeVisible({ timeout: 8000 })
    await page.reload()
    await expect(page.locator('[data-testid="grade-select-modal"]')).toHaveCount(0)
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 8')).toBeVisible({ timeout: 8000 })
  })

  test('Học sinh đổi khối từ thanh điều hướng thì Luyện tập nạp lại đúng khối mới', async ({ page }) => {
    const phone = await newStudent(9)
    await uiLogin(page, phone)
    await page.goto('/app/practice')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 9')).toBeVisible({ timeout: 8000 })

    await page.click('[data-testid="navbar-grade-badge"]')
    await page.click('[data-testid="grade-option-6"]')
    await page.click('[data-testid="grade-select-save"]')
    await expect(page.locator('[data-testid="navbar-grade-badge"]')).toHaveText('Lớp 6')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 6')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 9')).toHaveCount(0)
  })

  test('Trang chủ: học sinh đăng nhập thấy chuyên đề đúng khối; khách chọn khối nào thấy khối đó', async ({ page }) => {
    // Khách: mặc định 12, đổi sang lớp 7 thì chuyên đề đổi theo, không còn Oxyz
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page.locator('[data-testid="landing-topics-title"]')).toContainText('Toán 12')
    await page.click('[data-testid="landing-topic-grade-7"]')
    await expect(page.locator('[data-testid="landing-topics-title"]')).toContainText('Toán 7')
    await expect(page.locator('#topics')).toContainText('Số hữu tỉ')
    await expect(page.locator('#topics')).not.toContainText('Oxyz')

    // Học sinh lớp 11: trang chủ mở thẳng khối 11
    const phone = await newStudent(11)
    await uiLogin(page, phone)
    await page.goto('/')
    await expect(page.locator('[data-testid="landing-open-app"]')).toBeVisible()
    await expect(page.locator('[data-testid="landing-topics-title"]')).toContainText('Toán 11')
    await expect(page.locator('#topics')).toContainText('Giới hạn')
  })

  test('Giáo viên: tạo lớp bắt buộc chọn khối; bài học lấy khối theo lớp được chọn', async ({ page }) => {
    const t = uniquePhone()
    expect((await register({ phone: t, fullName: 'GV Khối', role: 'TEACHER' })).status).toBe(201)
    const api = await login(t)
    await call('POST', '/api/v1/classes', { token: api.token, body: { name: 'Lớp 7 mẫu', gradeLevel: 7, description: 'x' } })

    await uiLogin(page, t)
    await page.goto('/app/classes')
    await page.click('button:has-text("Tạo Lớp Học Mới")')
    await expect(page.locator('[data-testid="new-class-grade"]')).toHaveValue('')
    await page.fill('input[placeholder*="Toán 12"]', 'Lớp quên chọn khối')
    await page.click('button:has-text("Tạo Lớp Ngay")')
    await expect(page.locator('div.bg-rose-50')).toContainText('Vui lòng chọn khối lớp')

    // Bộ lọc khối chỉ hiện khối đang có lớp
    await page.goto('/app/classes')
    await expect(page.locator('button:has-text("Lớp 7")')).toBeVisible()
    await expect(page.locator('button:has-text("Lớp 12")')).toHaveCount(0)

    // Form bài học: khối lớp theo lớp (7), không phải 12
    await page.goto('/app/teacher/lessons')
    await page.click('[data-testid="add-lesson-btn"]')
    await expect(page.locator('[data-testid="lesson-grade"]')).toHaveValue('7')
  })

  test('Giáo viên: ngân hàng câu hỏi bắt buộc chọn khối và chỉ liệt kê dạng bài đúng khối', async ({ page }) => {
    await uiLogin(page, '0987654321')
    await page.goto('/app/teacher/exercises')
    await expect(page.locator('[data-testid="bank-grade"]')).toHaveValue('')
    await expect(page.locator('[data-testid="bank-unit"]')).toBeDisabled()
    await page.selectOption('[data-testid="bank-grade"]', '7')
    await expect(page.locator('[data-testid="bank-unit"] option').nth(1)).toContainText('lũy thừa', { timeout: 8000, ignoreCase: true })
    await page.selectOption('[data-testid="bank-grade"]', '12')
    await expect(page.locator('[data-testid="bank-unit"] option').nth(1)).toContainText('cực trị', { timeout: 8000, ignoreCase: true })
  })
})

test.describe('11b. Điện thoại: điều hướng bằng menu', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Màn hình 375px: thanh bên ẩn, mở menu bằng nút và chuyển được trang, không tràn ngang', async ({ page }) => {
    const phone = await newStudent(9)
    await uiLogin(page, phone)
    await expect(page.locator('aside')).toBeHidden()
    await page.click('[data-testid="mobile-menu-btn"]')
    await expect(page.locator('[data-testid="mobile-nav"] a[href="/app/practice"]')).toBeVisible()
    await page.click('[data-testid="mobile-nav"] a[href="/app/practice"]')
    await expect(page).toHaveURL(/\/app\/practice/)
    await expect(page.locator('[data-testid="mobile-nav"]')).toHaveCount(0)
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 9')).toBeVisible({ timeout: 8000 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, 'trang bị tràn ngang').toBeLessThanOrEqual(1)
  })
})
