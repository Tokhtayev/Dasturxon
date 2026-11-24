# Dasturxon Codebase Audit & Schema Mapping

## 1. Executive Summary
This document provides the foundational inspection and schema mapping of the Dasturxon Android codebase (`com.example.dasturxon`), targeting Firestore data models, security rules, repositories, authentication flows, real-time mechanisms, and static security posture.

---

## 2. Real Firestore Schema Mapping

| Collection / Document Path | Actual Fields & Types | Owner Reference | Read Permissions | Write Permissions (Create, Update, Delete) |
| :--- | :--- | :--- | :--- | :--- |
| **`users/{userId}`** | `fullName` (String)<br>`normalizedNickname` (String)<br>`email` (String)<br>`phone` (String)<br>`role` (String: `"customer"`, `"owner"`, `"admin"`)<br>`createdAt` (Timestamp) | Document ID is UID (`request.auth.uid == userId`) | `isSignedIn() && (request.auth.uid == userId \|\| isAdmin())` | **Create**: `request.auth.uid == userId`, role in `['customer', 'owner']`, email & fullName String.<br>**Update**: `request.auth.uid == userId`, role must be immutable (`request.resource.data.role == resource.data.role`).<br>**Delete**: Self or Admin. |
| **`usernames/{normalizedNickname}`** | `uid` (String)<br>`createdAt` (Timestamp) | Document field `uid` must match `request.auth.uid` | `isSignedIn()` (for real-time handle availability checks) | **Create**: `isSignedIn() && request.resource.data.uid == request.auth.uid` and doc does not already exist.<br>**Update/Delete**: Strictly forbidden (`false`). |
| **`businesses/{businessId}`** | `ownerId` (String)<br>`name` (String)<br>`type` (String: `"bakery"`, `"restaurant"`, etc.)<br>`address` (String)<br>`phone` (String)<br>`status` (String: `"pending"`, `"approved"`, `"rejected"`, `"suspended"`)<br>`typeNote` (String, optional)<br>`rejectionReason` (String, optional)<br>`createdAt` (Timestamp)<br>`updatedAt` (Timestamp) | Document field `ownerId == request.auth.uid` | `isSignedIn() && (status == 'approved' \|\| ownerId == request.auth.uid \|\| isAdmin())` | **Create**: `ownerId == request.auth.uid`, initial `status == 'pending'`.<br>**Update**: Owner can update name, type, address, phone, typeNote, but CANNOT change `status` (no self-approval) and `ownerId` is immutable; Admin can update status and rejectionReason.<br>**Delete**: Admin only. |
| **`products/{productId}`** | `businessId` (String)<br>`businessName` (String)<br>`businessType` (String)<br>`businessAddress` (String)<br>`businessPhone` (String)<br>`name` (String)<br>`description` (String)<br>`price` (Long)<br>`published` (Boolean)<br>`imageUrl` (String)<br>`status` (String: `"available"`, `"hot_ready"`, `"sold_out"`)<br>`stock` (Long, optional)<br>`discountPercent` (Long)<br>`discountEndsAt` (Timestamp, optional)<br>`updatedAt` (Timestamp)<br>`lastCheckoutOrderId` (String, optional) | `businessId` links to `businesses/{businessId}` where `ownerId == request.auth.uid` | `isSignedIn() && (isBusinessApproved(businessId) \|\| isBusinessOwner(businessId) \|\| isAdmin())` | **Create**: Business owner or Admin; `costPrice` is forbidden from public doc.<br>**Update**: Business owner or Admin; `businessId` immutable; `costPrice` forbidden.<br>**Delete**: Business owner or Admin. |
| **`products/{productId}/private/{docId}`** (specifically doc `cost`) | `costPrice` (Long)<br>`updatedAt` (Timestamp) | Parent product's business owner (`isBusinessOwner(product.businessId)`) | `isSignedIn() && (isBusinessOwner(...) \|\| isAdmin())`. Customers forbidden. | `isSignedIn() && (isBusinessOwner(...) \|\| isAdmin())`. Customers forbidden. |
| **`orders/{orderId}`** | `customerId` (String)<br>`businessId` (String)<br>`businessName` (String)<br>`productId` (String)<br>`productName` (String)<br>`quantity` (Long)<br>`unitPrice` (Long)<br>`totalPrice` (Long, optional)<br>`status` (String: `"pending"`, `"accepted"`, `"ready"`, `"completed"`, `"cancelled"`, `"rejected"`)<br>`paymentStatus` (String: `"unpaid"`, `"paid"`)<br>`pickupTime` (Timestamp)<br>`fulfillmentType` (String: `"pickup"`, `"delivery"`)<br>`deliveryAddress` (String)<br>`customerPhone` (String)<br>`customerName` (String)<br>`createdAt` (Timestamp)<br>`updatedAt` (Timestamp)<br>`paidAt` (Timestamp, optional) | Customer is `customerId == request.auth.uid`; Business owner is `isBusinessOwner(businessId)` | `isSignedIn() && (customerId == request.auth.uid \|\| isBusinessOwner(businessId) \|\| isAdmin())` | **Create**: Customer creates with own `customerId`, initial `status == 'pending'`, `paymentStatus == 'unpaid'`.<br>**Update**: Customer can only transition `pending` $\rightarrow$ `cancelled`; Owner can update status and `paymentStatus`; Admin can update all.<br>**Delete**: Admin only. |
| **`orders/{orderId}/items/{itemId}`** | `productId` (String)<br>`name` (String)<br>`qty` (Long)<br>`unitPrice` (Long)<br>`unitCost` (Long, optional snapshot) | Parent order `customerId` and `businessId` | Customer, Owner of order's business, or Admin | **Create**: Customer writes line item with `unitPrice == product.price`, `qty` in `1..99`.<br>**Update**: Owner writes `unitCost` snapshot upon order completion (`status == 'completed'`).<br>**Delete**: Admin only. |
| **`expenses/{expenseId}`** | `businessId` (String)<br>`title` (String)<br>`amount` (Long)<br>`category` (String)<br>`createdAt` (Timestamp) | `isBusinessOwner(businessId)` | Owner of `businessId` or Admin only. Customers forbidden. | **Create/Update/Delete**: Owner of `businessId` or Admin only. `businessId` immutable on update. |
| **`events/{eventId}`** | `businessId` (String)<br>`productId` (String, optional)<br>`userId` (String)<br>`type` (String: `"view_product"`, `"view_business"`)<br>`createdAt` (Timestamp) | `userId == request.auth.uid` | Signed-in users can read business views | **Create**: Signed-in users recording view for themselves (`userId == request.auth.uid`).<br>**Update/Delete**: Admin only. |

