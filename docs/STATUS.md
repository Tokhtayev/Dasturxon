# Dasturxon Project Status & Engineering Report

## 1. Overview
- **Project**: Dasturxon (`com.example.dasturxon`)
- **Platform**: Android (Kotlin, Jetpack Compose, Material 3, Firebase)
- **Branch**: `ai-night`
- **Notice**: In accordance with project policy, this application is **NOT** claimed to be "pentested" or "fully tested". This report details what was completed, verified by automated testing, what remains unverified, manual deployment instructions, and known technical risks.

---

## 2. Completed Tasks & MVP Features (P0 – P5)

### P0: Firestore Security Rules, Cost Isolation & Rules Emulator Tests
- Implemented least-privilege security rules in `firestore.rules`:
  - **Product Cost Isolation**: `costPrice` is strictly prohibited from public product documents (`!('costPrice' in request.resource.data)`). Cost price is stored in subcollection `products/{id}/private/cost`, readable and writable exclusively by the business owner and admin.
  - **Orders Access Control**: Customers read only their own orders; owners read only orders for their business.
  - **Order Line Items**: Line items created under `orders/{id}/items/{itemId}` where security rules enforce `unitPrice == product.sellingPrice` (max 99 items per line). Customers never write order totals.
  - **Order State Machine**: Customers can ONLY transition order status `pending` (or `new`) $\rightarrow$ `cancelled`. Once accepted by the owner, customer cancellation is blocked.
  - **Cost Snapshot**: Business owner writes `unitCost` per item snapshot upon order completion (`status == "completed"`).
  - **Expenses Isolation**: `/expenses/{expenseId}` readable and writable only by the business owner.
  - **Profile & Role Protection**: `/users/{userId}` self-read/write only, role escalation to admin is blocked, role is immutable on update.
- **25 automated security tests** passing against the Firebase Firestore Emulator (`test/firestore.rules.test.mjs`).

### P1: Customer Orders, Real-Time Status & History
- Implemented customer order creation with atomic line items subcollection:
  - Customer writes line item with `productId`, `name`, `qty`, `unitPrice` matching product price.
  - Customer does NOT write totals; `totalPrice` is computed or verified.
  - Order status initialized to `pending`, `paymentStatus` to `unpaid`.
  - Fulfillment options: `pickup` vs `delivery` (+ `deliveryAddress`). No delivery fee charged in MVP.
- Real-time active orders listener using `callbackFlow` snapshot listener in `OrderRepository.observeActiveForCustomer(customerId)`.
- Customer order history with cursor-based pagination and monthly grouping (`groupOrdersByMonth`) in `Asia/Tashkent` timezone.
- Added customer order cancellation action with confirmation dialog for `pending` orders.

### P2: Owner Order Management, Payment Tracking & UnitCost Snapshots
- Implemented full owner order state machine in `OrderCard` and `RoleHome`:
  - Status progression: `pending` $\rightarrow$ `accepted` $\rightarrow$ `ready` $\rightarrow$ `completed`, plus `rejected`.
  - Payment tracking: "To'lovni tasdiqlash" (Mark as paid) button updates `paymentStatus = "paid"` and records `paidAt = serverTimestamp()`.
  - Paid status badge ("✓ To'langan") displayed on order cards.
  - On order completion, `orderRepository.completeOrder(orderId, unitCost)` writes snapshot `unitCost` into each line item in `orders/{orderId}/items/{itemId}`.
- Real-time incoming orders listener for business owners (`OrderRepository.listenForBusiness`).

### P3: Business Expenses & One-Shot Analytics
- Pure Kotlin domain `AnalyticsCalculator` with deterministic math operating on real Firestore data:
  - Timezone: `Asia/Tashkent`. Week starts Monday (`startOfWeek` helper using `TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)`).
  - Revenue calculation: Orders with `status == "completed"` (or legacy `done`) AND `paymentStatus == "paid"` (or legacy `done`), dated by `paidAt`.
  - Gross Profit: $\text{Revenue} - \sum (\text{item.unitCost} \times \text{item.qty})$.
  - Net Profit: $\text{Gross Profit} - \sum \text{Expenses in period}$.
  - Product-level analytics: Best-sellers by quantity, most profitable by gross margin, loss-making products where $\text{product revenue} - \text{product cost} < 0$.
- **One-Shot Queries**: Real-time snapshot listeners are restricted to active customer orders and owner incoming orders. Analytics data (`events` view count, `expenses`) is loaded strictly via one-shot `.get()` queries when the analytics tab is opened.

### P4: Product Images & Clean Placeholders
- **Spark Plan Interface**: Defined `ImageStore` interface and `FirebaseImageStore` returning `AppResult.Error(UnsupportedOperationException("Firebase Storage is BLOCKED on Spark plan"))`.
- **Zero Base64 in Firestore**: Removed all Base64 generation, encoding, and document writes from `RoleHome`, `ProductRepository`, and `Product`.
- **Designed Food Placeholders**: Clean Material 3 cards with gradient backgrounds and central food category icons ("🥖", "🥟", "🍲", "🫖", "🍰", "🍽️") render seamlessly without broken image states or network lag.

### P5: Contact Intents, Compound Indexes & Platform Hardening
- **Contact Intents**: Implemented direct `tel:` dialing intent and Telegram link intent (`https://t.me/+998...`) in `ProductDetailScreen` and `CustomerOrdersScreen`. Zero in-app chat overhead.
- **Indexes**: Defined `firestore.indexes.json` for all compound queries.
- **Static Security**: `android:allowBackup="false"`, `usesCleartextTraffic="false"`, non-exported components, zero hardcoded secrets.

