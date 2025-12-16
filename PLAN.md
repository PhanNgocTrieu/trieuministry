# KẾ HOẠCH CHI TIẾT - WEBSITE TĨNH PROFILE CÁ NHÂN

## 📋 TỔNG QUAN DỰ ÁN

**Mục tiêu:** Xây dựng website tĩnh đa chức năng phục vụ:
- Profile cá nhân
- Blog/Journal
- Tài liệu (PDF) với preview
- Cầu nguyện & Cầu thay
- Nhận hỗ trợ/Donate

**Công nghệ:** HTML5, CSS3, JavaScript (Vanilla), TailwindCSS, Bootstrap 5
**Deployment:** GitHub Pages
**Kiểu:** Landing Page - Single Page Application (SPA) hoặc Multi-page

---

## 🛠️ TECHNOLOGY STACK

### Core Technologies
- **HTML5** - Cấu trúc website
- **CSS3** - Styling cơ bản
- **JavaScript (Vanilla)** - Tương tác và navigation
- **TailwindCSS** - Utility-first CSS framework
- **Bootstrap 5** - Component library

### Tools & Libraries
- **PDF.js** (Mozilla) - Preview PDF files
- **Font Awesome** hoặc **Heroicons** - Icons
- **Google Fonts** - Typography
- **Git** - Version control
- **GitHub Pages** - Hosting

---

## 📁 CẤU TRÚC DỰ ÁN

```
static-website/
├── index.html                 # Trang chủ/Landing page
├── profile.html               # Trang Profile
├── blogs.html                 # Trang danh sách Blogs
├── blog-detail.html           # Trang chi tiết Blog (template)
├── docs.html                  # Trang danh sách Documents
├── prayers.html               # Trang Prayers
├── donate.html                # Trang Donate
├── assets/
│   ├── css/
│   │   ├── main.css          # Custom CSS
│   │   ├── tailwind.css      # Tailwind compiled
│   │   └── bootstrap.min.css # Bootstrap (CDN hoặc local)
│   ├── js/
│   │   ├── main.js           # Main JavaScript logic
│   │   ├── navigation.js     # Navigation handling
│   │   ├── blog.js           # Blog functionality
│   │   ├── docs.js           # Document preview/download
│   │   └── pdf-viewer.js     # PDF preview logic
│   ├── images/
│   │   ├── profile/          # Ảnh profile
│   │   ├── blogs/            # Ảnh cho blogs
│   │   └── icons/            # Icons, logos
│   ├── pdfs/                 # Thư mục chứa file PDF
│   └── data/
│       ├── blogs.json        # Dữ liệu blogs (JSON)
│       ├── docs.json         # Dữ liệu documents (JSON)
│       └── profile.json      # Dữ liệu profile (JSON)
├── README.md
├── PLAN.md                    # File này
└── .gitignore
```

---

## 🎯 CHI TIẾT TỪNG TÍNH NĂNG

### 1. **PROFILE PAGE** (`profile.html`)

#### Nội dung:
- **Header Section:**
  - Ảnh đại diện
  - Tên, chức danh
  - Social links (GitHub, LinkedIn, Email, etc.)
  
- **About Section:**
  - Giới thiệu ngắn gọn
  - Thông tin cá nhân cơ bản
  
- **Current Work Section:**
  - Công việc hiện tại
  - Vị trí, công ty
  - Mô tả công việc
  
- **Fundamental Faith Section:**
  - Niềm tin cơ bản
  - Values, beliefs
  - Có thể dùng timeline hoặc cards

- **Skills/Interests:**
  - Kỹ năng
  - Sở thích
  - Tags/badges

#### Design:
- Hero section với background đẹp
- Card-based layout
- Responsive design
- Smooth scroll animations

---

### 2. **BLOGS PAGE** (`blogs.html`)

#### Nội dung:
- **Blog List View:**
  - Grid/List layout
  - Mỗi blog card hiển thị:
    - Ảnh thumbnail
    - Tiêu đề
    - Mô tả ngắn
    - Ngày đăng
    - Tags/Categories
    - Link đọc thêm
  
- **Blog Detail View** (`blog-detail.html`):
  - Template động load từ JSON
  - Nội dung đầy đủ bài viết
  - Navigation: Previous/Next
  - Related posts
  - Reading time estimate

#### Features:
- Filter by category/tags
- Search functionality
- Pagination (nếu nhiều bài)
- Reading progress indicator
- Share buttons

