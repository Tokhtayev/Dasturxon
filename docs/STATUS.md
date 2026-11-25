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
- **Changed Files**: `web/package.json`, `web/package-lock.json`, `web/.env.example`, `web/src/config/firebase.ts`, `web/src/types/domain.ts`, `web/src/services/validators.ts`, `web/src/services/analytics.ts`, `web/tests/domain.test.ts`, `docs/STATUS.md`
- **What Was Done**:
  - Installed `firebase` (Web SDK v12 modular) and `react-router-dom`.
  - Added `web/.env.example` (no secrets committed; local `web/.env` remains gitignored) and modular `getFirebaseAuth()` / `getFirebaseDb()` with Auth + Firestore Emulator support.
  - Added Firestore-aligned domain types (`domain.ts`), strict form/auth validators (`validators.ts`), and pure `analytics.ts` matching `firestore.rules` `math.floor` discounting and `Asia/Tashkent` Monday-start periods.
- **Commands Executed**: `cd web && npm run build && npm run lint && npm test`
- **Results**: TypeScript/Vite build, oxlint, and all 7 web unit tests PASSED.

---

## 3. VERIFIED BY AUTOMATED TEST

| Test Suite / Tool | Count | Result | Verification Scope |
| :--- | :---: | :---: | :--- |
| **Firestore Security Rules Emulator Tests** (`npm run test:rules`) | **34** | **PASS** | Role escalation prevention, cross-user doc isolation, order privacy, cross-owner product isolation, private cost subcollection isolation (`products/{id}/private/cost`), public costPrice prohibition, business creation forced to `pending`, rejected business resubmission, business ownership immutability, unapproved business order creation block, atomic checkout stock decrement (`lastCheckoutOrderId`), order line item `unitPrice` validation, customer cancellation constraints, owner `unitCost` snapshot, expense isolation, forged analytics event prevention, and real-time snapshot listeners. |
| **JVM Unit Tests** (`./gradlew testDebugUnitTest`) | **59** | **PASS** | `AnalyticsCalculatorTest` (7), `CustomerOrderModelTest` (3), `ExpenseModelTest` (3), `ProductModelTest` (3), `OrderStatusTest` (3), `AuthRepositoryErrorMappingTest` (4), `BusinessTypeTest` (4), `DomainValidationTest` (10), `OrderHistoryPagingTest` (4), `AuthViewModelTest` (8), `CustomerOrdersViewModelTest` (9), `ExampleUnitTest` (1). |
| **Android Lint** (`./gradlew lintDebug`) | - | **PASS** | Zero fatal errors; clean resource, accessibility, manifest, and component security checks. |
| **Debug Build Packaging** (`./gradlew assembleDebug`) | - | **PASS** | Debug APK built successfully with all Kotlin/Java and Hilt dependencies resolved. |

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
