# Troubleshooting: Không nhận được dữ liệu trong Google Sheet

Nếu web báo thành công nhưng Sheet không có dòng mới, hãy kiểm tra 3 lỗi phổ biến sau:

### 1. Sai tên Sheet (Phổ biến nhất)
*   Trong file Script, code đang là: `var SHEET_NAME = "Sheet1";`
*   Hãy mở Google Sheet của bạn, nhìn xuống dưới cùng (dưới chân trang web).
*   **Tên của Tab (thẻ)** có phải là `Sheet1` không?
*   Nếu bạn đã đổi tên Tab (ví dụ thành "Newsletter"), bạn phải sửa trong Script thành: `var SHEET_NAME = "Newsletter";`
*   **Lưu ý:** Sau khi sửa code, bạn NHẤT ĐỊNH phải Deploy lại (Xem mục 3).

### 2. Sai quyền truy cập (Quan trọng)
*   Khi Deploy, mục **Who has access** (Ai có quyền truy cập) BẮT BUỘC phải là **Anyone** (Bất kỳ ai).
*   Nếu bạn để là "Only me" hoặc "Anyone with Google account", script sẽ từ chối nhận dữ liệu từ web.

### 3. Quên "Deploy lại" (New Version)
*   Mỗi khi bạn sửa code trong Script, bạn **không được** chỉ copy URL cũ.
*   Bạn phải bấm **Deploy** > **Manage deployments** > Bấm icon bút chì (Edit) > Chỗ **Version** chọn **New version** > Bấm **Deploy**.
*   URL có thể không đổi, nhưng version phải mới thì code mới chạy.
