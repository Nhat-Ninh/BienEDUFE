import { test, expect } from '@playwright/test'

test.describe('10. PDF Course Materials, Smart Exam Parser & Quiz Tracking (Tài liệu PDF & Bài kiểm tra theo bài học)', () => {
  const timestamp = Date.now().toString().slice(-6)
  const lessonTitle = `Chuyên đề ${timestamp}: Đạo hàm & Khảo sát hàm số`

  test('Luồng toàn vẹn: Giáo viên tải PDF Lý thuyết & Bài tập -> Bóc tách đề thi PDF thông minh -> Học sinh học & làm kiểm tra -> Giảng viên tracking bảng điểm và ma trận câu hỏi', async ({ page }) => {
    // -----------------------------------------------------------------
    // PHẦN 1: GIÁO VIÊN ĐĂNG NHẬP VÀ VÀO QUẢN LÝ BÀI HỌC & TÀI LIỆU PDF
    // -----------------------------------------------------------------
    await page.goto('/auth/login')
    await page.fill('input[type="text"]', '0987654321')
    await page.fill('input[type="password"]', 'Password123@')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
    await expect(page.locator('text=👨‍🏫 Giáo Viên')).toBeVisible()

    // Bấm vào mục "Tài liệu PDF & Bài học" trên Sidebar
    await page.click('a:has-text("Tài liệu PDF & Bài học")')
    await expect(page).toHaveURL(/\/app\/teacher\/lessons/)
    await expect(page.locator('h1')).toContainText('Quản Lý Tài Liệu PDF & Bài Học')

    // -----------------------------------------------------------------
    // PHẦN 2: GIÁO VIÊN TẠO BÀI HỌC VỚI 2 PHẦN RIÊNG: LÝ THUYẾT PDF & BÀI TẬP PDF
    // -----------------------------------------------------------------
    await page.click('[data-testid="add-lesson-btn"]')
    await expect(page.locator('h3:has-text("Thêm Bài Học & Tài Liệu PDF Mới")')).toBeVisible()

    // Điền tiêu đề bài học và chọn lớp
    await page.fill('input[placeholder*="Chuyên đề 1:"]', lessonTitle)
    await page.fill('textarea[placeholder*="Tóm tắt nội dung bài học"]', 'Bài học cung cấp nền tảng đạo hàm và 10 bài tập tự luyện kèm đề kiểm tra 15 phút.')

    // Phần 1: Lý Thuyết
    await page.fill('input[placeholder*="Hoặc dán URL file PDF lý thuyết"]', '/api/v1/files/download/demo_theory.pdf')
    await page.fill('textarea[placeholder*="Công thức đạo hàm"]', 'Công thức đạo hàm hàm hợp: $(f(u))\' = u\' \\cdot f\'(u)$')

    // Phần 2: Bài Tập
    await page.fill('input[placeholder*="Hoặc dán URL file PDF bài tập"]', '/api/v1/files/download/demo_exercise.pdf')
    await page.fill('textarea[placeholder*="Hoàn thành bài 1"]', 'Làm các câu từ 1 đến 10 trong file PDF trước thứ Bảy.')

    // Bấm Lưu bài học
    await page.click('button:has-text("Lưu Bài Học & Gán Cho Lớp")')
    await expect(page.locator('text=Tạo bài học & tài liệu PDF thành công!')).toBeVisible({ timeout: 6000 })

    // Kiểm tra card bài học xuất hiện trên UI với đầy đủ 3 phần
    await expect(page.locator(`h3:has-text("${lessonTitle}")`)).toBeVisible()
    await expect(page.locator('text=1. Tài Liệu Lý Thuyết').first()).toBeVisible()
    await expect(page.locator('text=2. Bài Tập Tự Luyện').first()).toBeVisible()
    await expect(page.locator('text=3. Bài Kiểm Tra Lý Thuyết').first()).toBeVisible()

    // -----------------------------------------------------------------
    // PHẦN 3: GIÁO VIÊN DÙNG TOOL BÓC TÁCH ĐỀ THI TỪ PDF & CHỌN ĐÁP ÁN TRÊN UI
    // -----------------------------------------------------------------
    await page.locator(`div:has(h3:has-text("${lessonTitle}"))`).locator('button:has-text("Tạo Bài Kiểm Tra Từ PDF ⚡")').first().click()
    await expect(page.locator('h2:has-text("Tạo Bài Kiểm Tra Cho Bài Học")')).toBeVisible()

    // Sử dụng tính năng nạp đề thi trắc nghiệm mẫu (mô phỏng trích xuất từ PDF)
    await page.click('button:has-text("Dùng Đề Mẫu Toán 12")')
    await expect(page.locator('textarea')).toHaveValue(/Câu 1:/)

    // Bấm nút "Bóc Tách Câu Hỏi Tự Động"
    await page.click('button:has-text("Bóc Tách Câu Hỏi Tự Động")')

    // Chuyển sang Bước 2: Visual Editor & Answer Picker
    await expect(page.locator('text=4 câu hỏi')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('span:text-is("Câu 1")')).toBeVisible()
    await expect(page.locator('span:text-is("Câu 2")')).toBeVisible()

    // Thử tương tác click đổi đáp án trực tiếp trên UI
    const choiceB = page.locator('div:has(div:text-is("B"))').first()
    if (await choiceB.isVisible()) {
      await choiceB.click()
    }
    const choiceA = page.locator('div:has(div:text-is("A"))').first()
    if (await choiceA.isVisible()) {
      await choiceA.click()
    }

    // Bấm Lưu & Xuất bản bài kiểm tra cho lớp
    await page.click('button:has-text("Lưu & Xuất Bản Cho Lớp")')
    await expect(page.locator('text=Xuất bản bài kiểm tra thành công!')).toBeVisible({ timeout: 6000 })

    // Sau khi xuất bản: Bài học hiện nút "Xem Bảng Điểm & Tracking"
    await expect(page.locator(`div:has(h3:has-text("${lessonTitle}"))`).locator('button:has-text("Xem Bảng Điểm & Tracking")').first()).toBeVisible({ timeout: 6000 })

    // -----------------------------------------------------------------
    // PHẦN 4: HỌC SINH VÀO LỚP HỌC XEM TÀI LIỆU VÀ LÀM BÀI KIỂM TRA
    // -----------------------------------------------------------------
    // Đăng xuất giáo viên
    await page.click('button[title="Đăng xuất"]')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Đăng nhập học sinh
    await page.fill('input[type="text"]', '0911223344')
    await page.fill('input[type="password"]', 'Password123@')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
    await expect(page.locator('text=🎓 Học Sinh')).toBeVisible()

    // Học sinh vào danh sách lớp học
    await page.goto('/app/classes')
    const viewClassBtn = page.locator('a:has-text("Vào Lớp Học")').first()
    if (await viewClassBtn.isVisible()) {
      await viewClassBtn.click()
      await expect(page).toHaveURL(/\/app\/classes\/\d+/)

      // Kiểm tra Tab "Tài Liệu & Bài Học" hiển thị
      await expect(page.locator('[data-testid="tab-lessons"]')).toBeVisible()
      await page.click('[data-testid="tab-lessons"]')

      // Học sinh thấy bài học có 3 phần
      await expect(page.locator('text=1. Lý Thuyết')).toBeVisible()
      await expect(page.locator('text=2. Bài Tập Tự Luyện')).toBeVisible()

      // Học sinh bấm làm bài kiểm tra nếu có nút "Làm Bài Kiểm Tra Ngay"
      const takeQuizBtn = page.locator('a:has-text("Làm Bài Kiểm Tra Ngay")').first()
      if (await takeQuizBtn.isVisible()) {
        await takeQuizBtn.click()
        await expect(page).toHaveURL(/\/app\/assignments\/\d+\/do/)

        // Học sinh chọn đáp án A cho câu đầu tiên
        const optionA = page.locator('button:has(span:text-is("A"))').first()
        if (await optionA.isVisible()) {
          await optionA.click()
        }

        // Nộp bài
        await page.click('button:has-text("Nộp Bài")')
        await page.click('button:has-text("Nộp Bài Luôn")')

        // Kết quả điểm hiển thị
        await expect(page).toHaveURL(/\/app\/submissions\/\d+/, { timeout: 10000 })
        await expect(page.locator('text=Báo Cáo Điểm & Đánh Giá')).toBeVisible()
      }
    }

    // -----------------------------------------------------------------
    // PHẦN 5: GIÁO VIÊN THEO DÕI TRACKING & MA TRẬN ĐỘ CHÍNH XÁC CÂU HỎI
    // -----------------------------------------------------------------
    await page.click('button[title="Đăng xuất"]')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Đăng nhập lại giáo viên
    await page.fill('input[type="text"]', '0987654321')
    await page.fill('input[type="password"]', 'Password123@')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/)

    // Vào lại trang quản lý bài học
    await page.goto('/app/teacher/lessons')
    const trackingBtn = page.locator('button:has-text("Xem Bảng Điểm & Tracking")').first()
    if (await trackingBtn.isVisible()) {
      await trackingBtn.click()

      // Modal Tracking mở ra
      await expect(page.locator('h2:has-text("Chuyên đề")')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=Tỷ lệ hoàn thành')).toBeVisible()
      await expect(page.locator('text=Điểm trung bình')).toBeVisible()

      // Chuyển sang Tab Ma trận câu hỏi
      await page.click('button:has-text("Ma Trận Câu Hỏi & Bẫy Sai Lầm")')
      await expect(page.locator('text=Tỷ lệ làm đúng')).toBeVisible()

      // Đóng modal
      await page.click('button:has-text("Đóng")')
    }
  })
})
