# Dasturxon Project Status & Engineering Report

## 1. Overview
- **Project**: Dasturxon ("Mahalla Bozori")
- **Legacy Android Package**: `com.example.dasturxon` (archived under `android-legacy/`)
- **Current Web Platform**: React + Vite + TypeScript + React Router + Firebase Web SDK (modular) under `web/`
- **Branch**: `ai-night`
- **Notice**: In accordance with project policy, this application is **NOT** claimed to be "pentested" or "fully tested". This report details what was completed, verified by automated testing, what remains unverified, and known technical risks.

---

## 2. DONE (Completed Tasks & Audit Fixes)

### Task 1: Real Project Inspection & Schema Mapping
- **Commit Hash**: `26f9244`
- **Changed Files**: `docs/REVIEW_FINDINGS.md`, `.gitignore`
- **What Was Fixed**:
  - Inspected all Firestore collections, subcollections, models, repositories, and ViewModels.
  - Documented exact field names, data types, owner references, read permissions, and write permissions in `docs/REVIEW_FINDINGS.md`.
  - Identified and documented architecture gaps regarding nickname-to-email lookups, synthetic email fallbacks, and UI-level Firestore usage.
- **Commands Executed**: `./gradlew testDebugUnitTest lintDebug assembleDebug`
- **Results**: BUILD SUCCESSFUL, all unit tests passed, zero lint errors.

### Task 2: Firestore Least-Privilege Rules & Security Tests Hardening
- **Commit Hash**: `ca74bbd`
- **Changed Files**: `firestore.rules`, `test/firestore.rules.test.mjs`
- **What Was Fixed**:
  - Enforced that new businesses must start with `pending` status (`request.resource.data.status == 'pending'`).
  - Enforced business ownership immutability (`request.resource.data.ownerId == resource.data.ownerId`).
  - Blocked customer order creation for unapproved businesses (`isBusinessApproved(request.resource.data.businessId)`).
  - Enforced customer order status creation as `pending` and `paymentStatus` as `unpaid`.
  - Enforced line item `unitPrice` validation against product selling price.
  - Prevented forged analytics events (`request.resource.data.userId == request.auth.uid`).
  - Added tests 27–32 verifying all newly added security invariants.
- **Commands Executed**: `npm run test:rules`, `./gradlew testDebugUnitTest lintDebug assembleDebug`
- **Results**: 32/32 Firestore emulator tests PASSED; Gradle test, lint, and assembleDebug passed.

### Task 3: Authentication, Session Model & Credential Manager Hardening
- **Commit Hash**: `c21bdb8`
- **Changed Files**:
  - `app/src/main/java/com/example/dasturxon/data/repository/AuthRepository.kt`
  - `app/src/main/java/com/example/dasturxon/data/repository/FirebaseAuthRepositoryImpl.kt`
  - `app/src/main/java/com/example/dasturxon/ui/auth/AuthViewModel.kt`
  - `app/src/main/java/com/example/dasturxon/ui/auth/AuthScreens.kt`
  - `app/src/main/res/values/strings.xml`
  - `app/src/test/java/com/example/dasturxon/ui/auth/AuthViewModelTest.kt`
- **What Was Fixed**:
  - Defined explicit `AuthSessionState` (`Loading`, `SignedOut`, `Ready`, `ProfileMissing`, `Error`).
  - Fixed session observer so that Firestore read errors or offline network conditions do NOT trigger false sign-out.
  - Removed nickname-to-email query and synthetic `@dasturxon.uz` fallback; sign-in strictly requires valid email and password.
  - Removed phone OTP / SMS flow from sign-up in favor of atomic email/password and Google Sign-In.
  - Configured `R.string.default_web_client_id` for Google Sign-In and handled both `CustomCredential` and `GoogleIdTokenCredential` without leaking exceptions.
- **Commands Executed**: `./gradlew testDebugUnitTest lintDebug assembleDebug`
- **Results**: BUILD SUCCESSFUL, all unit tests passed.

