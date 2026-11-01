import { test, expect } from '@playwright/test'

test.describe('5. Teacher Exercise Bank & Essay Grading', () => {
  const teacherPhone = '0987654321'
  const teacherPass = 'Password123@'

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', teacherPhone)
    await page.fill('input[type="password"]', teacherPass)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
  })

  test('Giáo viên sử dụng công cụ Batch Parse đề thi tự động với chọn khối lớp', async ({ page }) => {
    await page.goto('/app/teacher/exercises')
    await expect(page.locator('h1')).toContainText('Ngân Hàng Câu Hỏi & Đề Thi')

    // 1. Chọn Khối Lớp 9 rồi chọn dạng bài của khối đó
    await page.selectOption('[data-testid="bank-grade"]', '9')
    await expect(page.locator('[data-testid="bank-unit"] option').nth(1)).toBeAttached({ timeout: 8000 })
    await page.fill('textarea[placeholder*="Dán nội dung đề thi vào đây"]', String.raw`Câu 1. Rút gọn biểu thức $P = \\sqrt{(3 - \\sqrt{10})^2} + \\sqrt{10}$ ta được
A. 3.
B. 2\\sqrt{10} - 3.
C. 3 - 2\\sqrt{10}.
D. -3.

Câu 2. Phương trình x^2 - 5x + 6 = 0 có tổng hai nghiệm bằng
A. 5.
B. -5.
C. 6.
D. -6.`)
    
    // 2. Bấm Phân Tích Cú Pháp Tự Động
    await page.click('button:has-text("Phân Tích Cú Pháp Tự Động")')
    
    // 3. Chờ phân tích và kiểm tra các câu hỏi render KaTeX ở cột bên phải
    await expect(page.locator('text=Đã phân tích thành công')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('span:has-text("Câu hỏi 1")')).toBeVisible()
    await expect(page.locator('span:has-text("Câu hỏi 2")')).toBeVisible()
    await expect(page.locator('button:has-text("Lưu Tất Cả Vào Ngân Hàng")')).toBeVisible()
  })

  test('Giáo viên truy cập bàn chấm bài tự luận với mẫu nhận xét nhanh', async ({ page }) => {
    await page.goto('/app/teacher/grading')
    await expect(page.locator('h1')).toContainText('Chấm Điểm & Nhận Xét Bài Tự Luận')
    await expect(page.locator('text=Soi chi tiết bài giải tự luận và sử dụng mẫu nhận xét nhanh thông minh')).toBeVisible()
    await expect(page.locator('button:has-text("Thêm Mẫu Nhận Xét Nhanh")')).toBeVisible()
  })
})
