import { test, expect } from '@playwright/test'

test.describe('2. Authentication & Authorization Flows', () => {
  test.describe.configure({ mode: 'serial' })
  const uniqueSuffix = Date.now().toString().slice(-6)
  const studentPhone = `098${uniqueSuffix}1`
  const studentEmail = `student_${uniqueSuffix}@bienedu.vn`
  const passwordValid = 'Password123@'

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('Bắt lỗi Validation khi mật khẩu dưới 8 ký tự (Chi tiết lỗi hiển thị rõ ràng)', async ({ page }) => {
    await page.goto('/auth/register')

    await page.fill('input[type="text"]', 'Nguyễn Minh Quân')
    await page.fill('input[type="tel"]', studentPhone)
    await page.fill('input[type="email"]', studentEmail)
    await page.fill('input[type="password"]', '123456') // Chỉ 6 ký tự
    
    await page.click('button[type="submit"]')

    // Phải hiển thị lỗi validation chi tiết từ Backend
    const alertBox = page.locator('div.bg-rose-50')
    await expect(alertBox).toBeVisible({ timeout: 7000 })
    await expect(alertBox).toContainText('Mật khẩu phải có độ dài từ 8 đến 100 ký tự')
  })

  test('Đăng ký thành công tài khoản Học Sinh với mật khẩu hợp lệ', async ({ page }) => {
    await page.goto('/auth/register')

    await page.fill('input[type="text"]', 'Nguyễn Minh Quân')
    await page.fill('input[type="tel"]', studentPhone)
    await page.fill('input[type="email"]', studentEmail)
    await page.fill('input[type="password"]', passwordValid)

    await page.click('button[type="submit"]')

    // Đăng ký xong tự động redirect vào Dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Nguyễn Minh Quân')
  })

  test('Từ chối đăng ký tài khoản khi số điện thoại đã tồn tại (HTTP 409 Conflict)', async ({ page }) => {
    await page.goto('/auth/register')

    await page.fill('input[type="text"]', 'Người Trùng Số')
    await page.fill('input[type="tel"]', studentPhone) // Đã đăng ký ở test trên
    await page.fill('input[type="password"]', passwordValid)

    await page.click('button[type="submit"]')

    const alertBox = page.locator('div.bg-rose-50')
    await expect(alertBox).toBeVisible({ timeout: 7000 })
    await expect(alertBox).toContainText('Số điện thoại này đã được đăng ký trong hệ thống')
  })

  test('Báo lỗi rõ ràng khi đăng nhập sai mật khẩu', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[type="text"]', studentPhone)
    await page.fill('input[type="password"]', 'SaiMatKhau123')

    await page.click('button[type="submit"]')

    const alertBox = page.locator('div.bg-rose-50')
    await expect(alertBox).toBeVisible({ timeout: 7000 })
    await expect(alertBox).toContainText('Số điện thoại/Email hoặc mật khẩu không chính xác')
  })

  test('Đăng nhập thành công với tài khoản học sinh vừa tạo', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[type="text"]', studentPhone)
    await page.fill('input[type="password"]', passwordValid)

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Nguyễn Minh Quân')
  })

  test('Đăng nhập một chạm chế độ Demo Giáo Viên (Quick Demo Mode)', async ({ page }) => {
    await page.goto('/auth/login')

    // Bấm nút demo giáo viên
    await page.click('button:has-text("Thầy Tùng")')

    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 5000 })
    // Kiểm tra menu giáo viên xuất hiện trên sidebar
    await expect(page.locator('aside a[href="/app/teacher/exercises"]')).toBeVisible()
    await expect(page.locator('aside a[href="/app/teacher/grading"]')).toBeVisible()
  })
})