#### Data Structure (blogs.json):
```json
{
  "blogs": [
    {
      "id": 1,
      "title": "Tiêu đề bài viết",
      "slug": "tieu-de-bai-viet",
      "excerpt": "Mô tả ngắn...",
      "content": "Nội dung đầy đủ...",
      "author": "Tên tác giả",
      "date": "2024-01-15",
      "category": "Faith",
      "tags": ["prayer", "faith"],
      "image": "assets/images/blogs/image1.jpg",
      "readingTime": 5
    }
  ]
}
```

---

### 3. **DOCS PAGE** (`docs.html`)

#### Nội dung:
- **Document List:**
  - Grid layout với cards
  - Mỗi card hiển thị:
    - Icon PDF
    - Tên tài liệu
    - Mô tả
    - Kích thước file
    - Ngày upload
    - Preview button
    - Download button

- **Preview Modal:**
  - Sử dụng PDF.js để preview
  - Full-screen hoặc modal
  - Zoom in/out
  - Page navigation
  - Download từ trong preview

#### Features:
- Search documents
- Filter by category
- Preview trước khi download
- Download counter (localStorage)
- File size display

#### Data Structure (docs.json):
```json
{
  "documents": [
    {
      "id": 1,
      "title": "Tên tài liệu",
      "description": "Mô tả...",
      "filename": "document1.pdf",
      "path": "assets/pdfs/document1.pdf",
      "size": "2.5 MB",
      "category": "Faith",
      "uploadDate": "2024-01-10",
      "thumbnail": "assets/images/docs/thumb1.jpg"
    }
  ]
}
```

---

### 4. **PRAYERS PAGE** (`prayers.html`)

#### Nội dung:
- **Prayer Requests Section:**
  - Form để submit prayer requests
  - List các prayer requests (có thể lưu trong localStorage hoặc JSON)
  - Mỗi request hiển thị:
    - Tên người cầu nguyện (optional)
    - Nội dung request
    - Ngày đăng
    - Status (Answered/Unanswered)
  
- **Prayer List:**
  - Cards layout
  - Filter: All/Answered/Unanswered
  - Prayer counter

#### Features:
- Submit prayer request (localStorage)
- Mark as answered
- Prayer counter
- Share prayer requests
- Prayer calendar view (optional)

#### Note:
- Vì là static site, data sẽ lưu trong localStorage hoặc JSON file
- Có thể tích hợp với form service như Formspree để gửi email

---

### 5. **DONATE PAGE** (`donate.html`)

#### Nội dung:
- **Donation Information:**
  - QR Code hiển thị
  - Thông tin tài khoản ngân hàng:
    - Tên ngân hàng
    - Số tài khoản
    - Tên chủ tài khoản
    - Chi nhánh
  - Các phương thức thanh toán khác (nếu có)
  
- **Thank You Message:**
  - Lời cảm ơn
  - Mục đích sử dụng quỹ

#### Features:
- QR Code generator (nếu cần tạo động)
- Copy to clipboard cho số tài khoản
- Multiple payment methods
- Donation counter (nếu có API hoặc manual update)

---

## 📐 DESIGN SYSTEM

### Color Palette:
- Primary Color: (chọn màu chủ đạo)
- Secondary Color: (màu phụ)
- Accent Colors: (màu nhấn)
- Text Colors: (dark/light)
- Background Colors: (light/dark mode support - optional)

### Typography:
- Heading Font: (Google Fonts)
- Body Font: (Google Fonts)
- Font sizes: Responsive scale

### Components:
- Navigation bar (sticky)
- Footer
- Cards
- Buttons
- Forms
- Modals
- Loading states

---

## 🚀 IMPLEMENTATION PLAN - CÁC BƯỚC THỰC HIỆN

### **PHASE 1: SETUP & FOUNDATION** (Step 1-3)

#### Step 1: Khởi tạo dự án
- [x] Tạo cấu trúc thư mục
- [x] Khởi tạo Git repository
- [x] Setup .gitignore
- [x] Tạo README.md với hướng dẫn
- [ ] Setup GitHub repository (cần push lên GitHub)

#### Step 2: Setup Dependencies
- [x] Link TailwindCSS (CDN hoặc npm)
- [x] Link Bootstrap 5 (CDN)
- [ ] Link PDF.js library (sẽ thêm trong Phase 5)
- [x] Link Font Awesome/Heroicons
- [x] Link Google Fonts
- [x] Tạo file main.css cho custom styles

