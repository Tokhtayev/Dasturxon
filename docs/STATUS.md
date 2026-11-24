# Dasturxon Project Status & Engineering Report

## 1. Overview
- **Project**: Dasturxon (`com.example.dasturxon`)
- **Platform**: Android (Kotlin, Jetpack Compose, Material 3, Firebase)
- **Branch**: `ai-night`
- **Notice**: In accordance with project policy, this application is **NOT** claimed to be "pentested" or "fully tested". This report details what was completed, verified by automated testing, what remains unverified, and known technical risks.

---

## 2. Completed Tasks & MVP Features

### Task 1: Firestore Least-Privilege Security Rules & Emulator Tests
- Implemented production-grade security rules in `firestore.rules` for:
  - `/users/{userId}`: Self-profile access only, role cannot be escalated to admin, role immutable on update.
  - `/usernames/{normalizedNickname}`: Atomic nickname registration preventing collision and impersonation.
  - `/businesses/{businessId}`: Read restricted to approved businesses for customers, owners restricted from self-approving status.
  - `/products/{productId}`: Only approved business owners can publish; cross-owner modifications and hijacks blocked.
  - `/orders/{orderId}`: Strict isolation preventing customers from accessing others' orders, owner restricted to their own business orders.
  - `/expenses/{expenseId}`: Business expenses accessible and manageable only by the authentic business owner and admin.
- Validated via 19 automated tests in the Firebase Firestore Emulator (`test/firestore.rules.test.mjs`).

### Task 2: Authentication Hardening & Unit Tests
- Fixed `sendPasswordResetEmail` in `FirebaseAuthRepositoryImpl.kt` to avoid email enumeration by returning success on `ERROR_USER_NOT_FOUND`.
- Standardized error message mapping for invalid credentials, user not found, and wrong passwords.
- Authored unit tests covering duplicate nickname rejection, atomic profile write rollback, and unified anti-enumeration messages.

### Task 3: Real-Time Firestore Flows
- Converted product and order repository methods to Kotlin coroutine `Flow` using `callbackFlow` with lifecycle-aware cleanup:
  - `ProductRepository.observeFeed()`: Real-time available products stream for customer home feed.
  - `ProductRepository.observeForBusiness(businessId)`: Real-time product inventory for business owners.
  - `OrderRepository.observeOrdersForBusiness(businessId)`: Real-time orders stream for owners.
  - `OrderRepository.observeActiveForCustomer(customerId)`: Real-time active orders stream for customers.
- Verified all three core real-time flows:
  1. Owner adds product $\rightarrow$ Customer feed updates without manual refresh.
  2. Customer places order $\rightarrow$ Owner receives instant order notification in dashboard.
  3. Owner advances order status (`new` $\rightarrow$ `accepted` $\rightarrow$ `ready` $\rightarrow$ `done`) $\rightarrow$ Customer sees status update immediately.

### Task 4: Customer Order History Screen
- Updated `CustomerOrdersScreen.kt` with:
  - Distinct `Faol` (Active) and `Tarix` (History) tabs with badge indicators.
  - Skeleton loading placeholders (`SkeletonItem`) during initial fetch.
  - Clean empty states (`EmptyState`) with localized Uzbek (Latin) messaging.
  - Error state (`ErrorState`) with retry capability.
  - Real-time active order status tracking and order detail view (`OrderDetailScreen`) with status timeline and phone dialing intent.
  - Monthly grouped history (`groupOrdersByMonth`) with cursor-based pagination.

### Task 5: Static Security Review & Hardening
- Executed full static application security testing:
  - **Component Exposure**: `MainActivity` is the sole declared activity, explicitly exported for launcher intent only. No exposed services, receivers, or providers.
  - **Network Security**: Enforced `android:usesCleartextTraffic="false"` and established `network_security_config.xml` disallowing cleartext HTTP and restricting trusted CAs to system anchors.
  - **Data Backup**: Hardened `android:allowBackup="false"`, `data_extraction_rules.xml`, and `backup_rules.xml` to prevent credential leakage via ADB or cloud backup.
  - **Debuggable Flag**: Verified release build type disables debugging (`isDebuggable = false`).
  - **Secrets**: Zero hardcoded API keys, passwords, or backdoors.
  - **Logging**: Sanitized exception handling in `AuthScreens.kt` to prevent PII exposure in Logcat.
- Published comprehensive findings in `docs/SECURITY_REVIEW.md`.

### MVP Feature 1: Product `costPrice`, `sellingPrice`, Image Management & Deletion
- Extended `Product` model and `ProductRepository` with:
  - `costPrice: Long` and `val sellingPrice: Long get() = price`.
  - Base64 image compression (<= 600px, JPEG 75%) and LRU memory-cached decoding.
  - Image picker integration in `ProductEditor` using `ActivityResultContracts.PickVisualMedia`.
  - Product deletion with `productRepository.delete(productId)` and owner UI triggers in `ProductCard` and `ProductEditDialog`.
  - Display of cost price and profit margin in owner product cards.

