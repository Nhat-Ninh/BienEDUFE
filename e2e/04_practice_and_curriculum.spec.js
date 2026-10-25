import { test, expect } from '@playwright/test'

test.describe('4. Practice & Full K12 Curriculum Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    // Đăng nhập học sinh mẫu
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', '0911223344')
    await page.fill('input[type="password"]', 'Password123@')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
  })

  test('Duyệt cây chương trình Lớp 6, học Lý thuyết KaTeX, Bẫy sai lầm và Luyện bài tập', async ({ page }) => {
    await page.goto('/app/practice')
    await expect(page.locator('h1')).toContainText('Luyện Tập Toán Theo Khối Lớp')

    // 1. Chuyển sang Khối Lớp 6
    await page.click('button:has-text("Lớp 6")')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 6')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Chương 1: Tập Hợp Các Số Tự Nhiên')).toBeVisible()

    // 2. Mở Chương 1 và chọn dạng bài
    await page.click('button:has-text("Chương 1: Tập Hợp Các Số Tự Nhiên")')
    const unitBtn = page.locator('button:has-text("Dạng 1: Tính giá trị biểu thức")')
    await expect(unitBtn).toBeVisible()
    await unitBtn.click()

    // 3. Kiểm tra Tab Lý Thuyết Cốt Lõi
    await page.click('button:has-text("Lý Thuyết Cốt Lõi")')
    await expect(page.locator('text=Phương Pháp Giải & Lý Thuyết Cốt Lõi')).toBeVisible()
    // Kiểm tra công thức toán KaTeX đã render
    await expect(page.locator('.katex').first()).toBeVisible()

    // 4. Kiểm tra Tab Bẫy Sai Lầm Thường Gặp
    await page.click('button:has-text("Bẫy Sai Lầm Thường Gặp")')
    await expect(page.locator('text=Nhận Diện Các Bẫy Sai Lầm')).toBeVisible()

    // 5. Quay lại Tab Luyện Bài Tập và làm bài
    await page.click('button:has-text("Luyện Bài Tập")')
    await expect(page.locator('span:has-text("Câu 1 •")').first()).toBeVisible()
    // Bấm chọn đáp án A
    await page.locator('button:has(span:text-is("A"))').first().click()
    // Bấm Kiểm Tra Đáp Án
    await page.click('button:has-text("Kiểm Tra Đáp Án")')
    await expect(page.locator('text=Đã ghi nhận câu trả lời của bạn!')).toBeVisible()
  })

  test('Duyệt cây chương trình Lớp 9 Ôn Thi Vào 10 và Lớp 12 Luyện Thi THPT', async ({ page }) => {
    await page.goto('/app/practice')

    // 1. Chuyển sang Lớp 9
    await page.click('button:has-text("Lớp 9")')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 9')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Chương 1: Căn Thức Bậc Hai')).toBeVisible()

    // 2. Chuyển sang Lớp 12
    await page.click('button:has-text("Lớp 12")')
    await expect(page.locator('text=Mục Lục Chương Trình Lớp 12')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Chương 1: Ứng Dụng Đạo Hàm Khảo Sát Hàm Số')).toBeVisible()
  })
})
