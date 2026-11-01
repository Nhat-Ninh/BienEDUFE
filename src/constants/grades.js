// Danh mục khối lớp (6–12) dùng chung cho toàn giao diện: nhãn, bậc học, mục tiêu và chuyên đề trọng tâm.
// Mọi màn hình cần "khối lớp" lấy dữ liệu từ đây thay vì tự gõ cứng Toán 12.

export const GRADES = [6, 7, 8, 9, 10, 11, 12]

export const GRADE_INFO = {
  6: {
    label: 'Lớp 6',
    stage: 'THCS',
    sub: 'THCS • KNTT / Cánh Diều',
    goal: 'Vững nền tảng Toán THCS ngay từ đầu',
    tagline: 'Chương trình Toán lớp 6',
    topics: [
      { title: 'Số tự nhiên & Lũy thừa', desc: 'Thứ tự thực hiện phép tính, lũy thừa, ước - bội, ƯCLN - BCNN và các bài toán thực tế.' },
      { title: 'Số nguyên', desc: 'Cộng trừ nhân chia số nguyên, quy tắc dấu ngoặc, chia hết và bài toán nhiệt độ - độ cao.' },
      { title: 'Phân số & Số thập phân', desc: 'So sánh, quy đồng, các phép tính phân số, số thập phân, tỉ số phần trăm.' },
      { title: 'Hình học trực quan', desc: 'Tam giác đều, hình vuông, lục giác đều, hình chữ nhật, hình bình hành, hình thoi.' },
      { title: 'Thống kê & Xác suất', desc: 'Thu thập, biểu diễn dữ liệu, biểu đồ cột, xác suất thực nghiệm của một sự kiện.' }
    ]
  },
  7: {
    label: 'Lớp 7',
    stage: 'THCS',
    sub: 'THCS',
    goal: 'Làm chủ số hữu tỉ, tam giác và biểu thức đại số',
    tagline: 'Chương trình Toán lớp 7',
    topics: [
      { title: 'Số hữu tỉ', desc: 'Cộng trừ nhân chia số hữu tỉ, lũy thừa của số hữu tỉ, quy tắc chuyển vế.' },
      { title: 'Số thực', desc: 'Căn bậc hai số học, số vô tỉ, làm tròn số và giá trị tuyệt đối.' },
      { title: 'Biểu thức đại số & Đa thức', desc: 'Đơn thức, đa thức một biến, cộng trừ nhân chia đa thức, nghiệm của đa thức.' },
      { title: 'Tam giác', desc: 'Các trường hợp bằng nhau của tam giác, tam giác cân, quan hệ giữa các yếu tố trong tam giác.' },
      { title: 'Thống kê & Xác suất', desc: 'Phân tích, xử lý dữ liệu, biểu đồ đoạn thẳng - hình quạt, biến cố ngẫu nhiên.' }
    ]
  },
  8: {
    label: 'Lớp 8',
    stage: 'THCS',
    sub: 'THCS',
    goal: 'Thành thạo hằng đẳng thức, phân thức và hình đồng dạng',
    tagline: 'Chương trình Toán lớp 8',
    topics: [
      { title: 'Đa thức & Hằng đẳng thức', desc: 'Nhân chia đa thức, bảy hằng đẳng thức đáng nhớ, phân tích đa thức thành nhân tử.' },
      { title: 'Phân thức đại số', desc: 'Rút gọn, quy đồng, cộng trừ nhân chia phân thức, điều kiện xác định.' },
      { title: 'Hàm số bậc nhất & Đồ thị', desc: 'Hệ số góc, đồ thị hàm số $y = ax + b$, hai đường thẳng song song - cắt nhau.' },
      { title: 'Tam giác đồng dạng', desc: 'Định lí Thalès, đường phân giác, các trường hợp đồng dạng của tam giác.' },
      { title: 'Tứ giác & Hình học phẳng', desc: 'Hình thang, hình bình hành, hình chữ nhật, hình thoi, hình vuông.' }
    ]
  },
  9: {
    label: 'Lớp 9',
    stage: 'THCS',
    sub: 'THCS • Ôn Thi Vào 10',
    goal: 'Bứt phá điểm thi vào lớp 10',
    tagline: 'Chương trình Toán lớp 9 & ôn thi vào 10',
    topics: [
      { title: 'Căn thức bậc hai', desc: 'Rút gọn biểu thức chứa căn, trục căn thức, bài toán rút gọn có điều kiện.' },
      { title: 'Hệ phương trình bậc nhất hai ẩn', desc: 'Giải bằng phương pháp thế, cộng đại số và các bài toán lập hệ phương trình.' },
      { title: 'Hàm số $y = ax^2$ & Phương trình bậc hai', desc: 'Công thức nghiệm, hệ thức Vi-ét, tương giao parabol - đường thẳng.' },
      { title: 'Hệ thức lượng trong tam giác vuông', desc: 'Tỉ số lượng giác, giải tam giác vuông, bài toán thực tế đo đạc.' },
      { title: 'Đường tròn', desc: 'Tiếp tuyến, góc với đường tròn, tứ giác nội tiếp và bài toán chứng minh.' }
    ]
  },
  10: {
    label: 'Lớp 10',
    stage: 'THPT',
    sub: 'THPT • CT 2018',
    goal: 'Làm quen chương trình THPT mới một cách chắc chắn',
    tagline: 'Chương trình Toán lớp 10 (CT 2018)',
    topics: [
      { title: 'Mệnh đề & Tập hợp', desc: 'Mệnh đề, phủ định, các phép toán tập hợp, khoảng - đoạn - nửa khoảng.' },
      { title: 'Bất phương trình & Hệ bất phương trình', desc: 'Bất phương trình bậc nhất hai ẩn, miền nghiệm và bài toán quy hoạch tuyến tính cơ bản.' },
      { title: 'Hàm số bậc hai & Tam thức', desc: 'Đồ thị parabol, dấu tam thức bậc hai, phương trình quy về bậc hai.' },
      { title: 'Vectơ', desc: 'Các phép toán vectơ, tích vô hướng và ứng dụng vào hình học phẳng.' },
      { title: 'Hệ thức lượng & Thống kê', desc: 'Định lí sin - côsin, diện tích tam giác, các số đặc trưng của mẫu số liệu.' }
    ]
  },
  11: {
    label: 'Lớp 11',
    stage: 'THPT',
    sub: 'THPT',
    goal: 'Nắm vững giới hạn, đạo hàm và hình học không gian',
    tagline: 'Chương trình Toán lớp 11',
    topics: [
      { title: 'Hàm số lượng giác & Phương trình lượng giác', desc: 'Công thức lượng giác, tính tuần hoàn, giải phương trình lượng giác cơ bản.' },
      { title: 'Dãy số, Cấp số cộng & Cấp số nhân', desc: 'Số hạng tổng quát, tổng n số hạng đầu và các bài toán thực tế.' },
      { title: 'Giới hạn & Hàm số liên tục', desc: 'Giới hạn dãy số, giới hạn hàm số, tính liên tục và ứng dụng.' },
      { title: 'Đạo hàm', desc: 'Quy tắc tính đạo hàm, đạo hàm hàm hợp, ý nghĩa hình học và vật lý.' },
      { title: 'Quan hệ song song & vuông góc trong không gian', desc: 'Đường thẳng - mặt phẳng, hai mặt phẳng song song - vuông góc, khoảng cách và góc.' }
    ]
  },
  12: {
    label: 'Lớp 12',
    stage: 'THPT',
    sub: 'THPT • Ôn Thi QG & ĐGNL',
    goal: 'Bứt phá mục tiêu 8.0 - 9.0 điểm THPTQG',
    tagline: 'Chương trình Toán lớp 12 & luyện thi THPTQG',
    topics: [
      { title: 'Ứng dụng Đạo hàm & Khảo sát Hàm số', desc: 'Đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất, tiệm cận, bảng biến thiên và tương giao đồ thị chứa tham số $m$.' },
      { title: 'Hàm số Lũy thừa, Mũ & Logarit', desc: 'Biến đổi công thức mũ - logarit, phương trình - bất phương trình và bài toán tối ưu thực tế, lãi suất ngân hàng.' },
      { title: 'Nguyên hàm, Tích phân & Ứng dụng', desc: 'Phương pháp đổi biến, từng phần, tính diện tích hình phẳng, thể tích khối tròn xoay.' },
      { title: 'Hình học Không gian Oxyz', desc: 'Hệ tọa độ Oxyz, phương trình mặt phẳng, đường thẳng, mặt cầu, góc và khoảng cách.' },
      { title: 'Xác suất & Thống kê Mô tả', desc: 'Quy tắc cộng - nhân, tổ hợp, chỉnh hợp, xác suất có điều kiện, công thức xác suất toàn phần.' }
    ]
  }
}

export const isValidGrade = (g) => GRADES.includes(Number(g))

/** Chuẩn hoá về số nguyên 6–12, ngược lại trả null. */
export const normalizeGrade = (g) => {
  const n = Number(g)
  return Number.isInteger(n) && GRADES.includes(n) ? n : null
}

export const gradeLabel = (g) => GRADE_INFO[normalizeGrade(g)]?.label || ''

export const gradeSubjectCode = (g) => `TOAN_${g}`

/** Lấy khối lớp từ mã môn học dạng TOAN_<khối>; không khớp thì null. */
export const gradeFromSubjectCode = (code) => {
  const m = /^TOAN_(\d{1,2})$/.exec(code || '')
  return m ? normalizeGrade(m[1]) : null
}
