# Phase 5: Authentication Implementation Plan

## Goal

Integrate Firebase Authentication into the Next.js application to replace the current mock implementations and enable real user management.

## Key Features

1.  **Global Auth State**: Manage user session via React Context.
2.  **Authentication Pages**: Login, Register, Forgot Password.
3.  **Protected Routes**: Mechanism to protect pages (like Admin Dashboard).
4.  **User Profile**: Dynamic profile page for logged-in users.

## Implementation Steps

### 1. Firebase Configuration

- Create `src/lib/firebase.ts` to initialize Firebase App, Auth, and Firestore.
- Use environment variables for configuration.

### 2. Auth Context

- Create `src/context/AuthContext.tsx`.
- Provide `user`, `loading`, `signIn`, `signUp`, `logout` methods.
- Wrap application in `AuthProvider` (inside `src/app/providers.tsx`).

### 3. Auth Pages

- **Login**: `src/app/login/page.tsx`
  - Email/Password login.
  - Google Sign-In (optional/future).
- **Register**: `src/app/register/page.tsx`
  - Name, Email, Password.
- **Forgot Password**: `src/app/forgot-password/page.tsx`.

### 4. Integration

- Update `Navbar.tsx` to show "Login" or User Avatar based on auth state.
- Update `src/app/prayers/page.tsx` to use real user ID when adding prayers (if logged in).

### 5. Protected Route HOC (or Middleware)

- Create a utility or hook to protect routes (e.g., `useRequireAuth`).

## Environment Variables

Create `.env.local` (and add to `.gitignore`) with:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCn_mealz-OoEI9jBav5jhoq-sxeQhaS8M
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=trieuministry.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=trieuministry
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=trieuministry.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=741896838004
NEXT_PUBLIC_FIREBASE_APP_ID=1:741896838004:web:024ebc3397658df76aaa21
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ZDWXMP9CZ9
```
