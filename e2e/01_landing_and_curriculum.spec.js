import { test, expect } from '@playwright/test'

test.describe('1. Landing Page & Multi-Grade Curriculum Explorer', () => {
  test('Nạp trang chủ, kiểm tra nhận diện thương hiệu BienEDU và logo', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/BienEDU/)
    
    // Logo và tiêu đề
    const logo = page.locator('img[alt="BienEDU Logo"]')
    await expect(logo).toBeVisible()
    
    // Tiêu đề K12 Toán Lớp 6 Đến Lớp 12
    await expect(page.locator('h1')).toContainText('Lớp 6 Đến Lớp 12')
  })

  test('Thử sức trực tiếp với KaTeX đa khối lớp (Lớp 6, 9, 10, 12) và xem phản hồi tức thì', async ({ page }) => {
    await page.goto('/')
    
    // 1. Kiểm tra Lớp 12 mặc định
    await expect(page.locator('div.bg-ocean-50:has-text("Toán Lớp 12")')).toBeVisible()
    // Chọn đáp án B ($m = 2$)
    await page.locator('div:has(div.bg-ocean-50:has-text("Toán Lớp 12")) button:has-text("B")').click()
    await expect(page.locator('text=Rất chính xác!')).toBeVisible()
    await page.click('button:has-text("Làm lại")')

    // 2. Chuyển sang Lớp 6
    await page.click('button:has-text("Lớp 6")')
    await expect(page.locator('div.bg-ocean-50:has-text("Toán Lớp 6")')).toBeVisible()
    // Chọn đáp án A ($41$)
    await page.locator('div:has(div.bg-ocean-50:has-text("Toán Lớp 6")) button:has-text("A")').click()
    await expect(page.locator('text=Rất chính xác!')).toBeVisible()

    // 3. Chuyển sang Lớp 9 (Vào 10)
    await page.click('button:has-text("Lớp 9 (Vào 10)")')
    await expect(page.locator('div.bg-ocean-50:has-text("Toán Lớp 9")')).toBeVisible()
    // Chọn đáp án B ($2\sqrt{10} - 3$)
    await page.locator('div:has(div.bg-ocean-50:has-text("Toán Lớp 9")) button:has-text("B")').click()
    await expect(page.locator('text=Rất chính xác!')).toBeVisible()

    // 4. Chuyển sang Lớp 10
    await page.click('button:has-text("Lớp 10")')
    await expect(page.locator('div.bg-ocean-50:has-text("Toán Lớp 10")')).toBeVisible()
    // Chọn đáp án A ($(1; 3)$)
    await page.locator('div:has(div.bg-ocean-50:has-text("Toán Lớp 10")) button:has-text("A")').click()
    await expect(page.locator('text=Rất chính xác!')).toBeVisible()
  })

  test('Điều hướng từ trang chủ đến trang Đăng ký và Đăng nhập', async ({ page }) => {
    await page.goto('/')
    
    // Bấm Đăng nhập
    await page.click('a:has-text("Đăng nhập")')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.locator('h1')).toContainText('Đăng Nhập BienEDU')

    // Chuyển sang Đăng ký
    await page.click('a[href="/auth/register"]')
    await expect(page).toHaveURL(/\/auth\/register/)
    await expect(page.locator('h1')).toContainText('Tạo Tài Khoản BienEDU')
  })
})
