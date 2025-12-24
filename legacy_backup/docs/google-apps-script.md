# Hướng dẫn Cài đặt Google Apps Script cho Newsletter

Đây là giải pháp "Serverless" miễn phí để lưu email đăng ký vào Google Sheet.

### Bước 1: Tạo Google Sheet
1.  Truy cập [Google Sheets](https://sheets.new) và tạo một trang tính mới.
2.  Đặt tên cho Sheet, ví dụ: `TrieuMinistry Newsletter`.
3.  Ở dòng 1 (Header), đặt tên các cột:
    *   Cột A: `Date`
    *   Cột B: `Email`

### Bước 2: Tạo Script
1.  Trong Google Sheet, chọn menu **Extensions** (Tiện ích mở rộng) > **Apps Script**.
2.  Xóa hết code cũ, copy và dán đoạn code sau vào:

```javascript
```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // Lấy Spreadsheet đang gắn với Script này
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheets()[0]; // Lấy Sheet đầu tiên (không quan tâm tên)

    // Lấy email từ request
    var email = e.parameter.email;
    var date = new Date();

    // Ghi trực tiếp vào dòng cuối cùng (Cột A: Date, Cột B: Email)
    sheet.appendRow([date, email]);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  finally {
    lock.releaseLock();
  }
}
```

### Bước 3: Deploy (Triển khai)
1.  Nhấn nút **Deploy** (Triển khai) màu xanh > **New deployment** (Tùy chọn triển khai mới).
2.  Chọn loại **Web app**.
3.  Cấu hình như sau:
    *   **Description:** Newsletter Script
    *   **Execute as:** Me (Chính bạn)
    *   **Who has access:** **Anyone** (Bất kỳ ai) -> *Quan trọng!*
4.  Nhấn **Deploy**. Cấp quyền truy cập nếu được hỏi.
5.  Copy **Web App URL** (Dạng `https://script.google.com/macros/s/.../exec`).

### Troubleshooting: Lỗi "Google hasn't verified this app"
Khi bạn chạy script lần đầu, Google sẽ cảnh báo vì script này chưa được kiểm duyệt (do chính bạn viết). Đây là bình thường.
1.  Bấm vào chữ **Advanced** (Nâng cao) ở góc dưới bên trái thông báo.
2.  Bấm vào link **Go to [Tên Script] (unsafe)** ở dưới cùng.
3.  Bấm **Allow** (Cho phép).

### Bước 4: Cập nhật Website
1.  Mở file `assets/js/newsletter.js`.
2.  Tìm biến `SCRIPT_URL` và dán URL vừa copy vào đó.
