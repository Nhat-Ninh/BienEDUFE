import { test, expect } from '@playwright/test'

test.describe('7. Edge Cases, Multi-Case & System Stability Verification', () => {
  const teacherPhone = '0987654321'
  const teacherPass = 'Password123@'
  const studentPhone = '0911223344'
  const studentPass = 'Password123@'

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('Xử lý an toàn khi phụ huynh truy cập link chia sẻ không tồn tại hoặc đã hết hạn', async ({ page }) => {
    // Truy cập link báo cáo với token giả mạo
    await page.goto('/report/public/invalid_token_99999999999')
    
    // Không bị crash màn hình trắng (White Screen of Death), hiển thị thông báo lỗi thân thiện
    const errorBox = page.locator('div.bg-rose-50')
    await expect(errorBox).toBeVisible({ timeout: 5000 })
    await expect(errorBox).toContainText('Link chia se khong hop le')
    
    // Nút quay lại trang chủ hoạt động
    await page.click('a:has-text("Về Trang Chủ")')
    await expect(page).toHaveURL('/')
  })

  test('Báo lỗi rõ ràng khi học sinh nhập sai mã mời vào lớp', async ({ page }) => {
    // 1. Đăng nhập học sinh
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', studentPhone)
    await page.fill('input[type="password"]', studentPass)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })

    // 2. Vào trang lớp học và nhập mã mời không tồn tại (đúng format 8 ký tự)
    await page.goto('/app/classes')
    await page.click('button:has-text("Nhập Mã Vào Lớp")')
    await page.fill('input[placeholder*="BIEN"]', 'BIEN9999')
    await page.click('button:has-text("Xác Nhận Vào Lớp")')

    // Phải hiển thị thông báo lỗi rõ ràng
    const alertBox = page.locator('div.bg-rose-50')
    await expect(alertBox).toBeVisible({ timeout: 5000 })
  })

  test('Chuyển đổi liên tục giữa 7 khối lớp (Lớp 6 đến 12) mượt mà, không giật lag hay xung đột state', async ({ page }) => {
    // 1. Đăng nhập học sinh
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', studentPhone)
    await page.fill('input[type="password"]', studentPass)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/)

    // 2. Vào màn hình Luyện tập
    await page.goto('/app/practice')

    const grades = [6, 7, 8, 9, 10, 11, 12]
    for (const g of grades) {
      await page.click(`button:has-text("Lớp ${g}")`)
      await expect(page.locator(`text=Mục Lục Chương Trình Lớp ${g}`)).toBeVisible({ timeout: 4000 })
    }
  })

  test('Duy trì phiên đăng nhập sau khi F5 tải lại trang và bảo vệ Route Guard', async ({ page }) => {
    // 1. Đăng nhập
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', teacherPhone)
    await page.fill('input[type="password"]', teacherPass)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/)

    // 2. F5 reload lại trang
    await page.reload()
    await expect(page).toHaveURL(/\/app\/dashboard/)
    await expect(page.locator('text=👨‍🏫 Giáo Viên')).toBeVisible()

    // 3. Truy cập route /auth/login khi đã đăng nhập -> Phải tự động redirect về /app/dashboard
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/app\/dashboard/)

    // 4. Thử truy cập route chỉ dành cho Teacher với tài khoản Student
    await page.click('button[title="Đăng xuất"]')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.fill('input[type="text"]', studentPhone)
    await page.fill('input[type="password"]', studentPass)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/)

    // Học sinh cố truy cập vào trang của giáo viên (/app/teacher/exercises)
    await page.goto('/app/teacher/exercises')
    // Route guard phải đẩy ngược về /app/dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/)
  })
})
