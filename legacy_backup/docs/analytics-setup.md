# Hướng dẫn lấy Mã Google Analytics (Measurement ID)

Để theo dõi lượng truy cập website, bạn cần tạo tài khoản Google Analytics.

### Bước 1: Tạo tài khoản
1. Truy cập [analytics.google.com](https://analytics.google.com/).
2. Đăng nhập bằng Gmail của bạn.
3. Bấm **Bắt đầu đo lường** (Start measuring).
4. **Tên tài khoản**: Điền tên tùy ý (ví dụ: `TrieuMinistry`).
5. Bấm **Tiếp theo** (Next).

### Bước 2: Tạo Property (Tài sản)
1. **Tên thuộc tính (Property name)**: `TrieuMinistry Website`.
2. Múi giờ: Vietnam. Tiền tệ: VND.
3. Bấm **Tiếp theo**.
4. Các bước sau chọn tùy ý (Mục đích, Quy mô...) rồi bấm **Tạo** (Create).
5. Đồng ý điều khoản sử dụng.

### Bước 3: Lấy Mã Đo Lường (Measurement ID)
1. Trong màn hình **Chọn nền tảng** (Choose a platform), chọn **Web**.
2. **URL trang web**: Điền `phanngoctrieu.github.io` (bỏ `https://`).
3. **Tên luồng (Stream name)**: `TrieuMinistry`.
4. Bấm **Tạo luồng** (Create stream).
5. Bạn sẽ thấy một mã bắt đầu bằng chữ **G-**: Ví dụ `G-A1B2C3D4E5`.
6. Copy mã đó.

### Bước 4: Cập nhật Website
1. Mở file `assets/js/analytics.js` trên máy bạn.
2. Dán mã vừa copy vào dòng:
   ```javascript
   const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Thay G-XXXXXXXXXX bằng mã của bạn
   ```
3. Lưu file lại.
