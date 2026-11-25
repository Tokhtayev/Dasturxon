# 08. Dastur sifatini ta’minlash va axborot xavfsizligi hisoboti

**Loyiha nomi:** Dasturxon (Mahalla Bozori)  
**Fan:** Dasturiy injiniringga kirish  
**Tarmoq:** `ai-night`  
**Muallif (talaba):** [TO'LDIRING: Talaba F.I.Sh. va guruh raqami]  
**Sana:** 2026-11-25

---

## 1. Kod yozish standartlari va avtomatik nazorat (`docs/CODE_CONVENTIONS.md`)

Loyihada kod uslubi va arxitektura intizomini qo‘lda tekshirishga tayanmasdan avtomatik nazorat qilish uchun `docs/CODE_CONVENTIONS.md` hujjati yaratildi va `web/eslint.config.js` hamda `web/.prettierrc` konfiguratsiyalari bilan bog‘landi:

1. **Nomlash qoidalari:** Komponent va interfeyslar `PascalCase`, funksiya va hooklar `camelCase`, o‘zgarmas konstantalar `UPPER_CASE` shaklida yoziladi (`@typescript-eslint/naming-convention`).
2. **Qatlamlar izolyatsiyasi:** `web/src/pages/` va `web/src/components/` ichida `firebase/*` SDK importlari `no-restricted-imports` qoidasi bilan bloklangan — barcha Firebase murojaatlari faqat `repositories/` qatlamida joylashadi.
3. **Sehrli satr va raqamlarsiz kod:** Barcha chegara qiymatlar, vaqt o‘zgarmaslari va holat to‘plamlari `web/src/services/constants.ts` ga chiqarildi (`no-magic-numbers` qoidasi `services/` va `repositories/` da faol).
4. **Funksiya uzunligi va chuqurlik chegarasi:** `max-lines-per-function` (`<= 90` satr servis/repozitoriylarda, `<= 120` satr UI komponentlarda) va `max-depth: 3` amal qiladi; yirik sahifa modallari (`OrderCheckoutModal`, `ProductDetailModal`, `ProductFeedCard`, `CustomerOrderCard`, `ProductFormModal`, `BusinessEditModal`, `ExpenseModal`, `RejectBusinessModal`) alohida komponentlarga ajratildi.
5. **Xavfsiz xatolik boshqaruvi:** Bo‘sh `catch` bloklari (`no-empty`), konsolga ma’lumot chiqarish (`no-console`), `localStorage`/`sessionStorage` dan foydalanish (`no-restricted-globals`) va `dangerouslySetInnerHTML` (`react/no-danger`) qat’iy taqiqlangan.
6. **Formatlash va izohlar:** Barcha 56 ta TypeScript va TSX fayl Prettier (`singleQuote: true`, `printWidth: 100`) standartiga mos keltirildi.

**Amaliy tekshiruv natijasi (`cd web && npm run lint && npm run format:check`):**
- ESLint (`@typescript-eslint`, `react`, `react-hooks`, xavfsizlik qoidalari) + `oxlint`: **56 ta faylda 0 ta xato, 0 ta ogohlantirish** (`71ms`).
- Prettier (`prettier --check`): **barcha 56 ta fayl formatga to‘liq mos**.

---

## 2. Amalga oshirilgan asosiy xavfsizlik himoyalari (`security:` commitlar)

Har bir himoya qatlami alohida izolyatsiyalangan `security:` commiti ko‘rinishida joriy etildi:

1. **`008996b` — Firestore xavfsizlik qoidalari (`firestore.rules`) va emulyator testlari (`@firebase/rules-unit-testing`):**
   - Foydalanuvchi hujjati (`/users/{uid}`): ro‘yxatdan o‘tishda faqat `'customer'` yoki `'owner'` roli ruxsat etiladi (`admin` taqiqlanadi), yangilashda esa `role` va `email` o‘zgarmas (`immutable`), `fullName` uzunligi `2..100` belgi bilan cheklangan.
   - Biznes hujjati (`/businesses/{businessId}`): biznesni faqat haqiqiy `'owner'` yoki `'admin'` roli yaratishi mumkin (`pending` holatda boshlanishi shart); egasi o‘z biznesini o‘zi tasdiqlay olmaydi, faqat administrator `approved` yoki `rejected` holatga o‘tkazadi.
   - Mahsulot hujjati (`/products/{productId}`): public hujjatda `costPrice` maydoni mutlaqo taqiqlangan (faqat `products/{id}/private/cost` ichida egasi va admin uchun ochiq); yaratish va tahrirlashda `price > 0`, `stock >= 0` va `discountPercent` `0..90` bo‘lishi majburiy.
   - Buyurtma hujjati (`/orders/{orderId}`): xaridor faqat o‘z buyurtmasini o‘qiydi/yaratadi (`quantity` `1..99`, biznes `approved` bo‘lishi shart) va faqat `'pending'` holatdan `'cancelled'` holatga o‘tkazishda faqat `['status', 'updatedAt']` maydonlarini o‘zgartira oladi (`paymentStatus` va `totalPrice` ni soxtalashtira olmaydi).
2. **`ff826ba` — Servis qatlamida kirish ma’lumotlarini tekshirish va matnni zararsizlantirish:**
   - `web/src/services/validators.ts` hamda `web/src/services/orderLogic.ts` da `email` (format va `<= 254`), `password` (`8..128` belgi, harf + raqam), `price > 0`, `stock >= 0`, `quantity` (`1..99` va `<= stock`), `discount` (`0..90`), xarajat va rad etish sababi tekshiruvlari barcha repozitoriylar (`authRepository`, `businessRepository`, `productRepository`, `orderRepository`, `expenseRepository`) kirish nuqtalariga majburiy ulangan.
   - `sanitizeUserText` funksiyasi ASCII boshqaruv belgilari, Unicode bidi belgilari va `<` / `>` HTML burchak qavslarini tozalaydi; `escapeHtml` esa HTML konteksti uchun belgilarni ekranlaydi. Butun ilovada `dangerouslySetInnerHTML` ishlatilmaydi (`react/no-danger`).
3. **`633fff0` — Xavfsizlik sarlavhalari (`CSP`) va maxfiy ma’lumotlarni himoyalash:**
   - `firebase.json` dagi `hosting.headers` bo‘limida qat’iy `Content-Security-Policy` (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` va `Permissions-Policy` sarlavhalari belgilandi; GitHub Pages uchun `web/index.html` ga mos `<meta http-equiv="Content-Security-Policy">` qo‘shildi.
   - Firebase Auth `indexedDBLocalPersistence` rejimiga qat’iy sozlandi (`web/src/config/firebase.ts`), `localStorage` va `sessionStorage` ga umuman token yozilmaydi. `redactSensitiveTokens` (`web/src/services/errors.ts`) xatolik xabarlaridagi `AIza...` kalitlar, `Bearer` va `eyJ...` JWT tokenlarni niqoblaydi.

---

## 3. Dastur sifati ko‘rsatkichlari jadvali (`ISO/IEC 25010`)

Quyidagi barcha natijalar real buyruqlar, testlar va `vite preview` (`http://127.0.0.1:4173/`) ustidagi headless Chrome DevTools (`390x844`) o‘lchovlaridan olingan:

| Sifat xususiyati | Qanday o‘lchandi | Haqiqiy natija |
| :--- | :--- | :--- |
| **Xavfsizlik (`Security`)** | `@firebase/rules-unit-testing` (`npm run test:rules`), ESLint xavfsizlik qoidalari (`no-danger`, `no-console`, `no-restricted-globals`), Chrome CDP CSP va saqlash tekshiruvi (`vite preview` `http://127.0.0.1:4173/`) | Firestore Rules: **39/39 PASS** (`6142.42 ms`); CSP buzilishi: **0** (`cspMetaCount = 1`); `localStorageLength = 0`, `sessionStorageLength = 0`; `dangerouslySetInnerHTML`: **0** |
| **Ishonchlilik (`Reliability`)** | Vitest birlik va chegaraviy testlar (`cd web && npm test`), TypeScript kompilatsiyasi (`tsc -b`), ESLint + `oxlint`, Firebase Emulyator E2E oqimi | Vitest: **20/20 PASS** (`337 ms`); ESLint + `oxlint`: **0 xato** (`56` fayl); Brauzer 6 bosqichli E2E oqimi: **PASS** (`0` uncaught JS xatolik) |
| **Foydalanish qulayligi (`Usability`)** | Real brauzerda xaridor oqimini qadam-baqadam sanash va `390x844` mobil viewport geometriya o‘lchovi (`scrollWidth` / `innerWidth`) | Tizimga kirgan xaridordan buyurtma yuborishgacha: **3 ta bosish** (*Mahsulot -> Buyurtma -> Tasdiqlash*); Mobil toshib ketish (`390x844`): **0 px** (`scrollWidth = 390`, `innerWidth = 390`); barcha parol maydonlarida ko‘rish tugmasi mavjud |
| **Samaradorlik (`Performance`)** | Production build (`cd web && npm run build`) o‘lchami hamda `390x844` headless Chrome yuklanish va chizish (`paint`/`navigation`) vaqtlari | Vite build: **965 ms** (HTML gzip `0.87 kB`, CSS gzip `6.34 kB`, JS gzip `285.21 kB`); `DOMContentLoaded`: **2018 ms**, `Load`: **2022 ms**, `First Contentful Paint (FCP)`: **2268 ms** *(sovuq ishga tushirishda Google Fonts tashqi CDN yuklanishi bilan)* |

---

## 4. Tahdidlar modeli jadvali (`Threat Matrix`)

| Tahdid manbasi (Kim) | Qanday zarar yetkazishi mumkin | Ko‘rilgan himoya chorasi | Holati |
| :--- | :--- | :--- | :--- |
| **Yovuz niyatli xaridor** | Boshqa xaridor buyurtmasini o‘qishi, bekor qilishi yoki o‘z buyurtmasini bekor qilish paytida `paymentStatus = 'paid'` va `totalPrice = 0` qilib yuborishi | `firestore.rules` da `customerId == request.auth.uid` izolyatsiyasi va bekor qilishda qat’iy `affectedKeys().hasOnly(['status', 'updatedAt'])` tekshiruvi (`008996b`) | **Himoyalangan** (2, 14, 23, 24, 35-testlar PASS) |
| **Imtiyozini oshiruvchi foydalanuvchi** | Ro‘yxatdan o‘tishda o‘zini `'admin'` qilib yaratishi yoki profilini yangilashda `role` maydonini `'admin'` ga o‘zgartirishi | `firestore.rules` yaratishda `role in ['customer', 'owner']`, yangilashda `request.resource.data.role == resource.data.role`; UI va `Auth` xizmatida faqat `customer`/`owner` tanlovi | **Himoyalangan** (11, 12, 13-testlar PASS) |
| **Insofsiz biznes egasi** | Tasdiqlanmagan biznesini o‘zi `'approved'` qilishi, boshqa do‘kon mahsulotini tahrirlashi yoki tasdiqlangan buyurtmada `totalPrice` ni o‘zgartirishi | `firestore.rules` da `isAdmin()` ruxsatisiz `'approved'` holatga o‘tish, boshqa biznesga egalik qilish hamda `totalPrice`/`quantity` ni o‘zgartirish bloklangan; `costPrice` public hujjatda taqiqlangan | **Himoyalangan** (3, 4, 20–22, 27, 28, 32, 37, 39-testlar PASS) |
| **XSS / Skript inyeksiya hujumchisi** | Mahsulot nomi, izoh yoki manzil maydoniga `<script>` va zararli HTML kiritib boshqa foydalanuvchi sessiyasini buzish | React avtomatik matn ekranlashi + `react/no-danger` (`dangerouslySetInnerHTML` taqiqlangan), `sanitizeUserText` (`validators.ts`), hamda `Content-Security-Policy: script-src 'self'; object-src 'none'` | **Himoyalangan** (`validators.test.ts` + Chrome CSP `0` xato) |
| **Token o‘g‘irlovchi skript / Clickjacking** | `localStorage` dan autentifikatsiya tokenini o‘qish, xato loglaridan API kalit ajratish yoki ilovani yashirin `<iframe>` ichida ochish | Auth `indexedDBLocalPersistence` ga o‘tkazilgan (`localStorage`/`sessionStorage` ESLint da bloklangan), `redactSensitiveTokens` + `no-console`, hamda `X-Frame-Options: DENY` / `frame-ancestors 'none'` | **Himoyalangan** (Chrome `storage = 0`, commit `633fff0`) |
| **Kassa manipulyatsiyasi (Manfiy narx/miqdor)** | So‘rov parametrlarini o‘zgartirib `price <= 0`, `quantity = 0` yoki zaxiradan ko‘p mahsulot buyurtma qilish | Servis (`orderLogic.ts`, `validators.ts`), Atomik Firestore tranzaksiyasi (`lastCheckoutOrderId` + `getAfter`), hamda `firestore.rules` da `price > 0`, `stock >= 0`, `1 <= qty <= 99` qoidalari | **Himoyalangan** (33, 37, 38-testlar + Vitest PASS) |

---

## 5. Kod ko‘rib chiqish (`Code Review`) davomida aniqlangan va tuzatilgan real muammolar

1. **Pre-Auth holatda `usernames` kolleksiyasini o‘qish xatosi (`c79735e`):**
   - *Topilma:* Ro‘yxatdan o‘tishda `signUpWithEmail` avval `usernames/{normalized}` hujjatini o‘qib, keyin `createUserWithEmailAndPassword` chaqirgan. Biroq `firestore.rules` da `allow read: if isSignedIn()` belgilangani bois brauzer E2E testida `permission-denied` xatosi yuz berdi.
   - *Tuzatish:* Autentifikatsiya foydalanuvchisi birinchi yaratildi, so‘ngra `usernames` tekshiruvi va atomik `WriteBatch` bajarildi; agar handle band bo‘lsa yoki yozish muvaffaqiyatsiz tugasa, `deleteUser` orqali Auth hisobi atomik ravishda orqaga qaytariladi.
2. **Filtrsiz `products` tinglovchisi sabab `PERMISSION_DENIED` xavfi (`4fbba71`):**
   - *Topilma:* Firestore qoidalarida mahsulotni o‘qish `isBusinessApproved(resource.data.businessId)` shartiga bog‘liq bo‘lgani uchun barcha `products` kolleksiyasiga filtrsiz `onSnapshot` ulash tasdiqlanmagan biznes mahsulotlariga tegib so‘rovni rad etardi.
   - *Tuzatish:* `productRepository.observeFeedForApprovedBusinesses` faqat tasdiqlangan biznes ID lari ro‘yxati bo‘yicha `where('businessId', 'in', chunk)` qismlari bilan obuna bo‘ladigan qilindi.
3. **Buyurtmani bekor qilishda qo‘shimcha maydonlar himoyasi (`008996b`):**
   - *Topilma:* Xavfsizlik ko‘rib chiqishida xaridor buyurtmani `pending -> cancelled` qilayotganda faqat `customerId` va `businessId` o‘zgarmasligi tekshirilgan, lekin `paymentStatus` yoki `totalPrice` ni o‘zgartirish cheklanmagan edi.
   - *Tuzatish:* `firestore.rules` ga `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt'])` qoidasi kiritildi va 35-emulyator testi bilan tasdiqlandi.
4. **Kichik ekranli mobil sarlavhada `9.6 px` gorizontal toshish (`b836501`):**
   - *Topilma:* `390x844` brauzer tekshiruvida `WelcomePage` bosh sahifasi sarlavhasidagi tugmalar o‘ng chetdan `9.6 px` tashqariga chiqqani aniqlandi.
   - *Tuzatish:* `DxLogo` ning ikkinchi darajali yozuvi `sm` dan kichik ekranlarda yashirildi va sarlavha tugmalari ixchamlashtirildi; qayta Chrome tekshiruvida `scrollWidth` `390px` ga tushib, toshish nolga (`hasHorizontalOverflow = false`) tushdi.
5. **UI qatlamida bog‘lanib qolish va uzun funksiyalar (`4bb1795`):**
   - *Topilma:* Avvalgi Android kod bazasida (`docs/AUDIT.md`) UI komponentlar Firestore SDK ga bevosita ulangan, web migratsiyada esa ayrim modal sahifalar (`CustomerFeedPage`, `OwnerProductsPage`, `useOwnerDashboard`) `140–580` satrgacha kattalashgan edi.
   - *Tuzatish:* UI modallar alohida komponentlarga ajratildi, `no-restricted-imports` va `max-lines-per-function` ESLint qoidalari bilan doimiy nazoratga olindi.
