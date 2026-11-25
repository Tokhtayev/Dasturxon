# 03. Loyiha rejasi, rollar va vaqt jurnali

**Loyiha nomi:** Dasturxon (Mahalla Bozori)  
**Fan:** Dasturiy injiniringga kirish  
**Reja boshlanishi:** `[TO'LDIRING: Loyiha boshlangan sana]`

> **Eslatma (ma’lumotlar halolligi):** Ushbu hujjatdagi soat taxminlari dastlabki reja sifatida keltirilgan. Haqiqiy sarflangan soatlar ("Vaqt jurnali" va *"Reja vs Amalda"* jadvalidagi `Amalda` ustuni) avtomatik to‘ldirilmagan — talaba haqiqiy ishlagan vaqtini qo‘lda kiritishi shart.

---

## 1. Jamoa rollari va mas’uliyat taqsimoti

| Rol | Mas’ul shaxs | Asosiy vazifalari |
| :--- | :--- | :--- |
| **Loyiha menejeri va Tahlilchi** | `[TO'LDIRING: F.I.Sh.]` | Muammo tahlili, foydalanuvchi hikoyalari, intervyu/so‘rovnoma o‘tkazish, sprint rejasi va `STATUS.md` nazorati. |
| **Frontend va UX muhandisi** | `[TO'LDIRING: F.I.Sh.]` | React + Vite sahifalari, mobile-first moslashuvchan dizayn, foydalanuvchi sinovi (usability testing). |
| **Backend / Firebase va Xavfsizlik muhandisi** | `[TO'LDIRING: F.I.Sh.]` | `firestore.rules`, `products/{id}/private/cost` izolyatsiyasi, tranzaksiya va validatsiya qatlamlari, CSP sarlavhalari. |
| **QA va Metrika muhandisi** | `[TO'LDIRING: F.I.Sh.]` | Vitest modul testlari, Firestore Rules testlari, brauzer E2E tekshiruvi, Halstead va McCabe metrikalari. |

*(Izoh: Agar loyiha yakka tartibda bajarilsa, barcha to‘rtta rolni bitta talaba bajaradi.)*

---

## 2. Vazifalar ro‘yxati va rejalashtirilgan soat taxminlari

| Vazifa kodi | Bosqich va vazifa nomi | Rejadagi taxmin (soat) | Bog‘liq natija |
| :--- | :--- | :---: | :--- |
| **W1** | Muammo tahlili, talablarni yig‘ish, foydalanuvchi hikoyalari (01, 02, 04) | 6 | `01-muammo.md`, `02-jarayon-modeli.md`, `04-talablar.md` |
| **W2** | Android kodini arxivlash va Vite + React + Firebase bazasini qurish | 4 | `android-legacy/`, `web/`, `00-migratsiya.md` |
| **W3** | Autentifikatsiya, marshrut himoyasi (`RoleGuard`) va biznes tasdiqlash oqimi | 6 | `AuthContext`, `LoginPage`, `AdminDashboardPage` |
| **W4** | Mahsulot CRUD (`costPrice` ajratilgan) va xaridor katalogi/buyurtma tranzaksiyasi | 10 | `ProductFormModal`, `OrderCheckoutModal`, `orderRepository` |
| **W5** | Xarajatlar, analitika (`completed + paid`) va mobil UI moslashuvi | 6 | `OwnerAnalyticsPage`, `analytics.ts`, `Charts.tsx` |
| **W6** | Xavfsizlik (`firestore.rules`, validatsiya, CSP) va Vitest/Rules testlari | 8 | `08-sifat-xavfsizlik.md`, `09-test-metrika.md`, 59 ta test |
| **W7** | UX sinovi, diagrammalar, hisobot yig‘ish (`05..10`) va Firebase Hosting deploy | 6 | `docs/diagrams/`, `docs/report/`, jonli havola |
| **Jami** | **Umumiy rejalashtirilgan hajm** | **46 soat** | **Barcha 10 ta qadam va yakuniy hisobot** |

---

## 3. Haftalik ish rejasi (Week-by-week jadval)

| Hafta | Asosiy maqsad | Rejadagi vazifalar | Kutilayotgan natija |
| :--- | :--- | :--- | :--- |
| **1-hafta** | Tadqiqot va rejalashtirish | W1, W2 | Muammo bayoni, jarayon modeli, intervyu savollari, Android -> Web migratsiya asosi |
| **2-hafta** | MVP yadrosi (Auth, Biznes, Mahsulot, Buyurtma) | W3, W4 | Barcha 3 rol uchun ishlaydigan MVP, `runTransaction` orqali buyurtma |
| **3-hafta** | Analitika, Xavfsizlik va Sifat | W5, W6 | Foyda hisob-kitobi, `firestore.rules` (39 test), Vitest (20 test), CSP |
| **4-hafta** | UX sinovi, Hujjatlashtirish va Deploy | W7 | Foydalanish qulayligi testi, diagrammalar, yakuniy Word hisobot, Firebase Hosting |

---

## 4. Shaxsiy vaqt jurnali (BO‘SH shablon — talaba to‘ldiradi)

| Sana | Hafta | Bajarilgan aniq ish | Reja kodi | Haqiqiy sarflangan vaqt (soat) | Qisqa izoh / to‘siq |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `[TO'LDIRING]` | 1 | `[TO'LDIRING]` | W1 | `[TO'LDIRING]` | `[TO'LDIRING]` |
| `[TO'LDIRING]` | 1 | `[TO'LDIRING]` | W2 | `[TO'LDIRING]` | `[TO'LDIRING]` |
| `[TO'LDIRING]` | 2 | `[TO'LDIRING]` | W3 | `[TO'LDIRING]` | `[TO'LDIRING]` |
| `[TO'LDIRING]` | 2 | `[TO'LDIRING]` | W4 | `[TO'LDIRING]` | `[TO'LDIRING]` |
| `[TO'LDIRING]` | 3 | `[TO'LDIRING]` | W5 | `[TO'LDIRING]` | `[TO'LDIRING]` |
| `[TO'LDIRING]` | 3 | `[TO'LDIRING]` | W6 | `[TO'LDIRING]` | `[TO'LDIRING]` |
| `[TO'LDIRING]` | 4 | `[TO'LDIRING]` | W7 | `[TO'LDIRING]` | `[TO'LDIRING]` |
| **Jami** | **1–4** | **Umumiy haqiqiy vaqt** | — | **`[TO'LDIRING]`** | **`[TO'LDIRING]`** |

---

## 5. Reja vs Amalda taqqoslash jadvali

*(Ushbu jadvaldagi `Amalda (soat)` va `Farq va sababi` ustunlari ataylab bo‘sh qoldirilgan; talaba haqiqiy vaqt jurnalini yuritib bo‘lgach to‘ldiradi.)*

| Vazifa kodi | Bosqich | Reja (soat) | Amalda (soat) | Farq va sababi |
| :--- | :--- | :---: | :---: | :--- |
| **W1** | Muammo tahlili va talablar | 6 | | |
| **W2** | Migratsiya va Web bazasi | 4 | | |
| **W3** | Auth va Admin tasdiqlash | 6 | | |
| **W4** | Mahsulot CRUD va Buyurtma tranzaksiyasi | 10 | | |
| **W5** | Analitika va Mobil UI | 6 | | |
| **W6** | Xavfsizlik va Testlash | 8 | | |
| **W7** | UX sinovi, Hisobot va Deploy | 6 | | |
| **Jami** | **Umumiy** | **46** | | |
