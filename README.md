# BienEDU Frontend (Vue 3 + Vite SPA)

Giao diện người dùng cho nền tảng quản lý học tập và làm bài tập Toán học **BienEDU**, được tối ưu hóa đặc biệt theo mô hình **Single Page Application (SPA)** để triển khai lên **Cloudflare Pages** (hoàn toàn miễn phí, CDN toàn cầu, 0% tải RAM/CPU trên VPS).

---

## 🛠 Công nghệ sử dụng

- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Build Tool:** Vite (Cực nhanh, Hot Module Replacement)
- **Routing:** Vue Router 4 (HTML5 History Mode kèm `_redirects` cho Cloudflare Pages)
- **State Management:** Pinia
- **Styling:** Tailwind CSS + Lucide Icons
- **Hiển thị công thức Toán:** KaTeX + Marked (Render trực tiếp LaTeX `$..$` và `$$..$$` ở Client-side)
- **HTTP Client:** Axios (Tích hợp JWT Interceptor & Auto Refresh Token)

---

## 🚀 Cài đặt & Chạy cục bộ (Local Development)

### 1. Cài đặt dependencies:
```bash
npm install
```

### 2. Chạy môi trường Dev:
```bash
npm run dev
```
Trình duyệt sẽ mở tại: `http://localhost:3000`

> **Lưu ý cấu hình Proxy:**
> Trong file `vite.config.js`, các request bắt đầu bằng `/api` sẽ tự động được chuyển tiếp đến `http://localhost:8080` (Spring Boot Backend), giúp bạn gọi API mà **không gặp lỗi CORS** khi phát triển trên máy local.

---

## ☁️ Triển khai lên Cloudflare Pages

1. Đẩy mã nguồn thư mục `BienEDUFE` lên repository GitHub / GitLab của bạn.
2. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Cấu hình thông số Build:
   - **Framework preset:** `Vue` (hoặc `Vite`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Cấu hình biến môi trường (Environment variables) trên Cloudflare Pages:
   - `VITE_API_BASE_URL`: Điền địa chỉ domain hoặc IP backend VPS của bạn (Ví dụ: `https://api.yourdomain.com`).
5. Bấm **Save and Deploy**. Cloudflare sẽ tự động build và cấp phát tên miền `xxx.pages.dev` với HTTPS miễn phí.

> **Cơ chế chống lỗi 404 khi F5 trên Cloudflare Pages:**
> File `public/_redirects` với nội dung `/* /index.html 200` đã được tạo sẵn để hỗ trợ routing SPA mượt mà khi người dùng reload trang.
