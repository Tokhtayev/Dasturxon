# Dasturxon Requirements Traceability Matrix

This matrix maps every requirement from the PRD and PRD Amendments to its implementation status (`exists`, `partial`, or `missing`), affected files, and migration actions.

---

## 1. Authentication & Security (Prerequisites)

| ID | Requirement | Status | File(s) | Notes & Required Actions |
| :--- | :--- | :---: | :--- | :--- |
| **AUTH-01** | Email + Password sign-in only (no phone auth, no fallback "@dasturxon.uz") | `exists` | `app/src/main/java/com/example/dasturxon/ui/auth/AuthScreens.kt`, `data/repository/FirebaseAuthRepositoryImpl.kt` | Fully compliant; email & password only. |
| **AUTH-02** | Atomic nickname registration (`users/{uid}` + `usernames/{handle}`) with batch write & rollback | `exists` | `app/src/main/java/com/example/dasturxon/data/repository/FirebaseAuthRepositoryImpl.kt` | Batch write rollback tested in `AuthViewModelTest`. |
| **AUTH-03** | Anti-enumeration in password reset and sign-in error messages | `exists` | `app/src/main/java/com/example/dasturxon/data/repository/FirebaseAuthRepositoryImpl.kt` | Tested in `AuthRepositoryErrorMappingTest`. |
| **AUTH-04** | Role protection (customer cannot escalate to admin, immutable role on update) | `exists` | `firestore.rules`, `test/firestore.rules.test.mjs` | Verified by emulator rules tests 11, 12, 13. |
| **AUTH-05** | Least-privilege profile privacy (`/users/{uid}` self-read/write only) | `exists` | `firestore.rules` | Rules enforce `isOwner(userId)` on user docs. |

---

## 2. Data Model & Architecture (PRD Amendments)

| ID | Requirement | Status | File(s) | Notes & Required Actions |
| :--- | :--- | :---: | :--- | :--- |
| **DATA-01** | Money representation = `Long` (UZS), timezone = `Asia/Tashkent`, week starts Monday | `partial` | `core/common/MoneyFormatter.kt`, `core/model/AnalyticsCalculator.kt` | Money is `Long`; need to verify `AnalyticsCalculator` uses `Asia/Tashkent` and `DayOfWeek.MONDAY`. |
| **DATA-02** | `costPrice` is NEVER stored in public product doc; stored in `products/{id}/private/cost` | `missing` | `data/model/Product.kt`, `data/repository/ProductRepository.kt`, `firestore.rules` | **MIGRATION REQUIRED**: Remove `costPrice` from public product doc. Add subcollection `products/{id}/private/cost` (field: `costPrice: Long`), readable/writable only by business owner. |
| **DATA-03** | Product `published` flag (`published: Boolean = true`) | `missing` | `data/model/Product.kt`, `data/repository/ProductRepository.kt`, `core/designsystem/Cards.kt` | Add `published: Boolean` to product schema and customer query filters (`whereEqualTo("published", true)`). |
| **DATA-04** | Order status lifecycle: `pending` \| `accepted` \| `ready` \| `completed` \| `rejected` \| `cancelled` | `partial` | `domain/OrderStatus.kt`, `data/model/CustomerOrder.kt`, `data/repository/OrderRepository.kt` | **MIGRATION REQUIRED**: Update stored values from `new/done` to `pending/completed` state machine. |
| **DATA-05** | Order payment status: `paymentStatus = unpaid \| paid` with `paidAt: Timestamp?` (owner-only write) | `missing` | `data/model/CustomerOrder.kt`, `data/repository/OrderRepository.kt`, `firestore.rules` | Add `paymentStatus` and `paidAt` fields to orders; restrict mutation to business owner. |
| **DATA-06** | Fulfillment type: `fulfillmentType = pickup \| delivery (+ address)` | `exists` | `data/model/CustomerOrder.kt`, `ui/customer/CheckoutSheet.kt`, `data/repository/OrderRepository.kt` | Implemented; verify address validation and order card display. |
| **DATA-07** | Order line items subcollection: `orders/{id}/items/{itemId}` (max 15 items, customer cannot write totals) | `missing` | `data/model/CustomerOrder.kt`, `data/repository/OrderRepository.kt`, `firestore.rules` | **MIGRATION REQUIRED**: Move items into subcollection `orders/{id}/items/{itemId}`. Security rules must enforce `unitPrice == product.sellingPrice` and limit <= 15 items. |
| **DATA-08** | Customer status transition restricted: customer may ONLY cancel when status is `pending` | `missing` | `firestore.rules`, `data/repository/OrderRepository.kt` | Enforce in `firestore.rules`: customer can only change status `pending -> cancelled`. |
| **DATA-09** | Owner writes `unitCost` per item snapshot upon order completion (`status == completed`) | `missing` | `data/repository/OrderRepository.kt`, `ui/home/RoleHome.kt` | When owner completes order, write `unitCost` into each item snapshot in `orders/{id}/items/{itemId}`. |

