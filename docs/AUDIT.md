# Phase 0: Audit Report

## 1. Current State of the Codebase
- **Project Structure**: Currently, the code is structured loosely under `com.example.dasturxon`.
  - UI components are grouped together under `ui/home` (`RoleHome`, `CustomerOrdersScreen`, `CustomerOrderFlow`, `OrderComponents`) and `ui/theme`.
  - Data models (`Business`, `CustomerOrder`, `Product`) are under `data/model`.
  - Repositories (`BusinessRepository`, `OrderRepository`, `ProductRepository`, `AnalyticsRepository`) are under `data/repository`.
  - Domain logic (`Validators`, `OrderStatus`, `BusinessType`, etc.) is under `domain`.
- **Navigation**: Uses a simple state-based conditional rendering in `MainActivity.kt` (`if (user != null) { ... }`). There is no robust navigation component or graph setup.
- **Dependency Injection**: None. ViewModels are manually instantiated with factories (`CustomerOrdersViewModelFactory`), and Firebase instances are passed down from `MainActivity.kt`.
- **Data Usage**:
  - `Product`: Missing fields defined in target (`image`, `availableNowAt`, `availableNowMinutes`, `availableNowNote`, `updatedAt`, `active`). Currently uses `status` string instead of `active` boolean and domain enum.
  - `Business`: Missing `description`, `image`. Status values exist but need mapping.
  - `CustomerOrder`: Missing `customerName`, `customerPhone`, `unitPriceOriginal`, `discountPercent`, `updatedAt`, `acceptedAt`, `readyAt`, `completedAt`, `cancelledAt`, `rejectReason`, `rejectReasonCode`, `fromAvailableNow`.
- **UI/UX**: 
  - Visually plain Material 3 implementation.
  - Hardcoded strings are used in `MainActivity.kt` instead of `strings.xml`.
  - No skeleton loading states, and error states are basic.
- **Dependencies**: 
  - Firebase Auth and Firestore are included.
  - Missing: Hilt (Dagger), KSP, Navigation Compose, java.time core library desugaring.

## 2. Deviations & Proposed Target Architecture
To meet the target architecture described in the agent plan, the following structural changes and additions are necessary:

### A. Modularization & Packaging
Refactor the single monolithic package into strict feature packages:
- `core/designsystem`: Color schemes (Golden tandoor bread + turquoise + green), Typography, Custom Components (DxScaffold, DxTopBar, ProductCard, Charts, etc.), Logo vector assets.
- `core/model`: Pure Kotlin data classes and enums (`OrderStatus` state machine, `BusinessType`).
- `core/data`: Interfaces for repositories, Firebase implementations + mappers, `ImageStore` (Base64 impl), `PreferencesRepository` (DataStore).
- `core/common`: Shared utilities (`UiState`, `java.time` Utils for Asia/Tashkent, `Money` formatters).
- `feature/*`: Separated feature graphs for `auth`, `customer`, `owner`, `analytics`, `admin`, `profile`.
- `navigation`: `AppRoot` and NavHost definitions.

### B. Dependency Additions
- **Hilt & KSP**: `com.google.dagger:hilt-android` and `com.google.devtools.ksp`. Necessary for DI (wiring repositories and ViewModels).
- **Navigation Compose**: `androidx.navigation:navigation-compose` for type-safe routing.
- **DataStore**: `androidx.datastore:datastore-preferences` for onboarding flag and notification read status.
- **Java Time Desugaring**: `coreLibraryDesugaring` (`com.android.tools:desugar_jdk_libs`) to use `java.time` safely on older APIs (minSdk 26 already supports much of it, but good for full compat if needed, though minSdk 26 natively supports `java.time`). *Note: since `minSdk = 26`, core library desugaring might not be strictly necessary for `java.time` as it was introduced in API 26. We will stick to native `java.time` to keep dependencies light unless issues arise.*

### C. Data Layer Enhancements
- Transition to `ImageStore` for Base64 image compression/decompression off the main thread.
- Implement the `OrderStatus` state machine with strict Firestore transactions for stock decrement/restore.
- Refactor the `CustomerOrder` mapper to tolerate missing fields and use the new robust model.
- Add paginated queries (limit 20 + startAfter) for history and catalogs.

### D. Analytics
- Implement pure-Kotlin `AnalyticsCalculator` with testable logic (no Android dependencies).
- Build Custom Compose Canvas charts for `Daromad`, `Buyurtmalar`, `Vaqt tahlili`, etc.

## 3. Plan Validation
The transition to this architecture will occur step-by-step:
1.  **P1 Foundation**: Set up the package structure, Hilt, basic core modules (theme, common), Fake and Firestore repository scaffolding, and AppRoot navigation placeholders.
2.  **P2 Auth**: Rewrite Authentication flow with Jetpack Navigation and MVI/UiState ViewModels.
3.  **P3 Customer**: Complete customer features and data flows.
4.  **P4 Owner Core**: Implement owner workflows (management, products, orders).
5.  **P5 Owner Analytics**: Custom canvas charts and offline analytics calculator.
6.  **P6 Admin**: Implement admin tools.
7.  **P7 Rules/Integrity**: Finalize security rules.
8.  **P8 Polish**: Demo mode, accessibility, and documentation.