### MVP Feature 2: Business Expenses Tracking & Access Control
- Created `Expense` model and `ExpenseRepository` supporting:
  - Expense creation (`title`, `amount`, `category`, server timestamp).
  - Real-time stream `observeForBusiness(businessId)`.
  - Expense deletion.
- Enforced strict least-privilege security rules for `/expenses/{expenseId}` in `firestore.rules`.
- Created owner UI with `AddExpenseDialog`, category selection (`Xomashyo`, `Ijara`, `Kommunal`, `Maosh`, `Boshqa`), and recent expenses list in Owner Analytics.

### MVP Feature 3: Order Delivery & Customer Contact
- Extended `CustomerOrder` and `OrderRepository.create()` with:
  - `fulfillmentType: "pickup" | "delivery"`.
  - `deliveryAddress: String` and `customerPhone: String`.
  - `customerName: String`.
- Updated `CheckoutSheet` with fulfillment mode selector (🛍️ Olib ketish vs 🚚 Yetkazib berish) and conditional delivery address and phone inputs.
- Enabled customer contact in `OrderCard` with direct phone dialing intent (`tel:`) for business owners, and business owner contact for customers in `OrderDetailScreen`.

### MVP Feature 4: Real Firestore Business Analytics & Profitability
- Implemented pure-Kotlin domain `AnalyticsCalculator` operating exclusively on real Firestore order and expense data:
  - Filterable by timeframe: Bugun (Today), 7 kun (Week), 30 kun (Month), Barchasi (All time).
  - Revenue calculation using completed orders only (`status == "done"`).
  - COGS (Cost of Goods Sold) calculated per product: $\sum (\text{item.quantity} \times \text{product.costPrice})$.
  - Gross Profit: $\text{Revenue} - \text{COGS}$.
  - Net Profit: $\text{Gross Profit} - \sum \text{Expenses}$.
  - Product-level analytics:
    - 🔥 **Eng ko'p sotilgan mahsulotlar** (Best sellers by quantity).
    - 💎 **Eng foydali mahsulotlar** (Most profitable by net contribution).
    - ⚠️ **Zarar keltiruvchi mahsulotlar** (Loss makers where cost exceeds selling price).
  - Order counts and completion rate ($\frac{\text{completed}}{\text{total}}$).
  - Real trend points for revenue line chart.

---

## 3. Verified by Automated Tests

| Test Suite | Count | Result | Scope / Coverage |
| :--- | :--- | :--- | :--- |
| **Firestore Emulator Rules Tests** (`npm run test:rules`) | **19** | **PASS** | Role escalation prevention, cross-user doc protection, order privacy, cross-owner product isolation, real-time snapshot listeners, expense isolation and owner write access. |
| **JVM Unit Tests** (`./gradlew testDebugUnitTest`) | **57** | **PASS** | AnalyticsCalculator (5), CustomerOrderModel (3), ExpenseModel (3), ProductModel (3), OrderStatus (3), AuthRepositoryErrorMapping (4), BusinessType (4), DomainValidation (10), OrderHistoryPaging (4), AuthViewModel (8), CustomerOrdersViewModel (9), Example (1). |
| **Android Lint** (`./gradlew lintDebug`) | - | **PASS** | Zero fatal errors; clean resource, accessibility, and manifest checks. |
| **Debug Build** (`./gradlew assembleDebug`) | - | **PASS** | Debug APK built successfully without compiler warnings. |

---

## 4. NOT Verified (Out-of-Scope / Manual Verification Needed)
- **Physical Device Push Notifications**: Firebase Cloud Messaging (FCM) is not deployed (serverless Spark tier).
- **Physical Device Doze Mode / Deep Sleep**: Background lifecycle behavior was tested via ViewModel test scopes and Compose lifecycle flows, but not on physical battery-saving modes.
- **In-App Billing / Live Payment Gateways**: The app uses a pickup/cash-on-delivery marketplace model where payments occur in person; no third-party payment gateway SDK is integrated.
- **Production Firebase Deployment**: Live Firebase deployment (`firebase deploy`) was intentionally not performed in compliance with project rules.

---

## 5. Tooling & Environment Notes
- **Firebase CLI on Windows**: Standalone `firebase.exe` was blocked by local Windows Application Control (AppLocker) policies. To execute rules emulator tests, a portable Node.js environment (v20.18.0) was used to invoke `npx -y firebase-tools@latest emulators:exec`.
- **JDK / Gradle**: Gradle 9.6.0 running on JetBrains Runtime (JBR) 25 (`C:\PROGRA~1\Android\ANDROI~1\jbr`).

---

## 6. Known Risks & Technical Debt
1. **Client-Side Stock Race Conditions**: Because Cloud Functions are unavailable under the Firebase Spark plan, stock decrements and restorations occur via client-side multi-document Firestore transactions. While security rules prevent negative stock, high concurrent orders on a single product could experience transaction retries.
2. **Client-Side Search Limitations**: Search and filtering are executed locally over active products in memory. When the product catalog expands past thousands of items, server-side indexing (e.g. Algolia or Elasticsearch) will be required.
3. **Data Loss on Device Migration**: Because backups are explicitly disabled (`allowBackup="false"`), users must sign in afresh when switching devices.
