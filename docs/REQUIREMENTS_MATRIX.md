# Dasturxon Requirements Traceability Matrix

This matrix maps every requirement from the PRD and PRD Amendments to its implementation status (`exists`, `partial`, or `missing`), affected files, and verification status.

---

## 1. Authentication & Security (Prerequisites)

| ID | Requirement | Status | File(s) | Verification & Implementation Notes |
| :--- | :--- | :---: | :--- | :--- |
| **AUTH-01** | Email + Password sign-in only (no phone auth, no fallback "@dasturxon.uz") | `exists` | `app/src/main/java/com/example/dasturxon/ui/auth/AuthScreens.kt`, `data/repository/FirebaseAuthRepositoryImpl.kt` | Fully compliant; email & password authentication only. |
| **AUTH-02** | Atomic nickname registration (`users/{uid}` + `usernames/{handle}`) with batch write & rollback | `exists` | `app/src/main/java/com/example/dasturxon/data/repository/FirebaseAuthRepositoryImpl.kt` | Batch write rollback verified in `AuthViewModelTest`. |
| **AUTH-03** | Anti-enumeration in password reset and sign-in error messages | `exists` | `app/src/main/java/com/example/dasturxon/data/repository/FirebaseAuthRepositoryImpl.kt` | Verified in `AuthRepositoryErrorMappingTest`. |
| **AUTH-04** | Role protection (customer cannot escalate to admin, immutable role on update) | `exists` | `firestore.rules`, `test/firestore.rules.test.mjs` | Enforced in rules and verified by emulator tests 11, 12, 13. |
| **AUTH-05** | Least-privilege profile privacy (`/users/{uid}` self-read/write only) | `exists` | `firestore.rules` | Rules enforce `isOwner(userId)` on user docs. |

---

## 2. Data Model & Architecture (PRD Amendments)

| ID | Requirement | Status | File(s) | Verification & Implementation Notes |
| :--- | :--- | :---: | :--- | :--- |
| **DATA-01** | Money representation = `Long` (UZS), timezone = `Asia/Tashkent`, week starts Monday | `exists` | `core/common/MoneyFormatter.kt`, `core/model/AnalyticsCalculator.kt` | Verified by `AnalyticsCalculatorTest.startOfWeek returns Monday in Asia Tashkent timezone`. |
| **DATA-02** | `costPrice` is NEVER stored in public product doc; stored in `products/{id}/private/cost` | `exists` | `data/model/Product.kt`, `data/repository/ProductRepository.kt`, `firestore.rules` | Prohibited in rules (`!('costPrice' in request.resource.data)`). Stored in `private/cost`. Verified in emulator tests 20, 21, 22. |
| **DATA-03** | Product `published` flag (`published: Boolean = true`) | `exists` | `data/model/Product.kt`, `data/repository/ProductRepository.kt`, `core/designsystem/Cards.kt` | `published` field supported in schema, filtered in feed listeners. |
| **DATA-04** | Order status lifecycle: `pending` \| `accepted` \| `ready` \| `completed` \| `rejected` \| `cancelled` | `exists` | `domain/OrderStatus.kt`, `core/model/OrderStatus.kt`, `data/model/CustomerOrder.kt`, `data/repository/OrderRepository.kt` | Standardized to 6-state lifecycle with backward compatibility for legacy `new` and `done`. |
| **DATA-05** | Order payment status: `paymentStatus = unpaid \| paid` with `paidAt: Timestamp?` (owner-only write) | `exists` | `data/model/CustomerOrder.kt`, `data/repository/OrderRepository.kt`, `firestore.rules` | Enforced in rules and verified in emulator tests. Owner action updates `paymentStatus` and `paidAt`. |
| **DATA-06** | Fulfillment type: `fulfillmentType = pickup \| delivery (+ address)` | `exists` | `data/model/CustomerOrder.kt`, `ui/customer/CheckoutSheet.kt`, `data/repository/OrderRepository.kt` | Implemented; address captured cleanly; verified in `CustomerOrderModelTest`. |
| **DATA-07** | Order line items subcollection: `orders/{id}/items/{itemId}` (max 15 items, customer cannot write totals) | `exists` | `data/model/CustomerOrder.kt`, `data/repository/OrderRepository.kt`, `firestore.rules` | Subcollection created in transaction; `unitPrice == product.price` enforced by security rules. Verified in emulator test 25. |
| **DATA-08** | Customer status transition restricted: customer may ONLY cancel when status is `pending` | `exists` | `firestore.rules`, `data/repository/OrderRepository.kt`, `ui/home/CustomerOrdersScreen.kt` | Enforced in rules and verified in emulator tests 23 and 24. Cancellation dialog wired in `OrderDetailScreen`. |
| **DATA-09** | Owner writes `unitCost` per item snapshot upon order completion (`status == completed`) | `exists` | `data/repository/OrderRepository.kt`, `ui/home/RoleHome.kt` | Owner writes `unitCost` snapshot into items subcollection upon completion. Verified in emulator test 25. |

