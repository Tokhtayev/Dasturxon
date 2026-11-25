# 10. Xavflarni boshqarish, real muammo tahlili va kelajak rejalari

**Loyiha nomi:** Dasturxon (Mahalla Bozori)  
**Fan:** Dasturiy injiniringga kirish  

---

## 1. Loyiha xavflari reyestri (5 ta asosiy xavf)

| № | Xavf tavsifi | Ehtimolligi | Ta’siri | Oldini olish chorasi | Favqulodda / zaxira reja (Contingency) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **R1** | **Qurish va ishga tushirish muhitining nosozligi:** mobil/desktop SDK bog‘liqliklari sababli ilova kompilyatsiya bo‘lmay qolishi | **Yuqori** *(amalda yuz berdi)* | Yuqori | Modullarni ajratish, har o‘zgarishdan keyin avtomatik build tekshiruvi | Yig‘ish xatosi takrorlansa, barqaror veb-stekka (React + Vite) ko‘chish va eski kodni `android-legacy/` da saqlash |
| **R2** | **Zaxira bo‘yicha poyga holati (Race Condition):** ikki xaridor oxirgi mahsulotni bir vaqtda zakaz qilishi | **O‘rta** | Yuqori | Cloud Firestore `runTransaction` va `firestore.rules` dagi `getAfter()` qoidalari | Qoidalar rad etgan ikkinchi so‘rovga aniq *"Zaxira yetarli emas"* xabarini ko‘rsatish va katalog snapshotini yangilash |
| **R3** | **Ma’lumot sizib chiqishi (`costPrice` / boshqa xaridor buyurtmasi):** mijoz yoki begona shaxs yopiq ma’lumotni o‘qishi | **Past** | Yuqori | `products/{id}/private/cost` subkolleksiyasi, `firestore.rules` (39 ta test), CSP | Firebase Console da qoidalarni darhol qaytarish (`firebase deploy --only firestore:rules`), tokenlarni bekor qilish |
| **R4** | **Firebase Spark bepul tarifining kunlik kvotasi to‘lishi:** ortiqcha `onSnapshot` ulanishlari hisobidan o‘qish soni oshishi | **Past** | O‘rta | Query larni biznes va mijoz ID si bilan tor filtrlash, keraksiz tinglovchilarni cleanup da yopish | Analitika va arxiv buyurtmalar uchun sahifalash (`limit`) qo‘shish yoki Blaze tarifiga o‘tish |
| **R5** | **Foydalanuvchilar tomonidan qabul qilinmaslik:** mahalliy novvoyxona egalari kompyuter/veb-panelni murakkab deb bilishi | **O‘rta** | O‘rta | Mobile-first o‘zbekcha interfeys (`390px` moslashuv), sodda KPI va 3 qadamli buyurtma | Real foydalanuvchi sinovi (`06-ux.md`) natijalariga ko‘ra maydonlarni soddalashtirish va qo‘llanma qo‘shish |

---

## 2. Haqiqiy muammo tahlili (Loyiha davomida amalda yuz bergan hodisa)

O‘quv loyihasi davomida nazariy xavf emas, balki real texnik inqiroz yuz berdi:

1. **Nima sodir bo‘ldi?**  
   Loyiha dastlab Android platformasida Kotlin, Jetpack Compose, Hilt va Google Credential Manager asosida boshlangan edi. Rivojlantirish jarayonida Gradle/KSP va Android muhiti bog‘liqliklari sababli takroriy yig‘ish (build) va runtime xatoliklari chiqdi, jismoniy telefonsiz UI ni to‘liq tekshirish qiyinlashdi (`docs/AUDIT.md`, `00-migratsiya.md`). Bundan tashqari, `RoleHome.kt` fayli 1900 satrdan oshib ketib, UI va `FirebaseFirestore` murojaatlari aralashib qolgan edi.
2. **Qanday qaror qilindi va nima qutqarib qolindi?**  
   Noldan hamma narsani tashlab yubormaslik uchun arxitekturaviy ajratish qo‘llandi: mavjud Firebase loyihasi (`dasturxon-27a6e`), Firestore kolleksiyalar tuzilmasi, `firestore.rules` va `firestore.indexes.json` to‘liq saqlab qolindi. Android kodi `android-legacy/` papkasiga xavfsiz ko‘chirildi (`99d6606`), veb-platforma esa uch qatlamli React + Vite + TypeScript arxitekturasida qayta yozildi (`92145db`).
