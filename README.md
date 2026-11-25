# Dasturxon (Mahalla Bozori)

**Dasturxon** (also titled **Mahalla Bozori**) is a mobile-first neighborhood food marketplace web application built for the university course *"Dasturiy injiniringga kirish"*. It connects local bakeries, confectioneries, teahouses, and home kitchens with neighborhood customers and a platform administrator using a single shared **Cloud Firestore** + **Firebase Authentication** backend (`dasturxon-27a6e`).

> **Migration Note:** The original Kotlin / Jetpack Compose Android app experienced repeated build/runtime issues and tight UI-Firestore coupling; it is preserved read-only under [`android-legacy/`](android-legacy/) while the active application lives in [`web/`](web/). See [`docs/report/00-migratsiya.md`](docs/report/00-migratsiya.md).

---

## Core Roles & MVP Features

1. **Customer (`customer`)**: Browse live products from admin-approved businesses, search by product/shop name, filter by food category (`Nonvoyxona`, `Qandolatxona`, `Pishiriq`, `Choyxona`, `Oshxona`, `Kafe`, `Boshqa`), place pickup or delivery orders with atomic Firestore stock transactions (`runTransaction`), track active/past orders in real time (`onSnapshot`), and cancel `pending` orders.
2. **Business Owner (`owner`)**: Create and manage a business profile (awaits admin approval; supports edit-and-resubmit when rejected with a reason), full product CRUD with separate selling price (`price`), confidential cost price (`products/{id}/private/cost`), stock tracking, incoming order lifecycle management (`accepted -> ready -> completed` + `paymentStatus = paid`), expense entry, and daily/weekly/monthly/all-time analytics (`revenue`, `COGS`, `grossProfit`, `netProfit`).
3. **Administrator (`admin`)**: Assigned solely via Firebase Console (`users/{uid}.role = "admin"`). Reviews pending business registrations, approves storefronts, or rejects with a mandatory reason.

---

## Architecture

[`web/src/`](web/src/) follows a strict three-layer architecture enforced by ESLint (`no-restricted-imports` forbids `firebase/*` inside UI components and pages):

```text
pages/ & components/   -> Presentation layer, forms, RoleGuard / GuestOnlyGuard
        |
hooks/, context/, services/ -> Observer hooks (onSnapshot), domain validators, orderLogic, analytics
        |
repositories/          -> authRepository, businessRepository, productRepository, orderRepository, expenseRepository
        |
Firebase Web SDK       -> Cloud Firestore (firestore.rules) + Firebase Auth (indexedDBLocalPersistence)
```

---

## Prerequisites

- **Node.js** `20+` and `npm`
- **Java JDK 17+** (required only if running Firebase Local Emulators locally for rules tests or local E2E testing)

---

## Setup & Environment Variables

1. Install dependencies in both the root workspace (Firestore rules test tooling + Firebase CLI) and `web/`:

```bash
npm install
cd web && npm install
```

2. Create `web/.env` from [`web/.env.example`](web/.env.example) (never commit `web/.env`):

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key from Firebase Console | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `dasturxon-27a6e.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `dasturxon-27a6e` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `dasturxon-27a6e.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `437798898747` |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | `1:437798898747:web:...` |
| `VITE_USE_FIREBASE_EMULATOR` | Set `true` for local Auth (`:9099`) & Firestore (`:8080`) emulator; `false` for live Firebase | `false` |

---

## Run, Test & Build Commands

### Run Locally with Firebase Emulators (Recommended for Safe Dev)

```bash
# Terminal 1 (from repo root): start Auth & Firestore emulators
npm run emulators

# Terminal 2 (set VITE_USE_FIREBASE_EMULATOR=true in web/.env first):
cd web && npm run dev
```

Open `http://127.0.0.1:5173`.

### Run Automated Tests, Lint & Format Checks

```bash
# Web TypeScript check, ESLint + oxlint, Prettier check, and 20 Vitest unit/boundary tests
cd web
npm run lint
npm run format:check
npm test

# Root Firestore Security Rules tests (39 emulator unit tests)
cd ..
npm run test:rules
```

### Build Production Bundle

```bash
npm run build:web
# Outputs optimized static bundle to web/dist/
```

---

## Firebase Hosting Deployment

Deployment configuration lives in [`firebase.json`](firebase.json) (CSP and security headers, SPA rewrites, `public: "web/dist"`) and [`.firebaserc`](.firebaserc) (`dasturxon-27a6e`). Exact step-by-step instructions to authenticate (`firebase login`), set production env vars, deploy rules and hosting (`npm run deploy:hosting`), and complete remaining academic report blanks are in [`docs/STUDENT_TODO.md`](docs/STUDENT_TODO.md).

---

## Folder Structure

```text
Dasturxon/
├── android-legacy/            # Preserved read-only Kotlin/Compose Android project
├── docs/
│   ├── CODE_CONVENTIONS.md    # Enforced TypeScript/React coding conventions
│   ├── GIT_GUIDE.md           # Git history & rollback guide with real repo examples
│   ├── STATUS.md              # Engineering audit & verification log
│   ├── STUDENT_TODO.md        # Checklist of [TO'LDIRING] report items & deploy steps
│   ├── diagrams/              # Mermaid sources (.mmd) and rendered PNG diagrams
│   ├── screenshots/           # Real browser screenshots of key views
│   └── report/                # Uzbek academic report chapters (00-10) + Word .docx
├── test/
│   └── firestore.rules.test.mjs  # 39 @firebase/rules-unit-testing security tests
├── web/
│   ├── .env.example           # Template for Vite Firebase Web config
│   ├── eslint.config.js       # Layer-boundary, security, and style lint rules
│   ├── index.html             # HTML entry with fallback CSP & referrer meta headers
│   ├── package.json           # Web app dependencies & Vite/Vitest scripts
│   ├── src/
│   │   ├── components/        # Reusable UI components, modals, charts, RouteGuards
│   │   ├── config/            # Firebase Web SDK initialization & persistence setup
│   │   ├── context/           # AuthContext + real-time user profile observer
│   │   ├── hooks/             # Observer hooks (onSnapshot) for customer/owner/admin
│   │   ├── pages/             # Route-level pages for auth, customer, owner, admin
│   │   ├── repositories/      # Firestore access & transactions (only Firebase callers)
│   │   ├── services/          # Pure domain logic (orderLogic, analytics, validators)
│   │   └── types/             # TypeScript domain models & interfaces
│   └── tests/                 # Vitest unit & boundary test suites (20 tests)
├── .firebaserc                # Default Firebase project alias (dasturxon-27a6e)
├── firebase.json              # Firestore rules, indexes, emulator ports, Hosting CSP
├── firestore.indexes.json     # Composite Firestore indexes
├── firestore.rules            # Least-privilege Firestore security rules
└── package.json               # Root scripts for rules tests, emulators, build, deploy
```
