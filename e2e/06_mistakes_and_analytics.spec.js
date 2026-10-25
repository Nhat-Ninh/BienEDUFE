import { test, expect } from '@playwright/test'

test.describe('6. Mistakes Notebook (Spaced Repetition) & Parent Public Report', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', '0911223344')
    await page.fill('input[type="password"]', 'Password123@')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
  })

  test('Sổ tay lỗi sai hiển thị chu kỳ Spaced Repetition 0-1-3-7 ngày và bộ lọc giai đoạn', async ({ page }) => {
    await page.goto('/app/mistakes')
    await expect(page.locator('h1')).toContainText('Sổ Tay Lỗi Sai Của Bạn')
    await expect(page.locator('text=Spaced Repetition (0 - 1 - 3 - 7 ngày)')).toBeVisible()

    // Kiểm tra các mốc chu kỳ ôn ngắt quãng
    await expect(page.locator('button:has-text("Đến hạn ôn hôm nay")')).toBeVisible()
    await expect(page.locator('button:has-text("Toàn bộ lịch sử")')).toBeVisible()
  })

  test('Bản đồ năng lực học tập và tạo liên kết báo cáo Zalo cho phụ huynh không cần đăng nhập', async ({ page }) => {
    await page.goto('/app/analytics')
    await expect(page.locator('h1')).toContainText('Báo Cáo Năng Lực & Tiến Độ Học Tập')

    // Bấm Tạo Link Gửi Phụ Huynh (Zalo)
    const shareBtn = page.locator('button:has-text("Tạo Link Chia Sẻ Zalo")')
    await expect(shareBtn).toBeVisible()
    await shareBtn.click()

    // Kiểm tra thông báo đã tạo link
    await expect(page.locator('text=Link Báo Cáo Tuần Đã Sẵn Sàng Gửi Phụ Huynh!')).toBeVisible({ timeout: 5000 })

    // Lấy link chia sẻ
    const shareInput = page.locator('input[readonly]')
    await expect(shareInput).toBeVisible()
    const shareUrl = await shareInput.inputValue()
    expect(shareUrl).toContain('/report/public/')

    // Đăng xuất và truy cập vào link báo cáo công khai dành cho phụ huynh
    await page.click('button[title="Đăng xuất"]')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Truy cập trực tiếp link phụ huynh không cần đăng nhập
    await page.goto(shareUrl)
    await expect(page).toHaveURL(/\/report\/public\//)
    await expect(page.locator('text=Báo Cáo Học Tập Tuần (Gửi Phụ Huynh)')).toBeVisible()
  })
})
