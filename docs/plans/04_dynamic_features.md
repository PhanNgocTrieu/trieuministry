# Migration Roadmap: Static to Next.js

## Overview

This roadmap outlines the steps to migrate the existing static website to a Next.js 15 application.

## Phase 1: Project Structure & Documentation

**Goal**: Define and document the Next.js folder structure to establish a clear understanding of the codebase organization.

- [x] **Plan History Setup**: Create `docs/plans/` and save the initial plan as `docs/plans/01_structure.md`.
- [x] **Directory Setup**: Initialize standard folders: `src/components`, `src/lib`, `src/types`, `src/hooks`, `src/services`, `src/styles`.
- [x] **Structure Documentation**: Create `docs/NEXTJS_STRUCTURE.md` explaining the purpose of each directory, naming conventions, and the App Router architecture.

## Phase 2: Foundation & Shared Assets

**Goal**: Set up the base layout, styles, and shared components.

- [x] **Configure Tailwind & Global Styles**: Migrate `assets/css/main.css` and base styles to `src/app/globals.css`.
- [x] **Asset Migration**: Move images and public assets from `legacy_backup/assets` to `public/`.
- [x] **Layout Component**: Create `src/app/layout.tsx` incorporating the Navbar and Footer.
- [x] **I18n Setup**: Set up internationalization.

## Phase 3: Core Static Pages

**Goal**: Port static content pages to React components.

- [x] **Home Page**: Migrate `index.html` to `src/app/page.tsx` with Newsletter section.
- [x] **Ministry Page**: Migrate `ministry.html` to `src/app/ministry/page.tsx`.
- [x] **Donate Page**: Migrate `donate.html` to `src/app/donate/page.tsx`.
- [x] **Docs Page**: Migrate `docs.html` to `src/app/docs/page.tsx`.

## Phase 4: Dynamic Features (Blogs & Prayers)

**Goal**: Implement features that require data handling (Interim: Mock Data / UI Structure).

- [ ] **Blog List Page**: Create `src/app/blogs/page.tsx` with search and category filters.
- [ ] **Blog Post Page**: Create dynamic route `src/app/blogs/[id]/page.tsx` for individual posts.
- [ ] **Mock Data**: Create `src/data/blogs.json` to simulate CMS data.
- [ ] **Prayer Page**: Create `src/app/prayers/page.tsx` with statistics and list of prayers.
- [ ] **Prayer Modal**: Implement "Add Prayer" modal (frontend logic).

## Phase 5: Authentication & User Management

**Goal**: Re-implement Firebase Auth.

- [ ] **Firebase Config**: Port config to `src/lib/firebase.ts`.
- [ ] **Auth Context**: Implement global auth state.
- [ ] **Auth Pages**: Login, Register, Profile.

## Phase 6: Admin Dashboard

**Goal**: Secure admin capabilities.

- [ ] **Admin Route**: Migrate `admin.html` to protected `src/app/admin/page.tsx`.

## Phase 7: Optimization & Deployment

- [ ] **SEO & Metadata**.
- [ ] **Performance Optimization**.
- [ ] **Deploy**.
