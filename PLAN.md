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
- [x] Setup GitHub repository (cần push lên GitHub)

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

**📋 Technical Implementation (Phase 1):**
- **Foundation**: Established Git repository and basic file structure.
- **Dependencies**: Integrated Bootstrap 5 and TailwindCSS via CDN for rapid styling flexibility.
- **Assets**: Created `assets/css/main.css` for custom overrides and `assets/js` for future logic.


---

### **PHASE 2: NAVIGATION & LAYOUT** (Step 4-5)

#### Step 4: Navigation System
- [x] Tạo navigation.js
- [x] Implement smooth scroll
- [x] Active page highlighting
- [x] Mobile menu toggle
- [x] Sticky navigation bar

#### Step 5: Common Components
- [x] Header/Navbar component (template created)
- [x] Footer component (template created)
- [x] Loading spinner
- [x] Back to top button
- [x] Toast notifications (enhanced)

**📋 Technical Implementation (Phase 2):**
- **Navigation**: Implemented `navigation.js` using `DOMContentLoaded` to inject the navbar dynamically, facilitating easier updates across multiple pages.
- **Scroll**: Added a scroll listener for `sticky-top` effects and a "Back to Top" button that appears after scrolling 300px.
- **Utilities**: Created a reusable `Toast` class in `components.js` for non-blocking UI notifications.


---

### **PHASE 3: PROFILE PAGE** (Step 6-7)

#### Step 6: Profile Page Structure
- [x] Tạo profile.html
- [x] Hero section với ảnh và thông tin cơ bản
- [x] About section
- [x] Current Work section
- [x] Fundamental Faith section
- [x] Skills/Interests section
- [x] Social links section

#### Step 7: Profile Page Styling
- [x] Apply TailwindCSS và Bootstrap
- [x] Responsive design
- [x] Animations và transitions
- [x] Image optimization (placeholder with error handling)
- [x] Test trên các devices (responsive CSS added)

**📋 Technical Implementation (Phase 3):**
- **Profile Layout**: Built `profile.html` with a split-screen design (Avatar left/top, Info right/bottom) using Bootstrap grid.
- **Hardcoded Content**: Decided to hardcode profile data directly in HTML for better SEO and easier editing, rather than fetching from JSON.
- **Interactive Elements**: Added hover effects to social icons and skill badges using custom CSS utility classes.


---

### **PHASE 4: BLOGS SYSTEM** (Step 8-11)

#### Step 8: Blogs Data Structure
- [x] Tạo blogs.json với sample data
- [x] Define JSON schema
- [x] Tạo 3 sample blog posts

#### Step 9: Blogs List Page
- [x] Tạo blogs.html
- [x] Implement blog card component
- [x] Load blogs từ JSON
- [ ] Grid/List layout toggle (optional)
- [x] Filter by category
- [x] Search functionality

#### Step 10: Blog Detail Page
- [x] Tạo blog-detail.html (template)
- [x] Implement dynamic content loading từ JSON
- [x] URL routing với query params (slug)
- [x] Previous/Next navigation
- [x] Related posts
- [x] Reading time display (from data)
- [x] Reading progress bar

#### Step 11: Blog Features
- [x] Share buttons (Web Share + clipboard fallback)
- [x] Print functionality
- [ ] Dark mode toggle (optional)
- [ ] Font size adjustment (optional)

**📋 Technical Implementation (Phase 4):**
- **Data Source**: Created `blogs.json` to store post metadata and content.
- **Dynamic Rendering**: `blogs.js` fetches JSON and uses `innerHTML` to render cards.
- **Search & Filter**: Implemented client-side filtering (by category/tag/title) with debounce to optimize performance.
- **Routing**: `blog-detail.html` uses `URLSearchParams` to identify which post to load (e.g., `?slug=my-post`).


---

### **PHASE 5: DOCUMENTS SYSTEM** (Step 12-15)

#### Step 12: Documents Data Structure
- [x] Tạo docs.json với sample data
- [ ] Upload sample PDF files vào assets/pdfs/ (placeholder paths)
- [ ] Tạo thumbnails cho PDFs (optional)

