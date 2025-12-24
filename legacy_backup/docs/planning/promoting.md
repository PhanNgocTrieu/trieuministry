# Kế hoạch Phát triển & Nâng cấp TrieuMinistry

Tài liệu này phác thảo lộ trình phát triển cho website TrieuMinistry, từ giai đoạn xây dựng cộng đồng ban đầu đến việc chuyển đổi sang một nền tảng web ứng dụng (Web App) hoàn chỉnh với Backend mạnh mẽ để phục vụ nhu cầu ngày càng tăng.

## Giai đoạn 1: Tối ưu hóa & Thu hút (Hiện tại - Static Site)
**Mục tiêu:** Tăng lượng truy cập, xây dựng lòng tin và thu thập phản hồi ban đầu mà không cần đầu tư hạ tầng phức tạp.

1.  **Tương tác & Cộng đồng:**
    *   **Form liên hệ & Cầu nguyện:** Sử dụng các giải pháp serverless như Formspree, EmailJS hoặc Google Sheets API để nhận form mà không cần backend riêng.
    *   **Bình luận:** Tích hợp Disqus hoặc Facebook Comments để người dùng thảo luận dưới các bài viết/blog.
    *   **Newsletter:** Thu thập email quan tâm (qua Mailchimp/Substack) để gửi bài chia sẻ hàng tuần.

2.  **Quảng bá (Promoting):**
    *   **SEO:** Tối ưu hóa các thẻ meta, từ khóa, sitemap để Google dễ dàng index. Viết bài blog chất lượng cao thường xuyên.
    *   **Social Sharing:** Thêm nút chia sẻ nhanh lên Facebook/Zalo/Twitter trên các trang Blog và Lời chứng.
    *   **Analytics:** Cài đặt Google Analytics 4 để hiểu hành vi người dùng (họ đọc gì, ở lại bao lâu).

## Giai đoạn 2: Bán động (Hybrid - Static + Service)
**Mục tiêu:** Xử lý dữ liệu động nhẹ nhàng khi lượng tương tác tăng (ví dụ: > 100 lời cầu nguyện/tuần).

1.  **Cơ sở dữ liệu đám mây (Cloud Database):**
    *   Chuyển dữ liệu `blogs.json`, `prayers.json` từ file tĩnh sang **Firebase Realtime Database** hoặc **Firestore**.
    *   Giúp cập nhật bài viết/lời cầu nguyện ngay lập tức mà không cần deploy lại code.

2.  **Xác thực người dùng (Authentication):**
    *   Tích hợp **Firebase Auth** để cho phép người dùng đăng nhập (Google/Facebook).
    *   Tính năng: Lưu lời cầu nguyện cá nhân, đánh dấu bài viết yêu thích.

## Giai đoạn 3: Nền tảng chuyên nghiệp (Dynamic Web App)
**Mục tiêu:** Chuyển đổi sang mô hình Client-Server đầy đủ khi có lượng người dùng lớn, cần quản lý tài chính và dữ liệu phức tạp.

### Mô hình Hệ thống Đề xuất
*   **Frontend:** Chuyển từ HTML thuần sang **Next.js** hoặc **React**.
    *   Lợi ích: Tối ưu SEO (SSR), trải nghiệm App mượt mà (SPA), dễ dàng bảo trì component.
*   **Backend:** Xây dựng API Server riêng (Node.js/NestJS hoặc Go/Python).
*   **Database:** PostgreSQL (quan hệ) cho dữ liệu người dùng/dâng hiến, MongoDB (phi quan hệ) cho logs/nội dung linh hoạt.

### Tính năng Nâng cao
1.  **Mạng xã hội Cơ Đốc thu nhỏ:**
    *   Người dùng có Profile riêng.
    *   Tính năng "Cầu nguyện cho người này" (bấm nút sẽ gửi thông báo đến người xin cầu nguyện).
    *   Follow người chia sẻ/mục sư.

2.  **Quản lý Mục vụ & Dâng hiến (Ministry Management):**
    *   Cổng thanh toán tích hợp (Momo/VNPay/Stripe) hoặc QR code động.
    *   Hệ thống minh bạch tài chính: Tự động cập nhật tiến độ gây quỹ cho các dự án.
    *   Dashboard quản trị (Admin CMS) để quản lý bài viết, duyệt lời cầu nguyện, quản lý người dùng.

3.  **Thông báo (Notifications):**
    *   Thông báo Real-time khi có người cầu nguyện cho bạn.
    *   Email nhắc nhở lịch cầu nguyện hàng ngày (Daily Devotional).

## Giai đoạn 4: Hệ sinh thái Đa nền tảng (Ecosystem)
**Mục tiêu:** Tiếp cận người dùng trên thiết bị di động thuận tiện nhất.

1.  **Mobile App:**
    *   Xây dựng App (Flutter hoặc React Native) dùng chung Backend với Website.
    *   Tính năng Offline: Đọc bài chia sẻ/Kinh Thánh không cần mạng.
    *   Push Notification: Nhắc nhở giờ tĩnh nguyện.

2.  **Công cụ hỗ trợ (Tools):**
    *   Widget Lời Chúa mỗi ngày trên màn hình điện thoại.
    *   Bot nhắc nhở lịch đọc Kinh Thánh qua Zalo/Messenger.

---

## Kế hoạch hành động ngay (Next Steps)
Trước mắt, để chuẩn bị cho sự phát triển này, bạn nên:
- [ ] **Data:** Quy hoạch lại cấu trúc JSON hiện tại sao cho giống Database nhất có thể (chuẩn hóa các trường ID, Date).
- [ ] **Feedback:** Tạo một kênh để người dùng hiện tại góp ý họ muốn tính năng gì nhất.
- [ ] **Content:** Tập trung phát triển nội dung cốt lõi, vì nội dung là thứ giữ chân người dùng trước khi có công nghệ xịn.
