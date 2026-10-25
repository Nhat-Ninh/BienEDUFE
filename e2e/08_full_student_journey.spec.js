import { test, expect } from '@playwright/test'

test.describe('8. Full Student End-to-End Journey (Học Sinh Toàn Diện)', () => {
  const timestamp = Date.now().toString().slice(-6)
  const studentPhone = `0988${timestamp}`
  const studentPass = 'Student@2025'
  const studentName = `Học Sinh E2E ${timestamp}`

  test('Luồng toàn vẹn của học sinh: Đăng ký -> Mua gói VIP VietQR -> Gia nhập lớp -> Làm bài trắc nghiệm & tự luận -> Xem kết quả & Bẫy sai lầm -> Sổ tay Spaced Repetition -> Báo cáo Zalo', async ({ page }) => {
    // -------------------------------------------------------------
    // BƯỚC 1: Khách hàng truy cập Landing page & Bảng giá
    // -------------------------------------------------------------
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Dạy & Học Toán')
    
    // Điều hướng sang trang Bảng giá công khai
    await page.click('a:has-text("Bảng giá")')
    await expect(page).toHaveURL(/\/pricing/)
    await expect(page.locator('h1')).toContainText('Chọn Gói Đồng Hành Cùng BienEDU')
    await expect(page.locator('text=Gói Chuyên Sâu Học Kỳ')).toBeVisible()

    // -------------------------------------------------------------
    // BƯỚC 2: Đăng ký tài khoản học sinh mới
    // -------------------------------------------------------------
    await page.click('button:has-text("Bắt Đầu Học Thử Miễn Phí")')
    await expect(page).toHaveURL(/\/auth\/register/)

    await page.fill('input[placeholder*="Nguyễn Văn An"]', studentName)
    await page.fill('input[placeholder*="0912345678"]', studentPhone)
    await page.fill('input[placeholder*="an.nguyen@example.com"]', `student_${timestamp}@gmail.com`)
    await page.fill('input[type="password"]', studentPass)
    
    // Chọn role Học Sinh
    await page.click('button:has-text("Học Sinh / Luyện Thi")')
    await page.click('button[type="submit"]')

    // Đăng ký thành công và tự động chuyển đến Dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
    await expect(page.locator('text=🎓 Học Sinh')).toBeVisible()

    // Kiểm tra đúng trạng thái học sinh mới chưa mua gói:
    // 1. Navbar hiển thị nút 'Mua khóa học'
    await expect(page.locator('[data-testid="navbar-buy-plan-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="navbar-buy-plan-btn"]')).toContainText('Mua khóa học')

    // 2. Dashboard hiển thị Onboarding banner chào mừng & nhắc kích hoạt gói
    await expect(page.locator('[data-testid="onboarding-no-plan-banner"]')).toBeVisible()
    await expect(page.locator('text=Chào mừng bạn đến với BienEDU! Bạn chưa kích hoạt gói học')).toBeVisible()

    // 3. Các chỉ số KPI trung thực với tài khoản mới: 0 lớp, 0 bài, 0 câu lỗi sai, 0%
    await expect(page.locator('text=0 lớp')).toBeVisible()
    await expect(page.locator('text=0 bài')).toBeVisible()
    await expect(page.locator('text=0 câu')).toBeVisible()
    await expect(page.locator('text=0%')).toBeVisible()

    // 4. Danh sách bài tập & Bản đồ năng lực hiển thị empty state truyền cảm hứng
    await expect(page.locator('text=Chưa có bài tập nào được giao')).toBeVisible()
    await expect(page.locator('text=Chưa có dữ liệu năng lực')).toBeVisible()

    // -------------------------------------------------------------
    // BƯỚC 3: Học sinh click 'Mua khóa học' từ Navbar hoặc Dashboard để nâng cấp VIP
    // -------------------------------------------------------------
    await page.click('[data-testid="navbar-buy-plan-btn"]')
    await expect(page).toHaveURL(/\/app\/subscription/)
    await expect(page.locator('h1')).toContainText('Gói Hội Viên Học Tập BienEDU VIP')
    await expect(page.locator('text=Bảng Giá Gói Học Tập BienEDU')).toBeVisible()

    // Chọn Gói Chuyên Sâu Học Kỳ (650.000đ)
    await page.getByRole('button', { name: 'Đăng Ký Ngay' }).first().click()

    // Modal VietQR hiển thị
    await expect(page.locator('text=Quét Mã VietQR Để Kích Hoạt')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('img[alt="VietQR Chuyển khoản"]')).toBeVisible()
    await expect(page.locator('text=Techcombank')).toBeVisible()
    await expect(page.locator('text=19036573889019')).toBeVisible()

    // Bấm nút mô phỏng xác nhận chuyển khoản thành công
    await page.click('button:has-text("Tôi Đã Chuyển Khoản Xong (Kích Hoạt Tức Thì)")')
    await expect(page.locator('text=Thanh toán xác nhận thành công')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Đang Hoạt Động (VIP)')).toBeVisible()

    // Navbar lập tức cập nhật hiển thị tên gói VIP đã mua
    await expect(page.locator('[data-testid="navbar-plan-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="navbar-plan-badge"]')).toContainText('Gói Chuyên Sâu Học Kỳ')

    // Quay lại Dashboard kiểm tra Active Plan Banner
    await page.goto('/app/dashboard')
    await expect(page.locator('[data-testid="active-plan-banner"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-plan-banner"]')).toContainText('Gói Chuyên Sâu Học Kỳ')

    // -------------------------------------------------------------
    // BƯỚC 4: Học sinh tham gia lớp học qua Mã mời
    // -------------------------------------------------------------
    await page.goto('/app/classes')
    await page.click('button:has-text("Nhập Mã Vào Lớp")')
    
    // Nhập mã mời mẫu lớp Toán 12 (ví dụ: CLASS12, BIEN12 hoặc mã mặc định)
    await page.fill('input[placeholder*="Ví dụ: BIEN12A"]', 'CLASS12')
    await page.click('button:has-text("Xác Nhận Vào Lớp")')

    // -------------------------------------------------------------
    // BƯỚC 5: Học sinh làm bài kiểm tra & nộp bài
    // -------------------------------------------------------------
    await page.goto('/app/assignments')
    await expect(page.locator('h1')).toContainText('Bài Tập & Đề Thi')

    const doBtn = page.locator('a:has-text("Vào Làm Bài")').first()
    if (await doBtn.isVisible()) {
      await doBtn.click()
      await expect(page).toHaveURL(/\/app\/assignments\/\d+\/do/)
      
      // Đồng hồ bấm giờ và các câu hỏi hiện diện
      await expect(page.locator('button:has-text("Nộp Bài")')).toBeVisible()

      // Chọn đáp án trắc nghiệm A cho câu 1
      const choiceA = page.locator('button:has(span:text-is("A"))').first()
      if (await choiceA.isVisible()) {
        await choiceA.click()
      }

      // Nếu có câu tự luận, điền lời giải
      const essayInput = page.locator('textarea[placeholder*="Trình bày các bước giải toán"]')
      if (await essayInput.isVisible()) {
        await essayInput.fill('Bước 1: Tính đạo hàm y\' = 3x^2 - 6x. Cho y\' = 0 <=> x = 0 hoặc x = 2. Bước 2: Lập bảng biến thiên và kết luận điểm cực đại là (0; 2).')
      }

      // Nộp bài
      await page.click('button:has-text("Nộp Bài")')
      await page.click('button:has-text("Nộp Bài Luôn")')

      // -------------------------------------------------------------
      // BƯỚC 6: Xem kết quả nộp bài & Bẫy sai lầm
      // -------------------------------------------------------------
      await expect(page).toHaveURL(/\/app\/submissions\/\d+/, { timeout: 10000 })
      await expect(page.locator('text=Báo Cáo Điểm & Đánh Giá')).toBeVisible()
      await expect(page.locator('text=Tổng Điểm Đạt Được')).toBeVisible()
    }

    // -------------------------------------------------------------
    // BƯỚC 7: Sổ tay lỗi sai Spaced Repetition (0-1-3-7)
    // -------------------------------------------------------------
    await page.goto('/app/mistakes')
    await expect(page.locator('h1')).toContainText('Sổ Tay Lỗi Sai Của Bạn')
    await expect(page.locator('text=Phương pháp Spaced Repetition')).toBeVisible()

    // -------------------------------------------------------------
    // BƯỚC 8: Báo cáo năng lực & Liên kết Zalo phụ huynh
    // -------------------------------------------------------------
    await page.goto('/app/analytics')
    await expect(page.locator('h1')).toContainText('Báo Cáo Năng Lực & Tiến Độ Học Tập')
    await expect(page.locator('button:has-text("Tạo Link Chia Sẻ Zalo")')).toBeVisible()
    
    await page.click('button:has-text("Tạo Link Chia Sẻ Zalo")')
    await expect(page.locator('text=Link Báo Cáo Tuần Đã Sẵn Sàng Gửi Phụ Huynh!')).toBeVisible({ timeout: 5000 })
  })
})