#### Step 13: Documents List Page
- [x] Tạo docs.html
- [x] Document card component
- [x] Load documents từ JSON
- [x] Filter và search
- [ ] File size formatting (dùng dữ liệu có sẵn)

#### Step 14: PDF Preview System
- [x] Integrate PDF.js (embed viewer via hosted PDF.js)
- [x] Tạo preview modal
- [ ] Implement PDF viewer controls (zoom/nav/fullscreen) - viewer cung cấp sẵn
- [x] Download button trong modal
- [x] Error handling (toast + placeholder)

#### Step 15: Download Functionality
- [x] Download button implementation
- [x] Download counter (localStorage)
- [ ] Download progress indicator (optional)
- [ ] File validation

**📋 Technical Implementation (Phase 5):**
- **PDF Viewer**: Integrated Mozilla's `PDF.js` via iframe to allow reading documents without leaving the site.
- **Listing**: Similar to Blogs, `docs.js` fetches `docs.json` to render the document library grid.
- **Preview Modal**: Used a full-screen Bootstrap modal to contain the PDF viewer for an immersive reading experience.


---

### **PHASE 6: PRAYERS PAGE** (Step 16-18)

#### Step 16: Prayers Page Structure
- [x] Tạo prayers.html
- [x] Prayer request form
- [x] Prayer list display
- [x] Prayer card component

#### Step 17: Prayers Functionality
- [x] Form validation
- [x] Save prayer requests (localStorage)
- [x] Display prayer list
- [x] Filter: All/Answered/Unanswered
- [x] Mark as answered feature
- [x] Delete prayer request

#### Step 18: Prayers Integration
- [x] Prayer counter
- [x] Share prayer functionality
- [ ] Integrate với Formspree (optional - để gửi email)
- [ ] Export prayers (optional)

**📋 Technical Implementation (Phase 6):**
- **Local Storage**: Implemented `prayers.js` to save requests to browser's `localStorage` for simplified persistence without a backend (initially).
- **CRUD Operations**: Wrote functions to Add, Remove, and Update prayer status (Answered/Unanswered) directly in the DOM.
- **UI Feedback**: Used Toast notifications to confirm actions like "Prayer Submitted" or "Deleted".


---

### **PHASE 7: DONATE PAGE** (Step 19-20)

#### Step 19: Donate Page Structure
- [x] Tạo donate.html
- [x] QR Code display section (Responsive)
- [x] Bank account information section
- [x] Thank you message section
- [x] Request Appeal Modal (Feature added)
- [x] Navbar & Footer consistent with Landing Page

#### Step 20: Donate Features
- [x] QR Code image (`assets/images/donate/personal_qr.jpg`)
- [x] Copy account number button
- [x] "Gửi yêu cầu kêu gọi" feature (mailto Integration)
- [x] Donation purpose explanation
- [x] Contact information

**📋 Technical Implementation (Phase 7):**
- **Read-only Mode**: Simplified `donate.js` to remove redundant CRUD logic, focusing on displaying appeals from `appeals.json`.
- **Request Modal**: Integrated Bootstrap 5 Modal for "Request Appeal", preventing accidental submissions by using a direct `mailto:` link generator in JavaScript.
- **QR Code Path**: Updated image path to `assets/images/donate/personal_qr.jpg` to organize assets better.



---

### **PHASE 8: LANDING PAGE** (Step 21-22)

#### Step 21: Landing Page (index.html)
- [x] Hero section với CTA
- [x] Quick navigation cards:
  - Profile card
  - Blogs card
  - Docs card
  - Prayers card
  - Donate card
- [x] Featured content section
- [x] Call-to-action sections
- [x] Footer section: email, number, address, social links

#### Step 22: Landing Page Polish
- [x] Animations và transitions
- [x] Parallax effects (optional)
- [x] Smooth scrolling
- [x] Interactive elements

**📋 Technical Implementation (Phase 8):**
- **Structure**: Rewrote `index.html` to remove legacy "My Profile" sections, replacing them with a modern Hero section (`hero_bg.png`), "Why Join?" features, and "Verse of the Day".
- **Animations**: Implemented `IntersectionObserver` in `main.js` to trigger `.fade-in-up` animations when elements scroll into view.
- **Components**: Standardized Navbar and Footer across all pages (`donate.html`, `prayers.html`, etc.) for consistent branding ("TrieuMinistry").