---

## 3. Customer Features (P1)

| ID | Requirement | Status | File(s) | Verification & Implementation Notes |
| :--- | :--- | :---: | :--- | :--- |
| **CUST-01** | Browse approved businesses and published products | `exists` | `ui/home/CustomerOrderFlow.kt`, `data/repository/ProductRepository.kt` | Feed streams only published products from approved businesses. |
| **CUST-02** | View product descriptions and prices (no costPrice visible to customers) | `exists` | `ui/customer/ProductDetailScreen.kt`, `core/designsystem/Cards.kt` | `costPrice` is strictly isolated and omitted from customer models and documents. |
| **CUST-03** | Order placement with line items and fulfillment (pickup vs delivery + address) | `exists` | `ui/customer/CheckoutSheet.kt`, `data/repository/OrderRepository.kt` | Order placement creates subcollection line items without client-written totals. |
| **CUST-04** | Real-time status tracking for active customer orders | `exists` | `data/repository/OrderRepository.kt`, `ui/home/CustomerOrdersScreen.kt` | `observeActiveForCustomer(customerId)` uses `callbackFlow` snapshot listener. |
| **CUST-05** | Customer order history with pagination & monthly grouping | `exists` | `ui/home/CustomerOrdersScreen.kt`, `ui/home/CustomerOrdersViewModel.kt` | Paged history with monthly grouping verified by `OrderHistoryPagingTest`. |
| **CUST-06** | Contact business owner via `tel:` or Telegram intent (no chat) | `exists` | `ui/customer/ProductDetailScreen.kt`, `ui/home/CustomerOrdersScreen.kt` | Direct `tel:` phone call and `https://t.me/...` Telegram link intents provided. |

---

## 4. Owner Management & Orders (P2)

| ID | Requirement | Status | File(s) | Verification & Implementation Notes |
| :--- | :--- | :---: | :--- | :--- |
| **OWN-01** | Create and manage business profile (admin approval required) | `exists` | `ui/home/RoleHome.kt`, `data/repository/BusinessRepository.kt` | Admin approval flow enforced by Firestore rules. |
| **OWN-02** | Add, edit, remove products with `published` toggle | `exists` | `ui/home/RoleHome.kt`, `data/repository/ProductRepository.kt` | Implemented in `RoleHome` and `ProductRepository`. |
| **OWN-03** | Set product `costPrice` stored in private subcollection `products/{id}/private/cost` | `exists` | `data/repository/ProductRepository.kt`, `ui/home/RoleHome.kt` | Private cost stored in `products/{id}/private/cost`, read via `getCostPrice`. |
| **OWN-04** | Real-time incoming orders listener for business owner | `exists` | `data/repository/OrderRepository.kt`, `ui/home/RoleHome.kt` | Real-time listener on `orders` where `businessId == business.id`. |
| **OWN-05** | Order status advancement: `pending -> accepted -> ready -> completed` and `rejected` | `exists` | `ui/home/OrderComponents.kt`, `data/repository/OrderRepository.kt`, `ui/home/RoleHome.kt` | Owner order cards support full status transition actions. |
| **OWN-06** | Mark order payment status (`unpaid -> paid` with `paidAt: Timestamp`) | `exists` | `ui/home/OrderComponents.kt`, `data/repository/OrderRepository.kt` | "To'lovni tasdiqlash" button records `paymentStatus = "paid"` and `paidAt = serverTimestamp()`. |
| **OWN-07** | Write `unitCost` snapshot on order completion | `exists` | `data/repository/OrderRepository.kt`, `ui/home/RoleHome.kt` | `completeOrder` fetches product cost and records `unitCost` snapshot in item docs. |
| **OWN-08** | Contact customer via direct `tel:` intent from order card | `exists` | `ui/home/OrderComponents.kt` | Direct `ACTION_DIAL` intent with customer phone number. |