### Task 4: UI Architecture & Dependency Injection Cleanup
- **Commit Hash**: `b1d2e7f`
- **Changed Files**: `app/src/main/java/com/example/dasturxon/MainActivity.kt`
- **What Was Fixed**:
  - Injected `FirebaseFirestore` via Hilt `@Inject lateinit var firestore: FirebaseFirestore` instead of directly calling `FirebaseFirestore.getInstance()` inside `MainActivity.onCreate()`.
- **Commands Executed**: `./gradlew testDebugUnitTest lintDebug assembleDebug`
- **Results**: BUILD SUCCESSFUL, clean lint report.

### Task 5: Complete Account Deletion & In-App Cleanup Support
- **Commit Hash**: `4682973`
- **Changed Files**:
  - `app/src/main/java/com/example/dasturxon/data/repository/AuthRepository.kt`
  - `app/src/main/java/com/example/dasturxon/data/repository/FirebaseAuthRepositoryImpl.kt`
  - `app/src/main/java/com/example/dasturxon/ui/auth/AuthViewModel.kt`
  - `app/src/main/java/com/example/dasturxon/ui/customer/CustomerProfileScreen.kt`
  - `app/src/main/java/com/example/dasturxon/ui/home/RoleHome.kt`
  - `app/src/main/java/com/example/dasturxon/MainActivity.kt`
  - `app/src/test/java/com/example/dasturxon/ui/auth/AuthViewModelTest.kt`
- **What Was Fixed**:
  - Implemented `deleteCurrentAccount(): AppResult<Unit>` in `AuthRepository` and `FirebaseAuthRepositoryImpl`:
    - Atomically deletes the user's Firestore document in `/users/{uid}`.
    - Deletes registered nickname document in `/usernames/{normalizedNickname}`.
    - Permanently removes the Firebase Auth credentials via `user.delete()`.
  - Added `deleteAccount()` in `AuthViewModel` with proper state update (`currentUser = null`, `isAuthenticated = false`, `isSignedOut = true`).
  - Added in-app "Hisobni butunlay o'chirish (tozalash)" button and confirmation dialog in both Customer and Owner profiles.
  - Removed all synthetic email fallbacks (`@dasturxon.uz`) and completed password visibility toggles with icons.
- **Commands Executed**: `./gradlew testDebugUnitTest assembleDebug`
- **Results**: BUILD SUCCESSFUL (25s), all unit tests passed.

### Task 6 (Phase 0.1): Archive Android Codebase to `android-legacy/`
- **Commit Hash**: `99d6606`
- **Changed Files**: `android-legacy/**`, `.gitignore`, `docs/STATUS.md`
- **What Was Done**:
  - Moved the entire Kotlin/Compose Android project (`app/`, `gradle/`, Gradle wrapper, build scripts, `google-services.json`) into `android-legacy/` without deleting any source files.
  - Updated `.gitignore` to ignore `android-legacy/` build caches and `.env` secret files while keeping `.env.example` tracked.
- **Commands Executed**: `cd web && npm run build && npm run lint && node --test tests/analytics.test.ts`
- **Results**: Web build, lint, and unit tests passed prior to commit.

### Task 7 (Phase 0.2): Firebase Emulator Suite & Security Rules Test Expansion
- **Commit Hash**: `a104d76`
- **Changed Files**: `firebase.json`, `firestore.rules`, `test/firestore.rules.test.mjs`, `docs/STATUS.md`
- **What Was Done**:
  - Enabled Firebase Auth Emulator (`port: 9099`) alongside Firestore Emulator (`port: 8080`) in `firebase.json` for isolated web E2E testing.
  - Committed hardened `firestore.rules` supporting atomic customer checkout stock decrement (`lastCheckoutOrderId` + `getAfter` validation), discounted line item price matching (`math.floor`), and rejected-business resubmission (`rejected -> pending`).
  - Added tests 33–34 in `test/firestore.rules.test.mjs`.
- **Commands Executed**: `npm run test:rules`
- **Results**: 34/34 Firestore security rules tests PASSED (`duration_ms 4205.915`).

