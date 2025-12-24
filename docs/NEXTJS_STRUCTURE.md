# Next.js Project Structure

This document outlines the directory structure and organization of the Next.js application.

## Directory Overview

```
/
├── legacy_backup/      # Archived static website files
├── docs/               # Project documentation
│   ├── plans/          # Historical migration plans
│   └── NEXTJS_STRUCTURE.md
├── public/             # Static assets (images, fonts, robots.txt)
├── src/
│   ├── app/            # Next.js App Router pages and layouts
│   ├── components/     # Reusable React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and configurations (Firebase, etc.)
│   ├── services/       # API calls and business logic
│   ├── styles/         # Global styles and Tailwind configurations
│   └── types/          # TypeScript type definitions
├── next.config.ts      # Next.js configuration
├── tailwind.config.ts  # Tailwind CSS configuration
└── package.json
```

## Detailed Explanations

### `src/app` (App Router)

Next.js 13+ App Router uses a file-system based router.

- `page.tsx`: UI for a route.
- `layout.tsx`: Shared UI for a segment and its children.
- `loading.tsx`: Loading UI for a segment.
- `error.tsx`: Error UI for a segment.

**Naming Convention**: Folders define routes (e.g., `app/about/page.tsx` -> `/about`).

### `src/components`

Reusable UI components.

- **UI**: Generic UI elements (Buttons, Cards, Modals).
- **Feature-specific**: Components tied to a specific feature (e.g., `BlogCard`, `PrayerForm`).

### `src/lib`

Core configuration and helper functions.

- `firebase.ts`: Firebase initialization and auth instances.
- `utils.ts`: Generic helper functions (date formatting, etc.).

### `src/services`

Logic for data fetching and external API interactions.

- separates data fetching logic from UI components.

### `src/types`

TypeScript interfaces and types to ensure type safety across the application.

- `blog.ts`, `user.ts`, `prayer.ts`.
