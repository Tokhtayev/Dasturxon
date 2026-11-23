# QA Report

Sana: 2026-11-13

## Avtomatik tekshiruvlar

- Bazaviy app:assembleDebug app:testDebugUnitTest: muvaffaqiyatli, 11 unit test o'tdi.
- Auth/rulesdan keyingi debug build va unit test: muvaffaqiyatli, 11 test o'tdi.
- UI/owner o'zgarishlaridan keyingi debug build va unit test: muvaffaqiyatli, 11 test o'tdi.
- app:lint app:assembleRelease app:testDebugUnitTest: Gradle muvaffaqiyatli tugadi.
- Yakuniy app:assembleDebug app:testDebugUnitTest app:assembleDebugAndroidTest: muvaffaqiyatli, 11 unit test o'tdi, Android test APK yig'ildi.
- Firestore Emulator rules tests: bajarilmadi, Node.js/npx o'rnatilmagan.
- Qurilmadagi Compose UI test: APK yig'ildi, test emulyatorda bajarilmadi.

## Ko'rib chiqilgan

- Auth email validation, parol tasdiqlash, reset email, email verification gate, loading/double submit.
- Profil Firestore write muvaffaqiyatsiz bo'lsa Auth foydalanuvchisini rollback qilish.
- Checkout stock/price transaction, stock limit va progress indicator.
- Firestore role, maydon turi/uzunligi, stock, price, status transition qoidalari.
- Admin rejection reason, owner rejected biznesni qayta yuborishi.
- Manifest backup va cleartext trafik o'chirilgan.

## Hali bajarilmagan

Firestore Emulator role/forbidden-action testlari, parallel stock checkout, haqiqiy email yuborish, offline/online, real device/tablet/rotation/TalkBack, Crashlytics/App Check, signing va Play release QA. docs/QA_MATRIX.md da qo'lda bajarish ssenariylari bor.

Hisobot faqat amalda bajarilgan ishlarni o'tdi deb belgilaydi; Firebase Console yoki qurilmadagi tekshiruvlar bajarilmagan.