3. **Ikkinchi kichik hodisa (`b836501`):**  
   `390x844` telefon o‘lchamida `vite preview` tekshiruvi chog‘ida `WelcomePage` sarlavha panelida `9.6px` gorizontal siljish (`scrollWidth = 400`, `innerWidth = 390`) aniqlandi. `DxLogo.tsx` va `WelcomePage.tsx` flex qoidalari tuzatilib, `scrollWidth === 390` ga keltirildi.
4. **Olingan asosiy saboq:**  
   Ma’lumotlar modeli va xavfsizlik qoidalarini UI dan mustaqil loyihalash platforma almashganda ham barcha biznes mantiqini va xavfsizligini tezda saqlab qolish imkonini berar ekan.

---

## 3. Foydalanuvchi so‘rovnoma shabloni (3 ta savol — `[TO'LDIRING]`)

> **Eslatma:** Quyidagi 3 ta savol bo‘yicha respondent javoblari talaba tomonidan Google Forms yoki qog‘oz so‘rovnoma orqali yig‘ilgach kiritiladi.

- **So‘rovnoma o‘tkazilgan sana va ishtirokchilar soni:** `[TO'LDIRING]`

1. **Siz mahalla novvoyxonasi yoki oshxonasidan buyurtma berishda / qabul qilishda ushbu veb-saytdan har hafta foydalanar edingizmi? (Ha / Ba’zan / Yo‘q — nima uchun?)**  
   - Yig‘ilgan natijalar xulosasi: `[TO'LDIRING]`
2. **Tizimdagi qaysi imkoniyat sizga eng foydali tuyuldi (jonli zaxira ko‘rinishi, real vaqtdagi buyurtma holati, foyda analitikasi va h.k.)?**  
   - Yig‘ilgan natijalar xulosasi: `[TO'LDIRING]`
3. **Keyingi versiyada qaysi bitta qo‘shimcha funksiya qo‘shilsa ilova siz uchun yanada foydali bo‘lar edi?**  
   - Yig‘ilgan natijalar xulosasi: `[TO'LDIRING]`

---

## 4. "Agar bu loyihani yana bir yil davom ettirsam" (Real kod holatiga asoslangan 4 ta reja)

Hozirgi MVP kod bazasining (`web/src/`, `firebase.json`, `firestore.rules`) haqiqiy holatidan kelib chiqib, keyingi bir yillik rivojlanish yo‘nalishlari quyidagicha belgilandi:

1. **Firebase Storage orqali real taom rasmlarini yuklash va siqish:** Hozirda `ProductFeedCard` toifa ikonkasi va gradient fonidan (`BUSINESS_TYPE_VISUALS`) foydalanadi (`Product.imageUrl` esa bo‘sh qolishi mumkin). Cloud Storage + `firestore/storage.rules` + brauzerda WebP ga siqish qo‘shilsa, mahsulotlar vitrinasi yanada jozibador bo‘ladi.
2. **Onlayn to‘lov (Click / Payme) va Cloud Functions webhooki:** Hozir to‘lov joyida naqd yoki QR orqali qabul qilinib, biznes egasi `paymentStatus = 'paid'` ni qo‘lda bosadi (`orderRepository.ts`). Cloud Functions server qismi qo‘shilsa, onlayn to‘lov tasdiqlanganda buyurtma avtomatik `paid` holatiga o‘tadi.
3. **Ko‘p mahsulotli savat (Multi-item Cart) va yetkazish masofasi:** Hozirgi `OrderCheckoutModal` bitta tanlangan mahsulotning `1..99` donasini atomik tranzaksiyada rasmiylashtiradi (`orderLogic.ts`). Bir nechta mahsulotni bitta savatda Cloud Firestore `runTransaction` orqali yopish va mahalla masofasiga ko‘ra saralash mijoz qulayligini oshiradi.
4. **Firebase App Check va PWA (Offline + Push-bildirishnomalar):** Ishlab chiqarish muhitida botlardan himoya uchun reCAPTCHA Enterprise asosida App Check yoqish hamda yangi buyurtma tushganda biznes egasiga Firebase Cloud Messaging orqali darhol bildirishnoma yuborish.
