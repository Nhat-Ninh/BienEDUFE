import { test, expect } from '@playwright/test'

const login = async (page, phone) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/auth/login')
  await page.fill('input[type="text"]', phone)
  await page.fill('input[type="password"]', 'Password123@')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
}

test.describe('4. Practice & Full K12 Curriculum Browser', () => {
  test('Giáo viên duyệt cây chương trình Lớp 6, học Lý thuyết KaTeX, Bẫy sai lầm và Luyện bài tập', async ({ page }) => {
    await login(page, '0987654321')
    await page.goto('/app/practice')
    await expect(page.locator('h1')).toContainText('Luyện Tập Toán Theo Khối Lớp')

    await page.click('button:has-text("Lớp 6")')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 6')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Chương 1: Tập Hợp Các Số Tự Nhiên')).toBeVisible()

    await page.click('button:has-text("Chương 1: Tập Hợp Các Số Tự Nhiên")')
    const unitBtn = page.locator('button:has-text("Dạng 1: Tính giá trị biểu thức")')
    await expect(unitBtn).toBeVisible()
    await unitBtn.click()

    await page.click('button:has-text("Lý Thuyết Cốt Lõi")')
    await expect(page.locator('text=Phương Pháp Giải & Lý Thuyết Cốt Lõi')).toBeVisible()
    await expect(page.locator('.katex').first()).toBeVisible()

    await page.click('button:has-text("Bẫy Sai Lầm Thường Gặp")')
    await expect(page.locator('text=Nhận Diện Các Bẫy Sai Lầm')).toBeVisible()

    await page.click('button:has-text("Luyện Bài Tập")')
    await expect(page.locator('span:has-text("Câu 1 •")').first()).toBeVisible()
    await page.locator('button:has(span:text-is("A"))').first().click()
    await page.click('button:has-text("Kiểm Tra Đáp Án")')
    await expect(page.locator('text=Đã ghi nhận câu trả lời của bạn!')).toBeVisible()
  })

  test('Giáo viên duyệt cây chương trình Lớp 9 Ôn Thi Vào 10 và Lớp 12 Luyện Thi THPT', async ({ page }) => {
    await login(page, '0987654321')
    await page.goto('/app/practice')

    await page.click('button:has-text("Lớp 9")')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 9')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Chương 1: Căn Thức Bậc Hai')).toBeVisible()

    await page.click('button:has-text("Lớp 12")')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 12')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Chương 1: Ứng Dụng Đạo Hàm Khảo Sát Hàm Số')).toBeVisible()
  })

  test('Học sinh khối 12 chỉ thấy Luyện tập khối 12, không có nút chuyển khối khác', async ({ page }) => {
    await login(page, '0911223344')
    await page.goto('/app/practice')
    await expect(page.locator('[data-testid="practice-title"]')).toContainText('Lớp 12')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 12')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="grade-selector"] button')).toHaveCount(1)
    await expect(page.locator('[data-testid="practice-grade-6"]')).toHaveCount(0)
  })
})
