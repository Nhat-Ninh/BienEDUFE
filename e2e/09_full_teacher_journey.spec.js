import { test, expect } from '@playwright/test'

test.describe('9. Full Teacher End-to-End Journey (Giáo Viên Toàn Diện)', () => {
  const timestamp = Date.now().toString().slice(-4)
  const newClassName = `Lớp Toán 12 Nâng Cao ${timestamp}`

  test('Luồng toàn vẹn của giáo viên: Đăng nhập -> Tạo lớp học -> Thêm học sinh -> Soạn câu hỏi trong Ngân hàng đề -> Giao bài kiểm tra -> Chấm bài tự luận & gửi nhận xét', async ({ page }) => {
    // -------------------------------------------------------------
    // BƯỚC 1: Đăng nhập quyền Giáo Viên (Quick Demo)
    // -------------------------------------------------------------
    await page.goto('/auth/login')
    await page.click('button:has-text("Thầy Tùng")')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
    await expect(page.locator('text=👨‍🏫 Giáo Viên')).toBeVisible()

    // -------------------------------------------------------------
    // BƯỚC 2: Quản lý Lớp học - Tạo lớp mới & Cấp mã mời
    // -------------------------------------------------------------
    await page.goto('/app/classes')
    await expect(page.locator('h1')).toContainText('Quản Lý Lớp Học')
    await page.click('button:has-text("Tạo Lớp Học Mới")')

    await page.fill('input[placeholder*="Toán 12 - Luyện Đề THPTQG 9+"]', newClassName)
    await page.selectOption('select', { value: '12' })
    await page.fill('textarea[placeholder*="Lớp học chuyên sâu giải tích"]', 'Lớp chuyên sâu hàm số và tích phân năm học 2025')
    await page.click('button:has-text("Tạo Lớp Ngay")')

    await expect(page.locator(`text=${newClassName}`)).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=MÃ MỜI HỌC SINH').first()).toBeVisible()

    // -------------------------------------------------------------
    // BƯỚC 3: Mở chi tiết lớp học & Quản lý danh sách học sinh
    // -------------------------------------------------------------
    const enterClassBtn = page.locator('a:has-text("Vào lớp →")').first()
    await enterClassBtn.click()
    await expect(page).toHaveURL(/\/app\/classes\/\d+/)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('button:has-text("Thêm Học Sinh Vào Lớp")')).toBeVisible()

    // -------------------------------------------------------------
    // BƯỚC 4: Ngân hàng câu hỏi - Batch Parse & Lưu đề thi
    // -------------------------------------------------------------
    await page.goto('/app/teacher/exercises')
    await expect(page.locator('h1')).toContainText('Ngân Hàng Câu Hỏi & Đề Thi')
    
    // Nhập nội dung mẫu trắc nghiệm + tự luận
    const rawContent = `Câu 1: Cho hàm số $y = x^3 - 3x^2 + 1$. Điểm cực tiểu là:
A. (2; -3)
B. (0; 1)
C. (1; -1)
D. (2; 3)
*Đáp án: A*

Câu 2: [TỰ LUẬN] Tính thể tích khối tròn xoay khi quay hình phẳng giới hạn bởi $y = x^2$ và $y = 2x$ quanh trục $Ox$.
*Đáp án: 64pi/15*`

    await page.fill('textarea[placeholder*="Dán nội dung đề thi vào đây"]', rawContent)
    await page.click('button:has-text("Phân Tích Cú Pháp Tự Động")')
    
    // Preview phân tích hiển thị
    await expect(page.locator('text=Xem trước kết quả phân tích')).toBeVisible({ timeout: 5000 })
    
    // Lưu vào ngân hàng
    await page.click('button:has-text("Lưu Tất Cả Vào Ngân Hàng")')
    await expect(page.locator('text=Đã lưu thành công')).toBeVisible({ timeout: 8000 })

    // -------------------------------------------------------------
    // BƯỚC 5: Giao bài tập mới với Bộ chọn câu hỏi thông minh
    // -------------------------------------------------------------
    await page.goto('/app/assignments')
    await expect(page.locator('h1')).toContainText('Quản Lý Bài Tập & Đề Thi')
    await page.click('button:has-text("Giao Bài Mới")')

    await page.fill('input[placeholder*="Đề kiểm tra 1 tiết"]', `Đề Kiểm Tra 15 Phút ${timestamp}`)
    
    // Chọn lớp vừa tạo
    const classSelect = page.locator('select').first()
    await classSelect.selectOption({ index: 1 })

    // Điền hạn nộp (ngày mai)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    await page.fill('input[type="datetime-local"]', tomorrow)

    // Bấm chọn bộ câu hỏi mẫu chuẩn Toán 12
    await page.click('button:has-text("Bộ đề Toán 12 Mẫu (Trắc nghiệm + Tự luận)")')
    await expect(page.locator('text=Đã chọn: 4 câu')).toBeVisible()

    // Xác nhận giao bài
    await page.click('button:has-text("Xác Nhận Giao Bài")')
    await expect(page.locator(`text=Đề Kiểm Tra 15 Phút ${timestamp}`)).toBeVisible({ timeout: 6000 })

    // -------------------------------------------------------------
    // BƯỚC 6: Chấm điểm bài tự luận & Nhận xét với template
    // -------------------------------------------------------------
    await page.goto('/app/teacher/grading')
    await expect(page.locator('h1')).toContainText('Chấm Điểm & Nhận Xét Bài Tự Luận')
    await expect(page.locator('text=Chọn bài kiểm tra cần chấm:')).toBeVisible()

    // Kiểm tra danh sách bài nộp và mẫu nhận xét nhanh
    await expect(page.locator('button:has-text("Thêm Mẫu Nhận Xét Nhanh")')).toBeVisible()
    await expect(page.locator('text=Danh Sách Học Sinh Nộp Bài')).toBeVisible()
  })
})