#### Step 3: Base HTML Structure
- [x] Tạo index.html với structure cơ bản
- [x] Tạo navigation component (reusable)
- [x] Tạo footer component (reusable)
- [x] Setup responsive meta tags
- [x] Test responsive trên mobile/tablet/desktop

---

### **PHASE 2: NAVIGATION & LAYOUT** (Step 4-5)

#### Step 4: Navigation System
- [ ] Tạo navigation.js
- [ ] Implement smooth scroll
- [ ] Active page highlighting
- [ ] Mobile menu toggle
- [ ] Sticky navigation bar

#### Step 5: Common Components
- [ ] Header/Navbar component
- [ ] Footer component
- [ ] Loading spinner
- [ ] Back to top button
- [ ] Toast notifications (nếu cần)

---

### **PHASE 3: PROFILE PAGE** (Step 6-7)

#### Step 6: Profile Page Structure
- [ ] Tạo profile.html
- [ ] Hero section với ảnh và thông tin cơ bản
- [ ] About section
- [ ] Current Work section
- [ ] Fundamental Faith section
- [ ] Skills/Interests section
- [ ] Social links section

#### Step 7: Profile Page Styling
- [ ] Apply TailwindCSS và Bootstrap
- [ ] Responsive design
- [ ] Animations và transitions
- [ ] Image optimization
- [ ] Test trên các devices

---

### **PHASE 4: BLOGS SYSTEM** (Step 8-11)

#### Step 8: Blogs Data Structure
- [ ] Tạo blogs.json với sample data
- [ ] Define JSON schema
- [ ] Tạo 2-3 sample blog posts

#### Step 9: Blogs List Page
- [ ] Tạo blogs.html
- [ ] Implement blog card component
- [ ] Load blogs từ JSON
- [ ] Grid/List layout toggle (optional)
- [ ] Filter by category
- [ ] Search functionality

#### Step 10: Blog Detail Page
- [ ] Tạo blog-detail.html (template)
- [ ] Implement dynamic content loading từ JSON
- [ ] URL routing với hash hoặc query params
- [ ] Previous/Next navigation
- [ ] Related posts
- [ ] Reading time calculation
- [ ] Reading progress bar

#### Step 11: Blog Features
- [ ] Share buttons
- [ ] Print functionality
- [ ] Dark mode toggle (optional)
- [ ] Font size adjustment (optional)

---

### **PHASE 5: DOCUMENTS SYSTEM** (Step 12-15)

#### Step 12: Documents Data Structure
- [ ] Tạo docs.json với sample data
- [ ] Upload sample PDF files vào assets/pdfs/
- [ ] Tạo thumbnails cho PDFs (optional)

#### Step 13: Documents List Page
- [ ] Tạo docs.html
- [ ] Document card component
- [ ] Load documents từ JSON
- [ ] Filter và search
- [ ] File size formatting

#### Step 14: PDF Preview System
- [ ] Integrate PDF.js
- [ ] Tạo preview modal
- [ ] Implement PDF viewer với controls:
  - Zoom in/out
  - Page navigation
  - Fullscreen mode
  - Download button
- [ ] Error handling cho PDF loading

#### Step 15: Download Functionality
- [ ] Download button implementation
- [ ] Download counter (localStorage)
- [ ] Download progress indicator
- [ ] File validation

---

### **PHASE 6: PRAYERS PAGE** (Step 16-18)

#### Step 16: Prayers Page Structure
- [ ] Tạo prayers.html
- [ ] Prayer request form
- [ ] Prayer list display
- [ ] Prayer card component

#### Step 17: Prayers Functionality
- [ ] Form validation
- [ ] Save prayer requests (localStorage hoặc JSON)
- [ ] Display prayer list
- [ ] Filter: All/Answered/Unanswered
- [ ] Mark as answered feature
- [ ] Delete prayer request (optional)

#### Step 18: Prayers Integration
- [ ] Integrate với Formspree (optional - để gửi email)
- [ ] Prayer counter
- [ ] Share prayer functionality
- [ ] Export prayers (optional)

---

### **PHASE 7: DONATE PAGE** (Step 19-20)

#### Step 19: Donate Page Structure
- [ ] Tạo donate.html
- [ ] QR Code display section
- [ ] Bank account information section
- [ ] Thank you message section
- [ ] Copy to clipboard functionality

#### Step 20: Donate Features
- [ ] QR Code image (tạo sẵn hoặc generate)
- [ ] Copy account number button
- [ ] Multiple payment methods display
- [ ] Donation purpose explanation
- [ ] Contact information