---

## 3. Customer Features (P1)

| ID | Requirement | Status | File(s) | Notes & Required Actions |
| :--- | :--- | :---: | :--- | :--- |
| **CUST-01** | Browse approved businesses and published products | `partial` | `ui/home/CustomerOrderFlow.kt`, `data/repository/ProductRepository.kt` | Update feed query to check `published == true` alongside business approval. |
| **CUST-02** | View product descriptions and prices (no costPrice visible to customers) | `partial` | `ui/customer/ProductDetailScreen.kt`, `core/designsystem/Cards.kt` | Ensure `costPrice` is absent from customer-facing product models and documents. |
| **CUST-03** | Order placement with line items and fulfillment (pickup vs delivery + address) | `partial` | `ui/customer/CheckoutSheet.kt`, `data/repository/OrderRepository.kt` | Connect `CheckoutSheet` to `orders/{id}/items/{itemId}` subcollection creation. |
| **CUST-04** | Real-time status tracking for active customer orders | `exists` | `data/repository/OrderRepository.kt`, `ui/home/CustomerOrdersScreen.kt` | `observeActiveForCustomer(customerId)` uses `callbackFlow` snapshot listener. |
| **CUST-05** | Customer order history with pagination & monthly grouping | `exists` | `ui/home/CustomerOrdersScreen.kt`, `ui/home/CustomerOrdersViewModel.kt` | Paged history with monthly grouping implemented. |
| **CUST-06** | Contact business owner via `tel:` or Telegram intent (no chat) | `partial` | `ui/customer/ProductDetailScreen.kt`, `ui/home/CustomerOrdersScreen.kt` | `tel:` implemented; add Telegram link intent (`https://t.me/...`) support. |

---

## 4. Owner Management & Orders (P2)

| ID | Requirement | Status | File(s) | Notes & Required Actions |
| :--- | :--- | :---: | :--- | :--- |
| **OWN-01** | Create and manage business profile (admin approval required) | `exists` | `ui/home/RoleHome.kt`, `data/repository/BusinessRepository.kt` | Admin approval flow intact. |
| **OWN-02** | Add, edit, remove products with `published` toggle | `partial` | `ui/home/RoleHome.kt`, `data/repository/ProductRepository.kt` | Add `published` switch in product editor and edit dialog. |
| **OWN-03** | Set product `costPrice` stored in private subcollection `products/{id}/private/cost` | `missing` | `data/repository/ProductRepository.kt`, `ui/home/RoleHome.kt` | Write cost to `products/{productId}/private/cost`, read during owner edit. |
| **OWN-04** | Real-time incoming orders listener for business owner | `exists` | `data/repository/OrderRepository.kt`, `ui/home/RoleHome.kt` | Real-time listener on `orders` where `businessId == business.id`. |
| **OWN-05** | Order status advancement: `pending -> accepted -> ready -> completed` and `rejected` | `partial` | `ui/home/OrderComponents.kt`, `data/repository/OrderRepository.kt` | Update button actions and transitions to new status vocabulary. |
| **OWN-06** | Mark order payment status (`unpaid -> paid` with `paidAt: Timestamp`) | `missing` | `ui/home/OrderComponents.kt`, `data/repository/OrderRepository.kt` | Add "To'landi" toggle/button for owner recording `paymentStatus = "paid"` & `paidAt = serverTimestamp()`. |
| **OWN-07** | Write `unitCost` snapshot on order completion | `missing` | `data/repository/OrderRepository.kt`, `ui/home/RoleHome.kt` | Fetch current product cost and write `unitCost` into items subcollection upon `completed`. |
| **OWN-08** | Contact customer via direct `tel:` intent from order card | `exists` | `ui/home/OrderComponents.kt` | Direct `ACTION_DIAL` intent with customer's phone number implemented. |