### P6: Profile Editing, Role Switcher, Direct Owner Access, Notifications & Promotional Banners
- **Profile Name Editing**: Added "Profil ma'lumotlari" dialog in `CustomerProfileScreen` settings to edit `fullName` with real-time UI updates and Firestore updates.
- **Direct Owner Access**: Removed the blocking "admin approval waiting" wall from `OwnerHome`. Business owners now immediately enter the full 5-tab interface (Dashboard, Products, Orders, Analytics, Profile) without waiting for admin approval.
- **Seamless Role Switcher**: Added 1-tap role switching between Customer and Owner modes in Customer Profile and Owner TopBar / Profile.
- **Top Bar User Name & Notifications**: Integrated user name pill chip (direct profile shortcut) and interactive notification bell (`🔔` with unread badge counter, live order status updates, promotional notices, and mark-as-read functionality).
- **Promotional Advertising Carousel**: Added modern `PromoBannersCarousel` on Home screen with rich, realistic Canvas food artwork (Uzbek Patir non with sesame & chekich, flaky somsa, Safia confectionery cake, Chilonzor plov), badges, and action triggers.
- **Realistic Food Visual Art**: Replaced plain emoji placeholders in `Cards.kt` and `ProductDetailScreen.kt` with custom, high-clarity `ProductVisualArt` graphics.

---

## 3. Verified by Automated Tests

| Test Suite | Count | Result | Scope / Coverage |
| :--- | :---: | :---: | :--- |
| **Firestore Emulator Rules Tests** (`npm run test:rules`) | **25** | **PASS** | Role escalation prevention, cross-user doc protection, order privacy, cross-owner product isolation, private cost subcollection isolation (`products/{id}/private/cost`), public costPrice prohibition, customer cancellation constraints, order line item `unitPrice` validation, owner `unitCost` snapshot update, expense isolation and owner write access. |
| **JVM Unit Tests** (`./gradlew testDebugUnitTest`) | **59** | **PASS** | AnalyticsCalculator (7), CustomerOrderModel (3), ExpenseModel (3), ProductModel (3), OrderStatus (3), AuthRepositoryErrorMapping (4), BusinessType (4), DomainValidation (10), OrderHistoryPaging (4), AuthViewModel (8), CustomerOrdersViewModel (9), Example (1). |
| **Android Lint** (`./gradlew lintDebug`) | - | **PASS** | Zero fatal errors; clean resource, accessibility, and manifest checks. |
| **Debug Build** (`./gradlew assembleDebug`) | - | **PASS** | Debug APK built successfully without errors or broken dependencies. |

---

## 4. Manual Firebase Deployment Commands

In compliance with project safety rules, automated deployment (`firebase deploy`) was **NOT** executed. To deploy the hardened security rules and compound indexes to production Firebase:

```bash
# 1. Login to Firebase CLI
firebase login

# 2. Select target project
firebase use <project-id>

# 3. Deploy Firestore Security Rules
firebase deploy --only firestore:rules

# 4. Deploy Firestore Compound Indexes
firebase deploy --only firestore:indexes
```

---

## 5. Compound Queries & Index Status

The following compound indexes are defined in `firestore.indexes.json`:

| Collection | Fields | Status | Query Usage |
| :--- | :--- | :---: | :--- |
| `orders` | `customerId` ASC, `status` ASC | Configured | Customer active orders query |
| `orders` | `customerId` ASC, `status` ASC, `createdAt` DESC | Configured | Customer paginated order history |
| `orders` | `businessId` ASC, `createdAt` DESC | Configured | Owner incoming orders stream |
| `products` | `published` ASC, `status` ASC | Configured | Customer public catalog feed |
| `products` | `businessId` ASC, `createdAt` DESC | Configured | Owner inventory management |
| `expenses` | `businessId` ASC, `createdAt` DESC | Configured | Owner expense listing |
| `events` | `businessId` ASC, `type` ASC | Configured | Business view count calculation |

*Note: In local emulator testing, single-field indexes satisfy local runs. In cloud production, Firebase will build these compound indexes upon executing `firebase deploy --only firestore:indexes`.*

---

## 6. NOT Verified (Out-of-Scope / Manual Verification Needed)
- **Physical Device Push Notifications**: Firebase Cloud Messaging (FCM) is not deployed (serverless Spark tier).
- **Physical Device Doze Mode / Deep Sleep**: Background lifecycle behavior was tested via ViewModel test scopes and Compose lifecycle flows, but not on physical battery-saving modes.
- **In-App Billing / Live Payment Gateways**: The app uses a pickup/cash-on-delivery marketplace model where payments occur in person; no third-party payment gateway SDK is integrated.
- **Production Firebase Deployment**: Live Firebase deployment (`firebase deploy`) was intentionally not performed in compliance with project rules.

---

## 7. Known Risks & Technical Debt
1. **Client-Side Stock Race Conditions**: Because Cloud Functions are unavailable under the Firebase Spark plan, stock decrements occur via client-side multi-document Firestore transactions. While security rules prevent negative stock, high concurrent orders on a single product could experience transaction retries.
2. **Client-Side Search Limitations**: Search and filtering are executed locally over active products in memory. When the product catalog expands past thousands of items, server-side indexing (e.g. Algolia or Elasticsearch) will be required.
3. **Data Loss on Device Migration**: Because backups are explicitly disabled (`allowBackup="false"`), users must sign in afresh when switching devices.
