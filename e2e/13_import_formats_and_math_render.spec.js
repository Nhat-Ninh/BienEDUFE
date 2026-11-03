import { test, expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const templates = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/templates')

async function loginAsTeacher(page) {
  await page.goto('/auth/login')
  await page.fill('input[type="text"]', '0987654321')
  await page.fill('input[type="password"]', 'Password123@')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
  await page.goto('/app/teacher/lessons')
  await expect(page.locator('h1')).toContainText('Quản Lý Tài Liệu PDF & Bài Học')
  // Chờ danh sách lớp tải xong (ô chọn lớp có ít nhất một lớp ngoài mục "Tất cả")
  await expect(page.locator('select').first().locator('option')).not.toHaveCount(1, { timeout: 10000 })
}

test.describe('13. Nhập đề từ Word / Markdown / LaTeX và hiển thị công thức an toàn', () => {
  test('Bài tập tự luyện: chọn file Word, máy chủ bóc tách và hiển thị công thức KaTeX', async ({ page }) => {
    await loginAsTeacher(page)
    await page.click('[data-testid="add-lesson-btn"]')

    await page.setInputFiles('[data-testid="exercise-file-input"]', path.join(templates, 'Mau-Bai-Kiem-Tra.docx'))
    await expect(page.locator('[data-testid="exercise-parse-info"]')).toContainText('Đã bóc tách 5 câu hỏi', { timeout: 10000 })
    // Công thức Word (Equation) đã thành LaTeX và được KaTeX vẽ ra
    await expect(page.locator('.max-h-48 .katex').first()).toBeVisible()
  })

  test('Bài kiểm tra: nhận file Markdown và LaTeX (ex_test) như PDF', async ({ page }) => {
    await loginAsTeacher(page)
    // Cần ít nhất một bài học: tạo nhanh
    const title = `Bài nhập đa định dạng ${Date.now().toString().slice(-6)}`
    await page.click('[data-testid="add-lesson-btn"]')
    await page.fill('input[placeholder*="Chuyên đề 1:"]', title)
    await page.click('button:has-text("Lưu Bài Học & Gán Cho Lớp")')
    await expect(page.locator(`h3:has-text("${title}")`)).toBeVisible({ timeout: 8000 })

    for (const file of ['Mau-Bai-Kiem-Tra.md', 'Mau-Bai-Kiem-Tra.tex']) {
      await page.locator(`div:has(h3:has-text("${title}"))`).locator('button:has-text("Tạo Bài Kiểm Tra Từ PDF ⚡")').first().click()
      await page.setInputFiles('[data-testid="quiz-pdf-input"]', path.join(templates, file))
      await expect(page.locator('text=5 câu hỏi')).toBeVisible({ timeout: 10000 })
      // Cả 5 câu đều đủ đáp án nên không có cảnh báo "thiếu đáp án"
      await expect(page.locator('text=câu thiếu đáp án')).toHaveCount(0)
      await page.click('button:has-text("Đóng")')
    }
  })

  test('Định dạng không hỗ trợ bị từ chối ngay với thông báo rõ ràng', async ({ page }) => {
    await loginAsTeacher(page)
    await page.click('[data-testid="add-lesson-btn"]')
    await page.setInputFiles('[data-testid="theory-file-input"]', {
      name: 'de.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ....')
    })
    await expect(page.locator('text=Chỉ nhận file PDF, Word')).toBeVisible()
  })

  test('Nội dung có HTML nguy hiểm không được chạy; công thức giữ nguyên dấu * và _', async ({ page }) => {
    await loginAsTeacher(page)
    await page.click('[data-testid="add-lesson-btn"]')
    await page.setInputFiles('[data-testid="exercise-file-input"]', path.join(templates, 'Mau-Bai-Kiem-Tra.md'))
    await expect(page.locator('[data-testid="exercise-parse-info"]')).toBeVisible({ timeout: 10000 })

    await page.fill('textarea[placeholder*="Hoàn thành bài 1"]',
      'Chào <img src=x onerror="window.__xss=1"> <script>window.__xss=2</script> **đậm** $a*b*c + x_1 * y_2$ [bẫy](javascript:alert(1)) [tốt](https://example.com)')
    const box = page.locator('.max-h-48 .math-content')
    await expect(box.locator('strong')).toHaveText('đậm')
    await expect(box.locator('img')).toHaveCount(0)
    await expect(box.locator('script')).toHaveCount(0)
    await expect(box.locator('a')).toHaveCount(1)
    await expect(box.locator('a')).toHaveAttribute('href', 'https://example.com')
    expect(await page.evaluate(() => window.__xss)).toBeUndefined()
    // Dấu * trong công thức không bị Markdown biến thành chữ nghiêng
    await expect(box.locator('.katex')).toHaveCount(1)
  })

  test('Đường dẫn file nguy hiểm (javascript:) bị chặn khi lưu bài học', async ({ page }) => {
    await loginAsTeacher(page)
    await page.click('[data-testid="add-lesson-btn"]')
    await page.fill('input[placeholder*="Chuyên đề 1:"]', 'Bài có link xấu')
    await page.fill('input[placeholder*="Hoặc dán đường dẫn http(s) của file lý thuyết"]', 'javascript:alert(1)')
    await page.click('button:has-text("Lưu Bài Học & Gán Cho Lớp")')
    await expect(page.locator('text=Đường dẫn file phải bắt đầu bằng http')).toBeVisible()
  })
})