---

## 5. Expenses & Analytics (P3)

| ID | Requirement | Status | File(s) | Notes & Required Actions |
| :--- | :--- | :---: | :--- | :--- |
| **EXP-01** | Business expenses tracking (`/expenses/{expenseId}`) | `exists` | `data/model/Expense.kt`, `data/repository/ExpenseRepository.kt`, `ui/home/OrderComponents.kt` | CRUD operations with least-privilege security rules. |
| **ANLY-01** | Pure Kotlin `AnalyticsCalculator` with deterministic math & unit tests | `partial` | `core/model/AnalyticsCalculator.kt`, `core/model/AnalyticsCalculatorTest.kt` | Update formula: Revenue = completed & paid orders dated by `paidAt`; Gross Profit = revenue - sum(unitCost * qty). |
| **ANLY-02** | One-shot queries for analytics (no continuous listeners for history/analytics) | `partial` | `ui/home/RoleHome.kt`, `data/repository/AnalyticsRepository.kt` | Ensure analytics data is loaded via one-shot query, not continuous listener. |
| **ANLY-03** | Daily, weekly, monthly revenue, expenses, gross profit, and net profit | `partial` | `core/model/AnalyticsCalculator.kt`, `ui/home/RoleHome.kt` | Ensure period filtering aligns with Asia/Tashkent and Monday week start. |
| **ANLY-04** | Product-level sales, profitability, best-sellers, most profitable, and loss-makers | `partial` | `core/model/AnalyticsCalculator.kt`, `ui/home/RoleHome.kt` | Base loss-making calculation on `product revenue - product cost < 0` using snapshot `unitCost`. |

---

## 6. Images & Media (P4)

| ID | Requirement | Status | File(s) | Notes & Required Actions |
| :--- | :--- | :---: | :--- | :--- |
| **IMG-01** | Firebase Storage on Spark plan: upload marked BLOCKED behind repository interface | `missing` | `core/data/repository/ImageStore.kt`, `data/repository/FirebaseImageStore.kt` | **MIGRATION REQUIRED**: Do not use Base64 strings. Define `ImageStore` interface, mark Firebase Storage upload as BLOCKED on Spark plan. |
| **IMG-02** | No Base64 strings in Firestore documents | `missing` | `data/model/Product.kt`, `data/repository/ProductRepository.kt`, `ui/home/RoleHome.kt` | **MIGRATION REQUIRED**: Remove Base64 generation and storage. Use clean placeholder icons/gradients for products without URLs. |
| **IMG-03** | Designed food placeholder gradients and emoji/icons | `exists` | `core/designsystem/Cards.kt`, `ui/customer/ProductDetailScreen.kt` | Fallback vector/emoji and gradient placeholders exist. |

---

## 7. Contact, Delivery & Platform (P5)

| ID | Requirement | Status | File(s) | Notes & Required Actions |
| :--- | :--- | :---: | :--- | :--- |
| **CONT-01** | Contact intents: `tel:` and Telegram links (`https://t.me/...`), no in-app chat | `partial` | `ui/customer/ProductDetailScreen.kt`, `ui/home/CustomerOrderFlow.kt` | Add Telegram link intent support alongside `tel:`. |
| **DELV-01** | No delivery fee in MVP (pure pickup/delivery choice with delivery address) | `exists` | `ui/customer/CheckoutSheet.kt` | No delivery fee is charged; address captured cleanly. |
| **IDX-01** | `firestore.indexes.json` defined for all compound queries | `missing` | `firestore.indexes.json` | Create `firestore.indexes.json` for compound queries (`businessId` + `createdAt`, `status` + `createdAt`). |
| **DOC-01** | Document manual deploy commands for rules and indexes in `STATUS.md` | `missing` | `docs/STATUS.md` | Add explicit instructions for manual deployment via Firebase CLI. |
| **DOC-02** | Maintain honest `STATUS.md` with Done / Verified / Unverified / Known Risks | `exists` | `docs/STATUS.md` | Maintained without claiming "pentested" or "fully tested". |
