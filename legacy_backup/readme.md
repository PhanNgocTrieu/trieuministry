# TrieuMinistry - Personal Ministry Profile

Một website tĩnh hiện đại, tích hợp công nghệ PWA và Firebase, phục vụ cho mục vụ cá nhân, chia sẻ bài viết, tài liệu và cầu nguyện.

## 🌟 Tính Năng Chính

*   **Profile Cá Nhân:** Giới thiệu bản thân, chức vụ, niềm tin và kỹ năng.
*   **Blog/Journal:** Hệ thống bài viết động loading từ JSON, hỗ trợ tìm kiếm và lọc theo chủ đề.
*   **Thư Viện Tài Liệu (Docs):** Xem và tải xuống tài liệu PDF trực tiếp trên web với trình xem PDF tích hợp.
*   **Cầu Nguyện (Prayers):** Gửi lời cầu nguyện, đánh dấu đã trả lời, và xóa (dành cho Admin). Tích hợp Firebase Realtime.
*   **Dâng Hiến (Donate):** Trang thông tin tài khoản và QR Code tiện lợi.
*   **PWA (Progressive Web App):** Hỗ trợ cài đặt như app trên điện thoại, hoạt động ngoại tuyến cơ bản.
*   **Dark Mode & Animations:** Giao diện hiện đại, mượt mà.

## 🛠️ Công Nghệ Sử Dụng

*   **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+).
*   **UI Frameworks:** Bootstrap 5, FontAwesome 6.
*   **Backend (BaaS):** Firebase Firestore (Lưu trữ lời cầu nguyện), Firebase Analytics.
*   **Hosting:** GitHub Pages.
*   **Tools:** PDF.js (Preview tài liệu).

## � Hướng Dẫn Cài Đặt (Local)

1.  **Clone repository:**
    ```bash
    git clone https://github.com/PhanNgocTrieu/trieuministry.git
    cd trieuministry
    ```

2.  **Chạy server ảo:**
    Vì dự án sử dụng Modules (`type="module"`) và Service Worker, bạn cần chạy qua HTTP Server chứ không mở trực tiếp file HTML.
    
    *   **Cách 1 (VS Code):** Cài extension "Live Server" và bấm "Go Live".
    *   **Cách 2 (Python):** `python3 -m http.server 5500`
    *   **Cách 3 (Node):** `npx http-server .`

3.  **Truy cập:** Mở trình duyệt tại `http://127.0.0.1:5500`.

## 📝 Hướng Dẫn Quản Lý Nội Dung

### 1. Thêm Bài Viết Mới (Blog)
Mở file `assets/data/blogs.json`:
```json
{
  "id": "new-post-id",
  "title": "Tiêu đề bài viết",
  "slug": "tieu-de-khong-dau",
  "excerpt": "Mô tả ngắn hiển thị bên ngoài...",
  "content": "<p>Nội dung bài viết dùng thẻ HTML...</p>",
  "author": "Phan Ngọc Triệu",
  "date": "2025-12-25",
  "category": "Chủ đề",
  "image": "assets/images/blogs/ten-anh.jpg",
  "readingTime": 5
}
```

### 2. Thêm Tài Liệu Mới (Docs)
1.  Upload file PDF vào thư mục `assets/pdfs/`.
2.  Mở file `assets/data/docs.json` và thêm:
```json
{
  "id": 10,
  "title": "Tên tài liệu",
  "category": "Danh mục",
  "size": "2.5 MB",
  "date": "2025-12-20",
  "file": "assets/pdfs/ten-file.pdf",
  "image": "assets/images/docs/bg-doc-1.jpg"
}
```

## 🌐 Hướng Dẫn Deploy (GitHub Pages)

Dự án này được cấu hình để chạy tự động trên GitHub Pages.

1.  Push code lên nhánh `main` trên GitHub.
2.  Vào **Settings** > **Pages**.
3.  Tại mục **Branch**, chọn `main` và folder `/ (root)`.
4.  Bấm **Save**.
5.  Web sẽ chạy tại: `https://phanngoctrieu.github.io/trieuministry/`

**Lưu ý:**
*   Hệ thống Router đã được tối ưu cho GitHub Pages (tự động nhận diện thư mục con).
*   Nếu thấy lỗi 404, hãy đợi 1-2 phút và thử reload lại trang (đôi khi cache chưa cập nhật).

## 📞 Liên Hệ

*   **Email:** phantrieu580@gmail.com
*   **Facebook:** [Phan Ngọc Triều](https://facebook.com)

---
© 2025 TrieuMinistry. Designed for God's Glory.
