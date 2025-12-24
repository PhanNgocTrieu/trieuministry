# Implementation Plan - Prayer Security & Spam Prevention

## Goal
Secure the Prayer Request system by differentiating between **Admins** (Full Control) and **Users** (Add/Edit Own), and preventing spam submissions.

## User Review Required
> [!IMPORTANT]
> **Firebase Authentication**: We will enable **Anonymous Auth** for users (no password needed, auto-login) and **Email/Password** for Admin.
> You will need to enable these Sign-in providers in your Firebase Console.

> [!WARNING]
> **Data Migration**: Existing prayers do not have a `userId`. They will not be editable by users, only by Admin.

## Proposed Changes

### 1. Authentication (Firebase Auth)
#### [MODIFY] [firebase-config.js](file:///Users/m1/Desktop/_working/static-website/assets/js/firebase-config.js)
- Import and initialize `getAuth`.
- Export `auth` for use in other files.

### 2. Logic Implementation
#### [MODIFY] [prayers.js](file:///Users/m1/Desktop/_working/static-website/assets/js/prayers.js)
- **User Identity**: Auto-sign-in users anonymously on load.
- **Admin Login**: Add function `loginAdmin(email, password)`.
- **Ownership**: Save `userId` (uid) with new prayers.
- **UI State**: 
    - Hide "Delete" button for non-admins.
    - Hide "Edit" button for non-owners AND non-admins.
    - Show "Admin Login" button (subtle) or trigger via console/hidden UI.
- **Spam Prevention**:
    - **Honey Pot**: Add a hidden field `website_url`. If filled, reject.
    - **Rate Limit**: Check `localStorage` for last submission timestamp (e.g., limit 1 per 2 minutes).

#### [MODIFY] [prayers.html](file:///Users/m1/Desktop/_working/static-website/prayers.html)
- Add Hidden "Honey Pot" input to the form.
- Add Admin Login Modal (or a footer link to trigger it).

### 3. Security Rules
#### [NEW] [firestore.rules](file:///Users/m1/Desktop/_working/static-website/firestore.rules)
- Document the rules for the user to copy to Firebase Console.
- **Rules Logic**:
    - `read`: allow all.
    - `create`: allow if valid content & authenticated (anon or real).
    - `update`: allow if `auth.uid == resource.data.userId` OR `auth.token.admin == true`.
    - `delete`: allow ONLY if `auth.token.admin == true` (or specific admin email hardcoded).

## Verification Plan

### Automated Tests
- None (Visual/Manual verification).

### Manual Verification
1. **User Flow**:
   - Open page incognito -> Auto login Anon.
   - Post prayer -> Success.
   - Edit that prayer -> Success.
   - Try to edit older prayer -> Button missing or Error.
2. **Admin Flow**:
   - Click "Admin Login" -> Enter credentials.
   - Verify "Delete" buttons appear.
   - Delete a test prayer -> Success.
3. **Spam Flow**:
   - Fill hidden field -> Submit -> Blocked.
   - Submit 2 prayers rapidly -> Blocked by rate limit.