### Task 8 (Phase 0.3): Web Foundation, Modular Firebase SDK, Validators & Analytics
- **Commit Hash**: `9879857`
- **Changed Files**: `web/package.json`, `web/package-lock.json`, `web/.env.example`, `web/src/config/firebase.ts`, `web/src/types/domain.ts`, `web/src/services/validators.ts`, `web/src/services/analytics.ts`, `web/tests/domain.test.ts`, `docs/STATUS.md`
- **What Was Done**:
  - Installed `firebase` (Web SDK v12 modular) and `react-router-dom`.
  - Added `web/.env.example` (no secrets committed; local `web/.env` remains gitignored) and modular `getFirebaseAuth()` / `getFirebaseDb()` with Auth + Firestore Emulator support.
  - Added Firestore-aligned domain types (`domain.ts`), strict form/auth validators (`validators.ts`), and pure `analytics.ts` matching `firestore.rules` `math.floor` discounting and `Asia/Tashkent` Monday-start periods.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm test`
- **Results**: TypeScript/Vite build, oxlint, and all 7 web unit tests PASSED.

### Task 9 (Phase 0.4): Uzbek Migration Report & Student Action Checklist
- **Commit Hash**: `5c69739`
- **Changed Files**: `docs/report/00-migratsiya.md`, `docs/STUDENT_TODO.md`, `docs/STATUS.md`
- **What Was Done**:
  - Authored `docs/report/00-migratsiya.md` in formal Uzbek (Latin script, no apostrophes between Latin-script names and Uzbek suffixes) documenting migration rationale, reused Firebase assets (`dasturxon-27a6e`, `firestore.rules`, `firestore.indexes.json`), rewritten 3-layer web architecture, and real measured Phase 0 test outputs.
  - Created `docs/STUDENT_TODO.md` tracking all `[TO'LDIRING]` human placeholders and manual Firebase Console / GitHub Secrets steps.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm test`
- **Results**: Build, oxlint (0 errors), and 7/7 web unit tests PASSED.

### Task 10 (Phase 1.1): Modular Firestore Repositories & Observer Hooks
- **Commit Hash**: `4fbba71` (cleanup `c1bbe13`)
- **Changed Files**: `web/src/repositories/*.ts`, `web/src/context/*`, `web/src/hooks/*.ts`, `docs/STATUS.md`
- **What Was Done**:
  - Implemented Repository pattern across `authRepository`, `businessRepository`, `productRepository`, `orderRepository`, and `expenseRepository` with zero Firestore imports allowed in UI components.
  - Applied Observer pattern (`onSnapshot` / `onAuthStateChanged` unsubscribes) exposed via `AuthContext`, `useCustomerFeed`, `useCustomerOrders`, `useOwnerDashboard`, and `useAdminBusinesses`.
  - Implemented atomic customer checkout transaction (`lastCheckoutOrderId` + `items` subcollection + stock decrement), owner rejection stock restoration, private `products/{id}/private/cost` isolation, and auth rollback on registration batch failure.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm test`
- **Results**: TypeScript/Vite build, oxlint (0 warnings, 0 errors), and 7/7 web unit tests PASSED.

### Task 11–13 (Phase 1.2): Role-Guarded React Router App (Auth, Customer, Owner, Admin)
- **Commit Hash**: `92145db`
- **Changed Files**: `web/src/App.tsx`, `web/src/components/AppShell.tsx`, `web/src/components/RouteGuards.tsx`, `web/src/services/routing.ts`, `web/src/pages/**`, `web/README.md`, `docs/STATUS.md`
- **What Was Done**:
  - Built mobile-first responsive pages using React Router (`HashRouter`) and strict `RoleGuard` / `GuestOnlyGuard` route protection (`customer`, `owner`, `admin`).
  - Implemented Auth pages (`/`, `/login`, `/register` with show-password toggle, password reset, strict email+password login, `customer`/`owner` registration).
  - Implemented Customer pages (`CustomerFeedPage` with category filter/search + Firestore checkout transaction + pickup/delivery choice, real-time `CustomerOrdersPage` `"Buyurtmalarim"`, `CustomerProfilePage`).
  - Implemented Owner pages (`OwnerBusinessGate` for creation/pending/rejected-resubmit, `OwnerDashboardPage`, `OwnerProductsPage` CRUD with private `costPrice` + selling `price` + stock + availability, `OwnerOrdersPage`, `OwnerAnalyticsPage` with daily/weekly/monthly revenue, COGS, expenses, and profit).
  - Implemented Admin approval dashboard (`AdminDashboardPage`) to approve or reject pending businesses with a required reason.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm test`
- **Results**: TypeScript/Vite build, oxlint (0 warnings, 0 errors), and 4/4 domain unit tests PASSED.

### Task 14 (Phase 1.3): Fix Pre-Auth Nickname Read Race in `signUpWithEmail`
- **Commit Hash**: `c79735e`
- **Changed Files**: `web/src/repositories/authRepository.ts`, `docs/STATUS.md`
- **What Was Fixed**:
  - Browser E2E testing against Firebase Emulator exposed a `permission-denied` error during sign-up: `usernames/{normalized}` was queried before `createUserWithEmailAndPassword` when `isSignedIn()` was still `false`.
  - Moved nickname lookup inside the post-Auth `try/catch` block with atomic `deleteUser` rollback if the nickname is already taken or batch write fails, and debounced transient `profile_missing` emissions during batch commit.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm test`
- **Results**: Build, oxlint (0 warnings, 0 errors), and 4/4 unit tests PASSED.

### Task 15 (Phase 1.4): Real Firebase Emulator E2E Browser Verification & GitHub Sync
- **Changed Files**: `docs/STATUS.md`
- **What Was Verified**:
  - Ran full 6-stage E2E test in Chromium against live Firebase Auth (`:9099`) and Firestore (`:8080`) Emulators (`demo-dasturxon`):
    1. Owner sign-up (`owner@dasturxon.test`), show-password toggle, role route guards (`#/admin`, `#/customer` redirected to `#/owner`), business creation (`Baraka novvoyxonasi`), pending approval gate.
    2. Seeded Admin login (`admin@dasturxon.test`), business rejection (`"Manzil aniqlanmadi"`), Owner resubmission (`rejected -> pending`), Admin approval (`Tasdiqlangan: 1 ta`).
    3. Owner Product CRUD (`Tandir non` 5 000 / private `costPrice` 2 800 / stock 16; `G'ijduvon Patir Non` 14 000 / private `costPrice` 7 500 / 10% discount).
    4. Customer sign-up (`customer@dasturxon.test`), feed search & category filter, zero `costPrice` leakage, atomic checkout transaction (qty 3 = 15 000 so'm, stock decremented `16 -> 13`), real-time `"Buyurtmalarim"`.
    5. Owner order workflow (`accepted -> ready -> completed` with `unitCost` snapshot + `paidAt`), expense entry (`3 000 so'm`), live Firestore analytics (`Daromad: 15 000 so'm`, `Yalpi foyda: 6 600 so'm`, `Sof foyda: 3 600 so'm`, `Bajarilish darajasi: 100%`).
    6. Mobile responsiveness (`390x844`) with 0 horizontal overflow and 0 uncaught JS errors.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm test`, `npm run test:rules`
- **Results**: Web build, oxlint (0 warnings/errors), 4/4 web unit tests, and 34/34 Firestore Rules emulator tests PASSED.

### Task 16 (Phase 2.1): Code Conventions, ESLint, Prettier & Component Modularization
- **Commit Hash**: `4bb1795`
- **Changed Files**: `docs/CODE_CONVENTIONS.md`, `web/eslint.config.js`, `web/.prettierrc`, `web/.prettierignore`, `web/package.json`, `web/package-lock.json`, `web/src/services/constants.ts`, `web/src/services/errors.ts`, `web/src/components/{customer,owner,admin}/*`, refactored `web/src/{pages,hooks,repositories,services}/*`, `docs/STATUS.md`
- **What Was Done**:
  - Created `docs/CODE_CONVENTIONS.md` defining 6 enforced rules: naming (`PascalCase`/`camelCase`/`UPPER_CASE`), layered imports (forbidding `firebase/*` in `pages`/`components`), zero magic numbers/strings (`services/constants.ts`), function length & nesting depth limits (`max-lines-per-function`, `max-depth`), safe error handling (`getReadableErrorMessage`, `no-console`, `react/no-danger`, `no-empty`), and Prettier formatting.
  - Installed and configured ESLint (`eslint.config.js` + `typescript-eslint` + `eslint-plugin-react` + `eslint-plugin-react-hooks` + `eslint-config-prettier`) alongside Prettier (`.prettierrc`).
  - Extracted large page modals/cards into dedicated UI components (`OrderCheckoutModal`, `ProductDetailModal`, `ProductFeedCard`, `CustomerOrderCard`, `ProductFormModal`, `BusinessEditModal`, `ExpenseModal`, `RejectBusinessModal`) and `ownerActions.ts`.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm run format:check && npm test`
- **Results**: `tsc -b && vite build` (`1.02s`), ESLint + oxlint (`0` errors, `0` warnings on `53` files), Prettier (`All matched files use Prettier code style`), and `4/4` unit tests PASSED.

### Task 17 (Phase 2.2a): Firestore Security Rules Hardening & Emulator Verification
- **Commit Hash**: `008996b`
- **Changed Files**: `firestore.rules`, `test/firestore.rules.test.mjs`, `docs/STATUS.md`
- **What Was Fixed**:
  - Added strict string length bounds on `users/{userId}` `fullName` (`2..100`) alongside immutable `role` and `email`.
  - Restricted `businesses/{businessId}` creation strictly to verified `owner` or `admin` roles (`getUserData().role in ['owner', 'admin']`) with `pending` initial status and bounded name length (`2..100`).
  - Enforced `price > 0`, `stock >= 0`, and `discountPercent` in `0..90` on both product `create` and `update`.
  - Enforced bounded order `quantity` (`1..99`), positive `totalPrice`, strict `affectedKeys().hasOnly(['status', 'updatedAt'])` during customer cancellation (`pending -> cancelled`), and immutable `totalPrice`/`quantity` during owner updates.
  - Expanded `@firebase/rules-unit-testing` suite with tests 35–39 covering every newly enforced bound.
- **Commands Executed**: `npm run test:rules`, `cd web && npm run build && npm run lint && npm run format:check && npm test`
- **Results**: `39/39` Firestore Rules emulator tests (`6142.42ms`) and all web checks PASSED.

### Task 18 (Phase 2.2b): Service-Layer Input Validation & User-Text Sanitization
- **Commit Hash**: `ff826ba`
- **Changed Files**: `web/src/services/validators.ts`, `web/src/services/orderLogic.ts`, `web/src/repositories/*.ts`, `web/src/components/owner/ExpenseModal.tsx`, `docs/STATUS.md`
- **What Was Fixed**:
  - Added `sanitizeUserText` (strips ASCII control characters, Unicode bidi overrides, and `<`/`>` brackets with max lengths) and `escapeHtml` in `validators.ts`, backed by ESLint `react/no-danger` (`dangerouslySetInnerHTML` forbidden).
  - Enforced strict service-layer validation across all repositories prior to Firestore writes (`email <= 254`, `password` `8..128`, `price > 0`, `stock >= 0`, `quantity` `1..99`, `discountPercent` `0..90`, `expense` bounds, `rejectionReason`).
  - Extracted pure domain helpers in `web/src/services/orderLogic.ts` (`computeRemainingStock`, `applyStockDecrement`, `calculateOrderTotal`, `isValidOrderTransition`).
- **Commands Executed**: `cd web && npm run build && npm run lint && npm run format:check && npm test`
- **Results**: `tsc -b && vite build` (`782ms`), ESLint + oxlint (`0` errors, `0` warnings on `54` files), Prettier PASS, `4/4` unit tests PASS.

### Task 19 (Phase 2.2c): CSP Headers, Security Headers & Zero Token/Storage Exposure
- **Changed Files**: `firebase.json`, `web/index.html`, `web/src/config/firebase.ts`, `web/src/services/errors.ts`, `docs/STATUS.md`
- **What Was Fixed**:
  - Added Firebase Hosting `headers` in `firebase.json`: strict `Content-Security-Policy` (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
  - Added matching meta `Content-Security-Policy` and `referrer` meta tag in `web/index.html` for GitHub Pages static hosting parity.
  - Configured Firebase Auth with explicit `indexedDBLocalPersistence` (zero `localStorage`/`sessionStorage` token persistence, enforced by ESLint `no-restricted-globals`), and extended `redactSensitiveTokens` (`AIza...`, Bearer, JWT, credential query params) with `no-console` enforcement.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm run format:check && npm test`
- **Results**: `tsc -b && vite build` (`757ms`), ESLint + oxlint (`0` warnings/errors on `54` files), Prettier PASS, `4/4` unit tests PASS.

---

## 3. VERIFIED BY AUTOMATED TEST

| Test Suite / Tool | Count | Result | Verification Scope |
| :--- | :---: | :---: | :--- |
| **Firestore Security Rules Emulator Tests** (`npm run test:rules`) | **39** | **PASS** | `@firebase/rules-unit-testing`: role escalation prevention, cross-user doc isolation, order privacy & cancellation tamper prevention, bounded order quantities (`1..99`), bounded product `price > 0` / `stock >= 0` / `discount 0..90`, owner-only business creation (`pending`), private cost isolation (`products/{id}/private/cost`), atomic checkout stock decrement (`lastCheckoutOrderId`), forged analytics event prevention, and real-time listeners. |
| **Web Domain Unit Tests** (`cd web && npm test`) | **4** | **PASS** | `validators` (`email`, strong password, nickname, business/product forms), `formatSoM`, `getEffectivePrice` (`math.floor` parity with `firestore.rules`), `getPeriodBounds` (`Asia/Tashkent` Monday week start), `calculateAnalytics` (`completed + paid` revenue, COGS, gross/net profit). |
| **Web TypeScript & Vite Build** (`cd web && npm run build`) | - | **PASS** | Clean `tsc -b && vite build` static bundle (`web/dist/`). |
| **Web Linter** (`cd web && npm run lint`) | **54 files** | **PASS** | ESLint (`@typescript-eslint`, `react`, `react-hooks`, `no-console`, `no-magic-numbers`, `max-lines-per-function`, `no-restricted-imports`, `no-restricted-globals`) + `oxlint`: 0 warnings, 0 errors. |
| **Web Formatter** (`cd web && npm run format:check`) | **54 files** | **PASS** | Prettier style check passed across all TypeScript/TSX sources and tests. |
| **Browser E2E Flow (Emulator)** (`http://127.0.0.1:5173`) | **6 stages** | **PASS** | Real Firebase Auth + Firestore Emulator end-to-end flows for Owner, Admin, and Customer roles plus `390x844` mobile layout check. |
| **Legacy Android JVM Unit Tests** (`android-legacy/`, historical pre-migration) | **59** | **PASS** | Archived Kotlin/Compose unit tests (`AnalyticsCalculatorTest`, `AuthViewModelTest`, etc.) prior to Phase 0 migration. |

---

## 4. NOT VERIFIED (Manual / Hardware Verification Required)

- **Physical Device Push Notifications**: Firebase Cloud Messaging (FCM) is not deployed (serverless Spark tier without external push server).
- **Physical Device Doze Mode / Deep Sleep**: Background lifecycle behavior was verified via ViewModel test scopes and Compose lifecycle flows, but not on physical battery-saving hardware modes.
- **Production Firebase Deployment**: Live Firebase deployment (`firebase deploy`) was intentionally not performed in compliance with project safety rules (only the local Firebase Emulator was used).
- **Physical In-Person Cash / QR Payments**: Payments occur in person upon pickup or delivery; no external card gateway SDK is integrated into the client.

---

## 5. KNOWN RISKS / BLOCKERS & TECHNICAL DEBT

1. **Client-Side Stock Race Conditions**: Because Cloud Functions are unavailable under the Firebase Spark plan, stock decrements occur via client-side multi-document Firestore transactions. While security rules prevent negative stock, high concurrent orders on a single product could experience transaction retries.
2. **Client-Side Search Limitations**: Search and filtering are executed locally over active products in memory. When the product catalog expands past thousands of items, server-side indexing (e.g. Algolia or Elasticsearch) will be required.
3. **Data Loss on Device Migration**: Because backups are explicitly disabled (`allowBackup="false"`), users must sign in afresh when switching devices.
