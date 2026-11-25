# Dasturxon Web App (Mahalla Bozori)

React + Vite + TypeScript + React Router + Modular Firebase Web SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`).

## Arxitektura

```text
pages/components  ->  hooks/services/context  ->  repositories  ->  Firebase Web SDK
```

- **Repositories (`src/repositories/`)**: `authRepository`, `businessRepository`, `productRepository`, `orderRepository`, `expenseRepository` — barcha Firestore va Auth murojaatlari faqat shu yerda.
- **Observer Hooks (`src/hooks/`, `src/context/`)**: `onSnapshot` va `onAuthStateChanged` tinglovchilari hooklar orqali real vaqtda UI ga uzatiladi (`useAuth`, `useCustomerFeed`, `useCustomerOrders`, `useOwnerDashboard`, `useAdminBusinesses`).
- **Services (`src/services/`)**: Sof TypeScript validatsiya (`validators.ts`), marshrutlash (`routing.ts`) va moliyaviy tahlil (`analytics.ts`).

## Ishga tushirish

1. `cp .env.example .env` qiling va Firebase Web konfiguratsiyasini kiriting (yoki lokal emulator uchun `VITE_USE_FIREBASE_EMULATOR=true` qoldiring).
2. Paketlarni o‘rnating va ishga tushiring:

```bash
cd web
npm install
npm run dev
```

## Build, Lint va Test

```bash
cd web
npm run build
npm run lint
npm test
```
