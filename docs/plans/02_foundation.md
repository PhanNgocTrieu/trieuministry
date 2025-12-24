# Migration Roadmap: Static to Next.js

## Overview

This roadmap outlines the steps to migrate the existing static website to a Next.js 15 application.

## Phase 1: Project Structure & Documentation

**Goal**: Define and document the Next.js folder structure to establish a clear understanding of the codebase organization.

- [x] **Plan History Setup**: Create `docs/plans/` and save the initial plan as `docs/plans/01_structure.md`. (This practice will be followed for every phase).
- [x] **Directory Setup**: Initialize standard folders: `src/components`, `src/lib`, `src/types`, `src/hooks`, `src/services`, `src/styles`.
- [x] **Structure Documentation**: Create `docs/NEXTJS_STRUCTURE.md` explaining the purpose of each directory, naming conventions, and the App Router architecture.

## Phase 2: Foundation & Shared Assets

**Goal**: Set up the base layout, styles, and shared components.

- [ ] **Configure Tailwind & Global Styles**: Migrate `assets/css/main.css` and base styles to `src/app/globals.css`.
- [ ] **Asset Migration**: Move images and public assets from `legacy_backup/assets` to `public/`.
- [ ] **Layout Component**: Create `src/app/layout.tsx` incorporating the Navbar and Footer.
- [ ] **I18n Setup**: Set up internationalization.

## Phase 3: Core Static Pages

**Goal**: Port static content pages to React components.

- [ ] **Home Page**: Migrate `index.html` to `src/app/page.tsx`.
- [ ] **Ministry Page**: Migrate `ministry.html` to `src/app/ministry/page.tsx`.
- [ ] **Donate Page**: Migrate `donate.html` to `src/app/donate/page.tsx`.
- [ ] **Docs Page**: Migrate `docs.html` to `src/app/docs/page.tsx`.

## Phase 4: Dynamic Features (Blogs & Prayers)

**Goal**: Implement features that require data handling.

- [ ] **Blog System**: Migrate blogs and detail pages; set up data fetching.
- [ ] **Prayer Wall**: Migrate prayers page and interactive features.

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
