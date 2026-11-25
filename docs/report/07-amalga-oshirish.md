# 07. Tizimni amalga oshirish (Kodlash va Integratsiya)

**Loyiha nomi:** Dasturxon (Mahalla Bozori)  
**Fan:** Dasturiy injiniringga kirish  

---

## 1. Texnologik stek va modullar tuzilmasi

Loyiha `web/` papkasida zamonaviy frontend va Firebase bulut xizmatlari asosida amalga oshirildi:
- **Asosiy kutubxonalar:** React 19, TypeScript 5, Vite, React Router (`HashRouter`), Firebase Web SDK (modular v11+ / `firebase/auth`, `firebase/firestore`).
- **Sifat nazorati vositalari:** ESLint + `oxlint`, Prettier, Vitest (`vitest run`), `@firebase/rules-unit-testing`.
- **Kod tartibi (`web/src/`):**
  - `config/firebase.ts`: Firebase initsializatsiyasi, `indexedDBLocalPersistence` va zarur hollarda emulyatorga ulanish (`VITE_USE_FIREBASE_EMULATOR`).
  - `repositories/`: 5 ta fayl (`authRepository.ts`, `businessRepository.ts`, `productRepository.ts`, `orderRepository.ts`, `expenseRepository.ts`).
  - `services/`: sof biznes mantiq (`orderLogic.ts`, `analytics.ts`, `validators.ts`, `errors.ts`, `constants.ts`, `routing.ts`).
  - `hooks/` va `context/`: `AuthContext.tsx`, `useCustomerFeed.ts`, `useCustomerOrders.ts`, `useOwnerDashboard.ts`, `ownerActions.ts`, `useAdminBusinesses.ts`.
  - `pages/` va `components/`: har uchala rol (`customer`, `owner`, `admin`) va umumiy auth sahifalari.

---

## 2. Amalga oshirish tarixi (`ai-night` tarmog‘idagi commit lar)

Barcha bosqichlar kichik, tekshiriladigan va har biri oldidan `build` hamda testlardan o‘tgan commit lar shaklida bajarildi:

| Bosqich | Commit | Qisqa mazmuni |
| :--- | :--- | :--- |
| Migratsiya | `99d6606` | Android kod bazasi `android-legacy/` papkasiga ko‘chirildi. |
| Web asos | `9879857` | Modular Firebase SDK, domen turlari (`domain.ts`), `validators.ts` va `analytics.ts` yaratildi. |
| Ma’lumot va kuzatuv | `4fbba71` | 5 ta repository, `onSnapshot` hooklar va `AuthContext` yozildi. |
| MVP UI | `92145db`, `c79735e` | Barcha sahifalar, `RoleGuard`, ro‘yxatdan o‘tishda taxallus (`nickname`) tekshiruvi bilan atomik rollback amalga oshirildi. |
| Kod konvensiyalari | `4bb1795` | `CODE_CONVENTIONS.md`, ESLint qat’iy qoidalari va Prettier sozlandi. |
| Xavfsizlik (`security:`) | `008996b`, `ff826ba`, `633fff0` | Firestore qoidalari kuchaytirildi, kiritish validatsiyasi va XSS tozalash qo‘shildi, CSP sarlavhalari hamda token redaksiyasi yoqildi. |
| Testlash va Mobil UX | `4b83ed0`, `b836501` | 20 ta Vitest moduli/chegara testi yozildi; `WelcomePage.tsx` dagi mobil header overflow bartaraf etildi. |

---

## 3. End-to-End (E2E) ishga tushirish tekshiruvi

Ilova Firebase Auth va Cloud Firestore Emulyatori bilan bog‘langan holda brauzerda (`http://127.0.0.1:5173`) to‘liq 6 bosqichli sinovdan o‘tkazildi (`docs/STATUS.md`, `b3dc640`):
1. Biznes egasi ro‘yxatdan o‘tib, *"Baraka novvoyxonasi"* profilini yaratdi (`pending`).
2. Administrator kirib, biznesni tasdiqladi (`approved`).
3. Biznes egasi mahsulot (*Tandir non*, sotish narxi `5 000 so‘m`, maxfiy tannarx `2 200 so‘m`, zaxira `20`) qo‘shdi.
4. Xaridor 2 dona *Tandir non* ga buyurtma berdi — `runTransaction` zaxirani `20 -> 18` ga tushirdi (`10 000 so‘m`).
5. Biznes egasi buyurtmani `accepted -> ready -> completed` bosqichlaridan o‘tkazib, to‘lovni `paid` deb belgiladi va xarajat qo‘shdi.
6. Analitika sahifasida real Firestore hujjatlari asosida tushum, COGS va sof foyda to‘g‘ri yangilandi; `firestore.rules` va `localStorage` bo‘shligi brauzer konsolida `0` ta xato bilan tasdiqlandi.
