# 00. Android dan Web platformasiga migratsiya hisoboti

**Loyiha nomi:** Dasturxon (Mahalla Bozori)  
**Fan:** Dasturiy injiniringga kirish  
**Tarmoq:** `ai-night`  
**Muallif (talaba):** [TO'LDIRING: Talaba F.I.Sh. va guruh raqami]  
**Migratsiya sanasi:** 2026-11-25  

---

## 1. Kirish va migratsiyaning asosiy sabablari

Dasturxon loyihasi dastlab Android operatsion tizimi uchun Kotlin, Jetpack Compose va Firebase asosida (`com.example.dasturxon`) ishlab chiqilgan edi. Biroq loyihaning avvalgi bosqichlarida o‘tkazilgan texnik audit (`docs/AUDIT.md`, `docs/REVIEW_FINDINGS.md`, `docs/STATUS.md`) hamda amaliy yig‘ish (build) va ishga tushirish jarayonlarida bir qator tizimli muammolar aniqlandi:

1. **Kompilyatsiya va qurilma muammolari:** Gradle va Android Studio muhitida bog‘liqliklar (Hilt, KSP, Compose, Google Credential Manager) bilan bog‘liq takroriy yig‘ish va runtime xatoliklari yuzaga keldi; Android UI testlari faqat APK sifatida yig‘ilib, emulyator yoki jismoniy telefonsiz to‘liq avtomatik tekshiruvdan o‘tkazilmadi (`README.md`).
2. **Arxitekturaviy bog‘lanib qolish (Tight Coupling):** Audit davomida `MainActivity.kt` va `RoleHome.kt` (1900 satrdan ortiq monolit fayl) ichida UI komponentlar to‘g‘ridan-to‘g‘ri `FirebaseFirestore` murojaatlari bilan aralashib ketgani qayd etilgan.
3. **Tarqatish va foydalanish to‘siqlari:** Mijozlar va mahalliy biznes egalari ilovadan foydalanishi uchun APK faylni qo‘lda o‘rnatish talab qilinar edi. Google Play Console imzolash kalitlari, App Check (Play Integrity) va Crashlytics tashqi sozlamalari mavjud bo‘lmagani sababli real foydalanuvchilarga tezkor havola orqali tarqatish imkoni cheklangan edi.
4. **Vaqt va kurs talablari:** "Dasturiy injiniringga kirish" fani yakuniy loyihasi doirasida barcha uchta rol (xaridor, biznes egasi, administrator) uchun mobil telefonda ham, kompyuter brauzerida ham barqaror ishlaydigan, tezkor tekshiriladigan hamda ommaviy havola orqali ochiladigan veb-ilova taqdim etish zarur bo‘ldi.

Shu sababli Android kod bazasi o‘chirilmasdan `android-legacy/` papkasiga arxivlandi va loyiha zamonaviy React + Vite + TypeScript + Firebase Web SDK stekida qayta qurishga qaror qilindi.

> **[TO'LDIRING: Talabaning shaxsiy izohi va Android muhitida uchragan aniq xatolar / sarflangan vaqt jurnali]**  
> - Avvalgi Android versiyada sarflangan vaqt: `[TO'LDIRING]` soat  
> - Qurilmada uchragan asosiy muammolar: `[TO'LDIRING]`

---

## 2. Qayta foydalanilgan mavjud aktivlar

Migratsiya jarayonida loyihaning eng muhim va sinovdan o‘tgan qismlari to‘liq saqlab qolindi:

| Aktiv turi | Saqlab qolingan element | Izoh |
| :--- | :--- | :--- |
| **Firebase loyihasi** | `dasturxon-27a6e` (loyiha raqami `437798898747`) | Mavjud Authentication va Cloud Firestore bazasi saqlandi. |
| **Ma’lumotlar modeli (Schema)** | `users`, `usernames`, `businesses`, `products`, `products/{id}/private/cost`, `orders`, `orders/{id}/items`, `expenses`, `events` | Barcha maydon nomlari va subkolleksiyalar Android versiyasi bilan bir xil saqlandi. |
| **Xavfsizlik qoidalari** | `firestore.rules` | Eng kam imtiyoz (least-privilege) tamoyilidagi qoidalar, `costPrice` izolyatsiyasi va atomik buyurtma tekshiruvlari to‘liq saqlandi. |
| **Indekslar** | `firestore.indexes.json` | Murakkab Firestore so‘rovlari uchun kompozit indekslar saqlab qolindi. |
| **Brend va dizayn tizimi** | Material 3 ranglar palitrasi (`#B7500A`, `#0F7C84`, `#4C7A2B`, `#FFF8F1`), `ic_logo_mark.xml` nishoni va mahalliy taom rasmlari | Vizual uslub va o‘zbekcha atamalar veb-interfeysga o‘tkazildi. |

---

## 3. Qayta yozilgan qatlamlar va yangi veb-arxitektura

Yangi veb-ilova `web/` papkasida mobil qurilmalarga moslashuvchan (mobile-first) tamoyilida noldan tartibli uch qatlamli arxitekturada yozilmoqda:

1. **Taqdimot qatlami (`pages/` va `components/`):** React 19, Tailwind CSS v4 va React Router (`react-router-dom`) asosida har bir rol (`customer`, `owner`, `admin`) uchun marshrut himoyasi (route guard) bilan quriladi. Komponentlar ichida Firestore SDK ga to‘g‘ridan-to‘g‘ri murojaat qilish taqiqlanadi.
2. **Mantiq va kuzatuv qatlami (`hooks/` va `services/`):** Biznes tekshiruvlar (`validators.ts`), `Asia/Tashkent` vaqt zonasi bo‘yicha moliyaviy tahlil (`analytics.ts`) hamda Firestore `onSnapshot` tinglovchilarini o‘rab turuvchi Observer hooklar shu qatlamda joylashadi.
3. **Ma’lumotlarga kirish qatlami (`repositories/`):** Firebase Web SDK ning modulli API lari (`firebase/app`, `firebase/auth`, `firebase/firestore`) yordamida Auth, Business, Product, Order va Expense repozitoriylari amalga oshiriladi.
4. **Maxfiylik va konfiguratsiya:** Firebase Web konfiguratsiyasi Git ga kiritilmaydigan `web/.env` faylida saqlanadi; repozitoriyda esa faqat namunaviy `web/.env.example` fayli qoldiriladi.

---

## 4. Phase 0 bo‘yicha haqiqiy tekshiruv natijalari

Migratsiya boshlang‘ich bosqichida quyidagi real buyruqlar ishga tushirildi va natijalar qayd etildi:

### 4.1. Firestore xavfsizlik qoidalari testi (`npm run test:rules`)
```text
> npm run test:rules
> npx -y firebase-tools@latest emulators:exec --project demo-dasturxon --only firestore "node --test test/firestore.rules.test.mjs"

ℹ tests 34
ℹ suites 0
ℹ pass 34
ℹ fail 0
ℹ duration_ms 4205.915
```

### 4.2. Web poydevori build, lint va unit testlari
```text
> cd web && npm run build && npm run lint && npm test

vite v8.3.8 building client environment for production...
✓ built in 453ms

oxlint: Found 0 warnings and 0 errors. (26 files)

node --test tests/*.ts:
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ duration_ms 166.3855
```

---

## 5. Xulosa

Android loyihasini `android-legacy/` papkasiga xavfsiz ko‘chirish va Firebase infratuzilmasini saqlagan holda React + TypeScript + Firebase Web SDK asosidagi veb-platformaga o‘tish birinchi bosqichni muvaffaqiyatli yakunladi. Keyingi bosqichda (Phase 1) barcha rollar uchun repozitoriylar, Observer hooklar va real Firestore emulyatori bilan integratsiya qilingan MVP interfeysi quriladi.