---

## 5. Expenses & Analytics (P3)

| ID | Requirement | Status | File(s) | Verification & Implementation Notes |
| :--- | :--- | :---: | :--- | :--- |
| **EXP-01** | Business expenses tracking (`/expenses/{expenseId}`) | `exists` | `data/model/Expense.kt`, `data/repository/ExpenseRepository.kt`, `ui/home/OrderComponents.kt` | CRUD operations with least-privilege security rules. Verified in emulator tests 18 and 19. |
| **ANLY-01** | Pure Kotlin `AnalyticsCalculator` with deterministic math & unit tests | `exists` | `core/model/AnalyticsCalculator.kt`, `core/model/AnalyticsCalculatorTest.kt` | Verified by 7 deterministic unit tests on fixed numbers. Revenue strictly requires completed + paid. |
| **ANLY-02** | One-shot queries for analytics (no continuous listeners for history/analytics) | `exists` | `ui/home/RoleHome.kt`, `data/repository/AnalyticsRepository.kt` | Analytics loaded via one-shot `.get()` queries on `currentTab == 3`. |
| **ANLY-03** | Daily, weekly, monthly revenue, expenses, gross profit, and net profit | `exists` | `core/model/AnalyticsCalculator.kt`, `ui/home/RoleHome.kt` | Timeframe helpers align with `Asia/Tashkent` and Monday-start week. |
| **ANLY-04** | Product-level sales, profitability, best-sellers, most profitable, and loss-makers | `exists` | `core/model/AnalyticsCalculator.kt`, `ui/home/RoleHome.kt` | Verified in unit tests: best seller by quantity, most profitable by margin, loss makers where revenue - cost < 0. |

---

## 6. Images & Media (P4)

| ID | Requirement | Status | File(s) | Verification & Implementation Notes |
| :--- | :--- | :---: | :--- | :--- |
| **IMG-01** | Firebase Storage on Spark plan: upload marked BLOCKED behind repository interface | `exists` | `core/data/repository/ImageStore.kt`, `data/repository/FirebaseImageStore.kt` | `FirebaseImageStore` returns `AppResult.Error("Firebase Storage is BLOCKED on Spark plan")`. |
| **IMG-02** | No Base64 strings in Firestore documents | `exists` | `data/model/Product.kt`, `data/repository/ProductRepository.kt`, `ui/home/RoleHome.kt` | Base64 generation and writing completely removed. Zero Base64 strings sent to Firestore. |
| **IMG-03** | Designed food placeholder gradients and emoji/icons | `exists` | `core/designsystem/Cards.kt`, `ui/customer/ProductDetailScreen.kt` | High-quality fallback vector/emoji icons ("🥖", "🥟", "🍲", "🫖", "🍰", "🍽️") and Material 3 gradient backgrounds. |

---

## 7. Contact, Delivery & Platform (P5)

| ID | Requirement | Status | File(s) | Verification & Implementation Notes |
| :--- | :--- | :---: | :--- | :--- |
| **CONT-01** | Contact intents: `tel:` and Telegram links (`https://t.me/...`), no in-app chat | `exists` | `ui/customer/ProductDetailScreen.kt`, `ui/home/CustomerOrdersScreen.kt` | Direct `tel:` phone call and Telegram link intents wired; no in-app chat. |
| **DELV-01** | No delivery fee in MVP (pure pickup/delivery choice with delivery address) | `exists` | `ui/customer/CheckoutSheet.kt` | No delivery fee charged; pickup/delivery choice with delivery address validation. |
| **IDX-01** | `firestore.indexes.json` defined for all compound queries | `exists` | `firestore.indexes.json` | Compound indexes defined for `orders`, `products`, `expenses`, and `events`. |
| **DOC-01** | Document manual deploy commands for rules and indexes in `STATUS.md` | `exists` | `docs/STATUS.md` | Explicit manual deploy commands for Firebase CLI documented in `docs/STATUS.md`. |
| **DOC-02** | Maintain honest `STATUS.md` with Done / Verified / Unverified / Known Risks | `exists` | `docs/STATUS.md` | Maintained without claiming "pentested" or "fully tested". |