---

## 3. Findings & Architectural Issues

### A. Authentication & User Registration
1. **Nickname-to-Email Lookup & Synthetic Email Fallback**:
   - `FirebaseAuthRepositoryImpl.kt` allows sign-in with nickname by looking up `usernames/{normalized}` in Firestore to discover the user's email, or falling back to `$nickname@dasturxon.uz`.
   - *Risk/Issue*: Violates requirements stating "Nickname is a public handle, not a login identifier. Remove nickname-to-email lookup. Remove synthetic email fallbacks such as `@dasturxon.uz`."
   - *Remediation*: Restrict sign-in strictly to valid email and password (plus Google Sign-In via Credential Manager).
2. **Phone Sign-up & OTP Flows**:
   - Phone sign-up with OTP is still present in `FirebaseAuthRepositoryImpl`, `AuthViewModel`, and `AuthScreens`.
   - *Requirement*: Remove phone sign-up and OTP flows; consolidate on email/password and Google Sign-In.
3. **Atomic User Registration & Rollback**:
   - `signUpWithEmail` creates the Firebase Auth user, then writes `usernames/{normalized}` and `users/{uid}` via `WriteBatch`.
   - If the Firestore write fails, Auth user rollback (`newUser.delete()`) is implemented, but error mapping needs to ensure understandable Uzbek messages without leaking stack traces.
4. **AuthSessionState Pattern**:
   - `AuthViewModel` currently uses a flat `AuthUiState`. Introducing an explicit `AuthSessionState` (Loading, SignedOut, Ready, ProfileMissing, Error) ensures clean lifecycle transitions.

### B. Firestore Security Rules
1. **Business Creation Status Validation**:
   - `businesses/{businessId}` create rule should strictly enforce that initial `status == 'pending'` so users cannot create pre-approved businesses.
2. **Business Ownership Immutability**:
   - Update rule should enforce `request.resource.data.ownerId == resource.data.ownerId` so owners cannot reassign a business to someone else.
3. **Order Status & Field Validation**:
   - Orders create rule should enforce `status == 'pending'`, `paymentStatus == 'unpaid'`, and that `businessId` belongs to an approved business.
4. **Events / Analytics Protection**:
   - `/events/{eventId}` create rule currently permits any signed in user without checking `request.resource.data.userId == request.auth.uid`. Must constrain `userId` to prevent forged view counts.

### C. Direct Firestore Usage in UI
1. `MainActivity.kt` creates `FirebaseFirestore.getInstance()` and passes it into `AuthRootContainer` and `RoleHome`.
2. Repositories already encapsulate Firestore calls; UI composables should consume repository interfaces / ViewModels rather than accepting raw `FirebaseFirestore`.

### D. Analytics & Profit Calculations
1. `AnalyticsCalculator` is a pure Kotlin domain class with unit tests.
2. Financial formulas are strictly separated:
   - $\text{Gross Profit} = \text{Revenue} - \text{COGS}$ (where $\text{COGS} = \sum (\text{qty} \times \text{unitCost})$).
   - $\text{Net Profit} = \text{Gross Profit} - \sum \text{Expenses}$.
3. Revenue calculation requires `status == 'completed'` and `paymentStatus == 'paid'`.
4. One-shot `.get()` queries are used for analytics instead of real-time listeners, keeping read costs minimal and preventing reactive churn.

---

## 4. Next Actions
- [x] Step 1: Complete codebase inspection & schema mapping (`docs/REVIEW_FINDINGS.md`).
- [ ] Step 2: Harden `firestore.rules` and add comprehensive rules tests in `test/firestore.rules.test.mjs`.
- [ ] Step 3: Refactor Auth layer (clean email/password sign-in, remove nickname lookup/synthetic emails, remove phone OTP, implement AuthSessionState).
- [ ] Step 4: Verify real-time listeners and MVP flows.
- [ ] Step 5: Perform static security review and document status in `docs/SECURITY_REVIEW.md` and `docs/STATUS.md`.