---

### **PHASE 8: LANDING PAGE** (Step 21-22)

#### Step 21: Landing Page (index.html)
- [ ] Hero section với CTA
- [ ] Quick navigation cards:
  - Profile card
  - Blogs card
  - Docs card
  - Prayers card
  - Donate card
- [ ] Featured content section
- [ ] Call-to-action sections

#### Step 22: Landing Page Polish
- [ ] Animations và transitions
- [ ] Parallax effects (optional)
- [ ] Smooth scrolling
- [ ] Interactive elements

---

### **PHASE 9: OPTIMIZATION & POLISH** (Step 23-26)

#### Step 23: Performance Optimization
- [ ] Image optimization (compress, WebP format)
- [ ] Lazy loading cho images
- [ ] Minify CSS và JavaScript
- [ ] Code splitting (nếu cần)
- [ ] Cache strategy

#### Step 24: SEO Optimization
- [ ] Meta tags cho mỗi page
- [ ] Open Graph tags
- [ ] Structured data (JSON-LD)
- [ ] Sitemap.xml
- [ ] robots.txt

#### Step 25: Accessibility
- [ ] Alt text cho images
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast check

#### Step 26: Cross-browser Testing
- [ ] Test trên Chrome
- [ ] Test trên Firefox
- [ ] Test trên Safari
- [ ] Test trên Edge
- [ ] Test trên mobile browsers

---

### **PHASE 10: DEPLOYMENT** (Step 27-29)

#### Step 27: GitHub Setup
- [ ] Push code lên GitHub
- [ ] Setup GitHub Pages
- [ ] Configure custom domain (nếu có)
- [ ] Test deployment

#### Step 28: Documentation
- [ ] Update README.md với:
  - Project description
  - Setup instructions
  - How to add new blog posts
  - How to add new documents
  - Deployment guide
- [ ] Code comments
- [ ] Usage guide

#### Step 29: Final Testing & Launch
- [ ] Test tất cả features trên production
- [ ] Check broken links
- [ ] Verify all forms work
- [ ] Test PDF preview và download
- [ ] Performance audit
- [ ] Launch! 🚀

---

## 📊 MONITORING & TRACKING

### Progress Tracking:
- Sử dụng checklist trong PLAN.md để track từng step
- Update status: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Blocked

### Quality Checklist:
- [ ] All pages responsive
- [ ] No console errors
- [ ] All links working
- [ ] Images optimized
- [ ] Fast load times (< 3s)
- [ ] SEO optimized
- [ ] Accessible

### Testing Checklist:
- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile devices (iOS, Android)
- [ ] Tablet devices
- [ ] Different screen sizes
- [ ] Slow network conditions
- [ ] Offline functionality (nếu có)

---

## 📝 NOTES & CONSIDERATIONS

### Data Management:
- **Blogs & Docs:** Lưu trong JSON files, dễ update và maintain
- **Prayers:** Có thể dùng localStorage (client-side) hoặc JSON file (manual update)
- **Profile:** Có thể hardcode trong HTML hoặc JSON

### Future Enhancements (Optional):
- Dark mode toggle
- Multi-language support
- Blog comments (Disqus hoặc similar)
- Analytics integration (Google Analytics)
- RSS feed cho blogs
- Sitemap generator
- Contact form với email service

### Limitations (Static Site):
- Không có database thực sự
- Comments cần third-party service
- Form submissions cần service như Formspree
- Real-time updates không khả thi

---

## 🎯 TIMELINE ESTIMATE

- **Phase 1-2:** 2-3 ngày (Setup & Foundation)
- **Phase 3:** 2-3 ngày (Profile)
- **Phase 4:** 4-5 ngày (Blogs)
- **Phase 5:** 3-4 ngày (Docs)
- **Phase 6:** 2-3 ngày (Prayers)
- **Phase 7:** 1-2 ngày (Donate)
- **Phase 8:** 2-3 ngày (Landing)
- **Phase 9:** 3-4 ngày (Optimization)
- **Phase 10:** 1-2 ngày (Deployment)

**Tổng ước tính:** 20-29 ngày làm việc (tùy vào tốc độ và độ phức tạp)

---

## ✅ NEXT STEPS

1. Review plan này và confirm
2. Bắt đầu với Phase 1: Setup & Foundation
3. Update progress trong PLAN.md
4. Test từng phase trước khi chuyển sang phase tiếp theo

---

**Chúc bạn thành công với dự án! 🎉**

