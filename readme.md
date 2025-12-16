# Static Website - Personal Profile

Website tĩnh đa chức năng cho profile cá nhân, blog, tài liệu, cầu nguyện và nhận hỗ trợ.

## 📋 Tổng quan

Website này bao gồm các tính năng chính:
- **Profile** - Thông tin cá nhân, công việc, niềm tin
- **Blogs** - Bài viết và journal
- **Docs** - Tài liệu PDF với preview
- **Prayers** - Cầu nguyện & cầu thay
- **Donate** - Nhận hỗ trợ qua QR và thông tin tài khoản

## 🛠️ Tech Stack

- HTML5, CSS3, JavaScript (Vanilla)
- TailwindCSS & Bootstrap 5
- PDF.js (cho preview PDF)
- GitHub Pages (deployment)

## 📖 Kế hoạch chi tiết

Xem file **[PLAN.md](./PLAN.md)** để có kế hoạch đầy đủ với:
- Cấu trúc dự án chi tiết
- Breakdown từng tính năng
- 29 bước implementation theo phases
- Checklist để tracking progress
- Timeline ước tính

## 🚀 Quick Start

1. Review `PLAN.md` để hiểu rõ cấu trúc
2. Mở `index.html` trong browser để xem website
3. Follow từng step trong plan để tiếp tục phát triển
4. Update progress trong `PLAN.md`

## 📁 Cấu trúc dự án

```
static-website/
├── index.html              # Trang chủ
├── assets/
│   ├── css/
│   │   └── main.css       # Custom CSS
│   ├── js/
│   │   ├── main.js        # Main JavaScript
│   │   └── navigation.js  # Navigation logic
│   ├── data/
│   │   ├── blogs.json     # Blog data
│   │   ├── docs.json      # Documents data
│   │   └── profile.json   # Profile data
│   └── images/            # Images folder
└── PLAN.md                # Chi tiết kế hoạch
```

## 🛠️ Setup

1. Clone hoặc download project
2. Mở `index.html` trong browser
3. Hoặc sử dụng local server:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server
   ```

## 📝 Dependencies

Tất cả dependencies được load qua CDN:
- Bootstrap 5.3.2
- TailwindCSS (CDN)
- Font Awesome 6.5.1
- Google Fonts (Inter)
- PDF.js (sẽ thêm trong Phase 5)

---

**Status:** ✅ Phase 1 Completed - Ready for Phase 2