---

### **PHASE 9: OPTIMIZATION & POLISH** (Step 23-26)

#### Step 23: Performance Optimization
- [x] Image optimization (compress, WebP format)
- [x] Lazy loading cho images (`loading="lazy"`)
- [ ] Minify CSS và JavaScript
- [ ] Code splitting (nếu cần)
- [ ] Cache strategy

#### Step 24: SEO Optimization
- [x] Meta tags cho mỗi page
- [x] Open Graph tags (Facebook/Zalo sharing)
- [x] Structured data (JSON-LD for Organization & Person)
- [x] Sitemap.xml
- [x] robots.txt

#### Step 25: Accessibility
- [x] Alt text cho images
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast check

#### Step 26: Cross-browser Testing
- [x] Test trên Chrome
- [x] Test trên Firefox
- [x] Test trên Safari
- [x] Test trên Edge
- [x] Test trên mobile browsers

**📋 Technical Implementation (Phase 9):**
- **SEO**: Added Open Graph tags (`og:title`, `og:image`) to all HTML pages for better social sharing.
- **Schema**: Injected JSON-LD structured data (`Organization`, `Person`) into `index.html` and `profile.html` to help Google Search understand the site content.
- **Performance**: Added `loading="lazy"` to all `<img>` tags (including dynamic ones in `blogs.js`) to speed up initial page load.
- **Crawlers**: Created `robots.txt` and `sitemap.xml` to guide search engine bots.


---

### **PHASE 10: ENHANCEMENTS & FIREBASE** (Step 27-29)

#### Step 27: UI/UX Enhancements
- [ ] **Favicon**: Create and link custom favicon.
- [ ] **Animations**:
    - [ ] Navbar transitions (backdrop blur).
    - [ ] Hover effects for buttons/cards (`hover-lift`, `hover-scale`).
    - [ ] Page transitions.

#### Step 28: Firebase Integration (Prayers)
- [ ] **Setup**: Create Firebase Project & Config.
- [ ] **Backend**: Replace LocalStorage with Firestore Database.
- [ ] **Features**:
    - [ ] Real-time Prayer Requests.
    - [ ] Live "Amen/Praying" counter.

#### Step 29: Progressive Web App (PWA)
- [ ] **Manifest**: Create `manifest.json`.
- [ ] **Icons**: Generate app icons (192x192, 512x512).
- [ ] **Installable**: Allow "Add to Home Screen".

**📋 Technical Implementation (Planned - Phase 10):**
- **Visuals**: Will add `favicon.ico` and smooth Navbar animations using CSS backdrop-filter.
- **Firebase**: Will proceed with Firebase Firestore setup. Instead of `localStorage.setItem`, the app will use `addDoc(collection(db, "prayers"), data)`.
- **PWA**: Will generate a `manifest.json` file linked in `<head>` so mobile browsers recognize the site as an installable app.


---

### **PHASE 11: DEPLOYMENT** (Step 30-32)

#### Step 30: GitHub Setup
- [ ] Push code lên GitHub
- [ ] Setup GitHub Pages
- [ ] Configure custom domain (nếu có)
- [ ] Test deployment

#### Step 31: Documentation
- [ ] Update README.md với:
  - Project description
  - Setup instructions
  - How to add new blog posts
  - How to add new documents
  - Deployment guide
- [ ] Code comments
- [ ] Usage guide

#### Step 32: Final Testing & Launch
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
- **Phase 10:** 2-3 ngày (Enhancements & Firebase)
- **Phase 11:** 1-2 ngày (Deployment)

**Tổng ước tính:** 22-32 ngày làm việc (tùy vào tốc độ và độ phức tạp)

---

## ✅ NEXT STEPS

1. Review plan này và confirm
2. Bắt đầu với Phase 1: Setup & Foundation
3. Update progress trong PLAN.md
4. Test từng phase trước khi chuyển sang phase tiếp theo

---

**Chúc bạn thành công với dự án! 🎉**

