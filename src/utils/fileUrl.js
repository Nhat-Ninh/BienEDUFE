/**
 * Liên kết tới file đính kèm bài học.
 * Chỉ chấp nhận http(s) hoặc file đã tải lên máy chủ (/api/v1/files/download/...) — chặn javascript:, data: ...
 * vì đường dẫn này do giáo viên nhập tay và hiển thị cho học sinh bấm vào.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export function isAllowedFileUrl(url) {
  const u = String(url ?? '').trim()
  if (!u) return true
  return /^https?:\/\/\S+$/i.test(u) || /^\/api\/v1\/files\/download\/\S+$/.test(u)
}

/** Địa chỉ dùng cho thẻ <a href>; chuỗi rỗng nếu không an toàn. Khi API ở domain khác thì thêm tiền tố. */
export function fileHref(url) {
  const u = String(url ?? '').trim()
  if (!isAllowedFileUrl(u) || !u) return ''
  return u.startsWith('/') ? API_BASE + u : u
}

/** Đuôi file hiển thị trên nhãn ("PDF", "DOCX", ...). */
export function fileKindLabel(fileName, fallback = 'FILE') {
  const m = /\.([a-z0-9]{1,6})$/i.exec(String(fileName ?? ''))
  return m ? m[1].toUpperCase() : fallback
}

/** Các định dạng máy chủ bóc tách được (khớp DocumentTextExtractor). */
export const IMPORT_ACCEPT = '.pdf,.docx,.md,.markdown,.txt,.tex'
export const IMPORT_MAX_BYTES = 20 * 1024 * 1024

/** Trả về thông báo lỗi nếu file không hợp lệ, ngược lại chuỗi rỗng. */
export function validateImportFile(file) {
  if (!file) return ''
  if (file.size > IMPORT_MAX_BYTES) {
    return `File "${file.name}" nặng ${(file.size / 1024 / 1024).toFixed(1)}MB, vượt giới hạn 20MB.`
  }
  if (!/\.(pdf|docx|md|markdown|txt|tex)$/i.test(file.name)) {
    return 'Chỉ nhận file PDF, Word (.docx), Markdown (.md), văn bản (.txt) hoặc LaTeX (.tex). File Word cũ (.doc) hãy Lưu thành .docx trước.'
  }
  return ''
}
