# 02. Dasturiy ta’minot jarayoni modeli va Sprint 1 rejasi

**Loyiha nomi:** Dasturxon (Mahalla Bozori)  
**Fan:** Dasturiy injiniringga kirish  

---

## 1. Jarayon modellarini taqqoslash

Dasturiy injiniring amaliyotida keng qo‘llaniladigan to‘rtta asosiy hayot sikli modeli (Pressman & Maxim, 2020; Sommerville, 2016) Dasturxon loyihasi sharoitiga nisbatan sodda va tushunarli tilda taqqoslandi:

| Model nomi | Qisqacha tavsifi (sodda tilda) | Afzalliklari | Dasturxon loyihasi uchun kamchiligi |
| :--- | :--- | :--- | :--- |
| **Waterfall (Sharshara)** | Ishlar qat’iy ketma-ketlikda bajariladi: avval barcha talablar yoziladi, keyin dizayn, keyin kodlash, oxirida testlash. Oldingi bosqich tugamasdan keyingisiga o‘tilmaydi. | Hujjatlashtirish tartibli, bosqich chegaralari aniq. | O‘quv loyihasida talablar va Android dan Web ga o‘tish kabi texnik kashfiyotlar jarayon davomida o‘zgaradi; oxirigacha ishlaydigan ilova ko‘rinmaydi. |
| **V-model** | Waterfall ning qat’iylashtirilgan ko‘rinishi bo‘lib, har bir ishlab chiqish bosqichiga qarama-qarshi testlash bosqichi (modul, integratsiya, tizim, qabul testlari) mos qo‘yiladi. | Test talablari erta rejalashtiriladi, xavfsiz tizimlarda kuchli. | Kichik jamoa va qisqa muddatli iterativ veb-ilova uchun ortiqcha byurokratiya tug‘diradi; talab o‘zgarishiga moslashuvchanligi past. |
| **Spiral** | Loyiha bir necha halqalar (sikllar) bo‘ylab boradi; har bir halqada maqsad qo‘yish, **xavflarni tahlil qilish**, prototip yaratish va baholash majburiy bajariladi. | Yuqori xavfli (riskli) yirik tizimlarda falokatlarning oldini oladi. | Har bir siklda chuqur risk-menejment tahlili o‘quv loyihasi hajmidan kattaroq boshqaruv xarajatini talab qiladi. |
| **Agile / Iterativ (Scrum-lite)** | Ish qisqa sikllarga (Sprintlarga) bo‘linadi. Har bir sikl yakunida haqiqiy ishlaydigan kichik natija olinadi, sinovdan o‘tkaziladi va keyingi qadam rejalashtiriladi. | Tez natija beradi, xatolarni erta aniqlaydi, talab o‘zgarganda moslashish oson. | Intizom bo‘lmasa, arxitektura va hujjatlar orqada qolishi mumkin (buni `STATUS.md` va `CODE_CONVENTIONS.md` orqali bartaraf etamiz). |

---

## 2. Tanlangan model: Agile (Scrum-lite) va uchta asosiy sabab

Loyiha uchun **Agile (Scrum-lite)** jarayon modeli tanlandi (Schwaber & Sutherland, 2020). Tanlovning uchta asosiy sababi:

1. **Tezkor ishlaydigan prototip va qayta aloqa:** Talablar bo‘yicha dastlabki Android versiyada build va runtime muammolari chiqqanidan so‘ng, veb-versiyada har bir rol (`customer`, `owner`, `admin`) funksiyalarini kichik qismlar bilan darhol brauzerda ishga tushirib tekshirish zarur edi.
2. **O‘zgarishlarga moslashuvchanlik va xavfni boshqarish:** Kichik qismlarga bo‘lib ishlash (`feat:`, `security:`, `test:`, `docs:` kichik commit lar) muammo chiqqanda faqat bitta modulni tuzatish va ilovani doimo yig‘iladigan (`build`) holatda saqlash imkonini beradi.
3. **O‘quv muddati va yakka/kichik jamoa samaradorligi:** "Dasturiy injiniringga kirish" kursi doirasida qisqa vaqt ichida ham ishlaydigan kodni, ham xavfsizlik/test metrikalarini parallel olib borish uchun eng yengil va natijador model — Scrum-lite (1–2 haftalik sprintlar, aniq backlog va har qadamda `docs/STATUS.md` yangilanishi).

---

## 3. Foydalanuvchi hikoyalari (User Stories — kamida 10 ta)

Barcha asosiy funksiyalar foydalanuvchi qiymatiga ko‘ra ustuvorlik (`Must`, `Should`, `Could` — MoSCoW) bilan shakllantirildi:

