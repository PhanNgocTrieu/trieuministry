# Templates

Thư mục này chứa các template components có thể tái sử dụng cho các trang HTML.

## Cách sử dụng

Khi tạo trang HTML mới, copy các phần sau:

1. **Head Section**: Copy từ `head.html` vào `<head>` tag
2. **Navigation**: Copy từ `navbar.html` vào sau `<body>` tag
3. **Footer**: Copy từ `footer.html` vào trước `</body>` tag
4. **Scripts**: Copy từ `scripts.html` vào trước `</body>` tag

## Ví dụ cấu trúc HTML

```html
<!DOCTYPE html>
<html lang="vi">
<!-- Copy head.html content here -->
<head>
    <!-- ... -->
</head>
<body>
    <!-- Copy navbar.html content here -->
    <nav>...</nav>
    
    <!-- Your page content here -->
    <main style="margin-top: 76px;">
        <!-- Content -->
    </main>
    
    <!-- Copy footer.html content here -->
    <footer>...</footer>
    
    <!-- Copy scripts.html content here -->
    <script>...</script>
</body>
</html>
```

## Lưu ý

- Nhớ update `<title>` và `meta description` cho mỗi trang
- Navigation sẽ tự động highlight trang hiện tại
- Tất cả components đã được tích hợp với Bootstrap 5 và custom CSS

