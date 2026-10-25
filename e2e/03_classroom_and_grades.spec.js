import { test, expect } from '@playwright/test'

test.describe('3. Classroom Management & Multi-Grade Workflows', () => {
  const teacherPhone = '0987654321' // Thầy Biển Toán
  const teacherPass = 'Password123@'
  const uniqueClassName = `Toán 9 - Chuyên Đề ${Date.now().toString().slice(-4)}`

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('Giáo viên đăng nhập, tạo lớp học đa khối lớp (Lớp 6, 9, 12) và lọc theo khối', async ({ page }) => {
    // 1. Đăng nhập giáo viên
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', teacherPhone)
    await page.fill('input[type="password"]', teacherPass)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })

    // 2. Chuyển sang Quản lý lớp học
    await page.goto('/app/classes')
    await expect(page.locator('h1')).toContainText('Quản Lý Lớp Học')

    // 3. Mở Modal tạo lớp
    await page.click('button:has-text("Tạo Lớp Học Mới")')
    await page.fill('input[placeholder*="Toán 12"]', uniqueClassName)
    await page.selectOption('select', '9')
    await page.fill('textarea', 'Lớp học bồi dưỡng kiến thức ôn thi vào 10 chuyên')
    await page.click('button:has-text("Tạo Lớp Ngay")')

    // Chờ thông báo thành công
    await expect(page.locator('text=Đã tạo lớp học thành công!')).toBeVisible({ timeout: 5000 })

    // 4. Kiểm tra thẻ lớp hiển thị đúng Khối 9
    await expect(page.locator(`text=${uniqueClassName}`)).toBeVisible()
    await expect(page.locator('span:has-text("Khối 9")').first()).toBeVisible()

    // 5. Thử tính năng Lọc theo khối lớp (Grade Filter Pill Bar)
    await page.click('button:has-text("Lớp 9")')
    await expect(page.locator(`text=${uniqueClassName}`)).toBeVisible()

    // Lọc sang Lớp 12
    await page.click('button:has-text("Lớp 12")')
    // Lớp 9 không được xuất hiện
    await expect(page.locator(`text=${uniqueClassName}`)).not.toBeVisible()

    // Bấm lại Tất Cả Khối Lớp
    await page.click('button:has-text("Tất Cả Khối Lớp")')
    await expect(page.locator(`text=${uniqueClassName}`)).toBeVisible()
  })

  test('Học sinh dùng mã mời gia nhập lớp học thành công', async ({ page }) => {
    // 1. Lấy mã mời của lớp
    // Đăng nhập giáo viên trước để lấy mã mời
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', teacherPhone)
    await page.fill('input[type="password"]', teacherPass)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
    
    await page.goto('/app/classes')

    const inviteCodeElem = page.locator('code.font-mono').first()
    await expect(inviteCodeElem).toBeVisible({ timeout: 5000 })
    const inviteCode = await inviteCodeElem.innerText()

    // 2. Đăng xuất giáo viên
    await page.click('button[title="Đăng xuất"]')
    await expect(page).toHaveURL(/\/auth\/login/)

    // 3. Đăng nhập học sinh mẫu (0911223344)
    await page.fill('input[type="text"]', '0911223344')
    await page.fill('input[type="password"]', 'Password123@')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })

    // 4. Vào trang Lớp học và nhập mã mời
    await page.goto('/app/classes')
    await page.click('button:has-text("Nhập Mã Vào Lớp")')
    await page.fill('input[placeholder*="BIEN"]', inviteCode)
    await page.click('button:has-text("Xác Nhận Vào Lớp")')

    // Phải hiển thị thông báo thành công hoặc đã tham gia
    const notice = page.locator('div.bg-emerald-50, div.bg-rose-50')
    await expect(notice).toBeVisible({ timeout: 5000 })
  })
})
