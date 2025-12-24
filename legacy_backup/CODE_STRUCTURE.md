# Project Code Structure

This document provides an overview of the TrieuMinistry project structure to help developers understand the organization and key components.

## Directory Structure

```
/
├── index.html              # Homepage
├── admin.html              # Admin Dashboard (Protected)
├── blogs.html              # Public Blog List
├── blog-detail.html        # Single Blog View
├── login.html / register.html # Authentication Pages
├── ... (other pages: donate, ministry, prayers, docs, profile)
│
├── assets/
│   ├── css/
│   │   └── main.css        # Global styles and variables
│   │
│   ├── js/
│   │   ├── firebase-config.js # Firebase setup & exports (Auth, Firestore)
│   │   ├── auth.js         # Authentication helpers
│   │   ├── admin.js        # Admin Dashboard logic (CRUD, Stats)
│   │   ├── blogs.js        # Public Blog List logic
│   │   ├── blog-detail.js  # Blog Detail logic
│   │   ├── user-nav.js     # User navigation handling (Avatar/Login btn)
│   │   ├── i18n.js         # Internationalization logic
│   │   ├── router.js       # Simple client-side routing helpers
│   │   ├── components.js   # UI Components (Toasts, Spinners)
│   │   └── main.js         # Global initialization
│   │
│   └── data/
│       ├── en.json         # English translations
│       ├── vi.json         # Vietnamese translations
│       └── blogs.json      # (Legacy) Static blog data, now migrated to Firestore
│
├── docs/
│   ├── planning/           # Project planning & implementation docs
│   └── ...                 # Other documentation
│
└── templates/              # HTML fragments (header, footer) for inclusion
```

## Key Components

### 1. Technology Stack
- **Frontend**: Vanilla HTML/CSS/JavaScript + Bootstrap 5.
- **Backend/Database**: Firebase (Firestore, Authentication).
- **Hosting**: GitHub Pages (Static Hosting).

### 2. Authentication Flow
- **Config**: `assets/js/firebase-config.js` initializes Firebase.
- **Pages**: `login.html` and `register.html` handle user input.
- **State**: `assets/js/user-nav.js` listens to `onAuthStateChanged` to update the navigation bar (Toggle Login button vs User Avatar).
- **Admin**: `admin.html` and `assets/js/admin.js` strictly check for authorized emails (whitelist) before granting access.

### 3. Blog System
- **Data Source**: Firestore (`blogs` collection).
- **Listing**: `blogs.html` + `assets/js/blogs.js` fetches and displays posts.
  - Supports "Load More" or infinite scroll logic (if implemented) or simple list.
  - Generates links to `blog-detail.html?slug=...`.
- **Detail**: `blog-detail.html` + `assets/js/blog-detail.js` reads the `slug` URL parameter to fetch the specific document from Firestore.
- **Management**: `admin.html` allows creating, editing, and deleting blogs.

### 4. Internationalization (i18n)
- handled by `assets/js/i18n.js`.
- Detects language valid from URL or LocalStorage.
- Fetches JSON from `assets/data/`.
- Replaces content of elements with `data-i18n="key"`.

### 5. UI Components
- **Toasts & Modals**: `assets/js/components.js` wraps Bootstrap's native components for easier usage (`Components.Toast.success(...)`).
- **Spinner**: `Components.LoadingSpinner` for async operations.

## Maintenance Guide

### How to Add a New Page
1. Duplicate a simple page like `docs.html` or `index.html`.
2. Update the `meta` tags and content.
3. Ensure `navbar` and `footer` are correct (or loaded via script).
4. Add translations to `vi.json` and `en.json` if using i18n.

### How to Deploy
1. Commit and Push changes to the `main` (or feature) branch.
2. GitHub Actions (if configured) or GitHub Pages settings will auto-deploy the static files.