| ID | Foydalanuvchi hikoyasi (*"Men ... sifatida ... xohlayman, ... uchun"*) | Ustuvorlik | Sprint | Holat |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | **Men** yangi foydalanuvchi **sifatida** Email va parol bilan (rolimni `customer` yoki `owner` deb tanlab) ro‘yxatdan o‘tishni **xohlayman**, shaxsiy kabinetimga xavfsiz kirish **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-02** | **Men** foydalanuvchi **sifatida** login sahifasida parolni ko‘rsatish tugmasi (`show-password`) va tushunarli xato xabarlarini ko‘rishni **xohlayman**, parol kiritishda adashmaslik **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-03** | **Men** xaridor **sifatida** tasdiqlangan bizneslarning mahsulotlarini qidiruv va toifa filtri bo‘yicha ko‘rishni **xohlayman**, yaqin atrofdagi kerakli mahsulotni tez topish **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-04** | **Men** xaridor **sifatida** mahsulot sonini tanlab, olib ketish (`pickup`) yoki yetkazib berish (`delivery`) usuli bilan buyurtma berishni **xohlayman**, mahsulot zaxirasi men uchun aniq band qilinishi **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-05** | **Men** xaridor **sifatida** *"Buyurtmalarim"* sahifasida buyurtmam holatini (Kutilmoqda, Qabul qilindi, Tayyor, Yakunlandi) real vaqtda ko‘rishni va `pending` paytida bekor qilishni **xohlayman**, borish vaqtimni rejalashtirish **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-06** | **Men** biznes egasi **sifatida** novvoyxona/do‘kon profilimni yaratishni va admin tasdiqlash holatini ko‘rishni (rad etilsa sababini o‘qib qayta yuborishni) **xohlayman**, qonuniy savdo boshlash **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-07** | **Men** biznes egasi **sifatida** mahsulotlarni qo‘shish, tahrirlash, sotish narxi, maxfiy tannarx (`costPrice`) va zaxirani (`stock`) boshqarishni **xohlayman**, vitrinada faqat dolzarb mahsulotlar ko‘rinishi **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-08** | **Men** biznes egasi **sifatida** kiruvchi buyurtmalarni qabul qilish, tayyor belgilash, yakunlash va to‘lovni tasdiqlashni (`paid`) **xohlayman**, mijozga o‘z vaqtida xizmat ko‘rsatish **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-09** | **Men** biznes egasi **sifatida** xarajatlarni kiritish va kunlik/haftalik/oylik daromad hamda sof foyda analitikasini ko‘rishni **xohlayman**, biznes rentabelligini nazorat qilish **uchun**. | O‘rta (`Should`) | Sprint 2 | Bajarildi |
| **US-10** | **Men** administrator **sifatida** kutilayotgan biznes arizalarini tasdiqlash yoki aniq sabab ko‘rsatib rad etishni **xohlayman**, platformaga faqat ishonchli bizneslarni kiritish **uchun**. | Yuqori (`Must`) | Sprint 1 | Bajarildi |
| **US-11** | **Men** tizim egasi **sifatida** mijozlar tannarx (`costPrice`) ni va boshqa xaridorlarning buyurtmalarini ko‘ra olmasligini **xohlayman**, ma’lumotlar maxfiyligini ta’minlash **uchun**. | Yuqori (`Must`) | Sprint 2 | Bajarildi |
| **US-12** | **Men** mobil xaridor **sifatida** sayt telefonda gorizontal siljishsiz (`390px` kenglikda) chiroyli ochilishini **xohlayman**, yo‘lda ham bemalol buyurtma berish **uchun**. | O‘rta (`Should`) | Sprint 2 | Bajarildi |

---

## 4. Sprint 1 rejasi (MVP poydevori va asosiy oqimlar)

**Sprint 1 maqsadi:** Android loyihasini arxivlab, React + Vite + TypeScript + Firebase Web SDK asosida barcha uchta rol (`customer`, `owner`, `admin`) uchun to‘liq ishlaydigan, atomik zaxira tranzaksiyali MVP ilovani ishga tushirish.

| Vazifa | Bog‘liq US | Mas’ul qatlam | Qabul mezoni (Definition of Done) |
| :--- | :--- | :--- | :--- |
| Migratsiya va Vite + TypeScript bazasini sozlash | — | `web/src/config/`, `android-legacy/` | Loyiha `npm run build` dan xatosiz o‘tadi, `.env` himoyalangan. |
| Auth konteksti, rolga asoslangan marshrut himoyasi (`RoleGuard`) | US-01, US-02 | `context/AuthContext`, `components/RouteGuards`, `pages/LoginPage`, `RegisterPage` | Parolni ko‘rsatish tugmasi ishlaydi; rol noto‘g‘ri bo‘lsa kirish cheklanadi. |
| Biznes profili va Admin tasdiqlash paneli | US-06, US-10 | `repositories/businessRepository`, `pages/owner/`, `pages/admin/` | Owner profil yaratadi; Admin tasdiqlaydi yoki sabab bilan rad etadi. |
| Mahsulot CRUD (`costPrice` ajratilgan holda) | US-07 | `repositories/productRepository`, `components/owner/ProductFormModal` | `costPrice` faqat `products/{id}/private/cost` ichiga yoziladi. |
| Xaridor tasmasida qidiruv/filtr + tranzaksiyali buyurtma | US-03, US-04, US-05 | `hooks/useCustomerFeed`, `orderRepository`, `orderLogic` | Buyurtma berilganda zaxira `runTransaction` orqali kamayadi; tarix `onSnapshot` da yangilanadi. |
| Buyurtmalarni boshqarish va yakunlash | US-08 | `pages/owner/OwnerOrdersPage`, `hooks/ownerActions` | `pending -> accepted -> ready -> completed` va `paymentStatus = paid` ishlaydi. |
