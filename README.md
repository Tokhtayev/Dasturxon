# Dasturxon (Mahalla Bozori)

Jetpack Compose va Firebase Authentication/Cloud Firestore asosidagi mahalliy biznes, mahsulot va buyurtma Android ilovasi.

## Imkoniyatlar

- Mijoz/biznes egasi email-parol ro'yxatdan o'tishi; email tasdiqlash, reset email, parol ko'rsatish.
- Biznesni yuborish, admin tasdiqlash/rad etishi va rad sababini ko'rsatish.
- Mahsulot qo'shish/tahrirlash, zaxira, chegirma, feed va biznes turi filtri.
- Firestore transaction orqali checkout paytida stock tekshirish/kamaytirish.
- Buyurtma holatlari va owner statistikasi.

Rasm, push notification va to'lov oqimi hozircha kiritilmagan.

## Ishga tushirish

1. app/google-services.json Firebase Android package com.example.dasturxon bilan mos bo'lsin.
2. Firebase Console'da Email/Password Auth, Firestore, tasdiqlash/reset email templates-i yoq.
3. firestore.rules qoidalarini Rules bo'limiga publish qiling; test mode qoidalarini ishlatmang.
4. Android Studio'da Gradle Sync qiling, app:assembleDebug bajaring va ilovani emulator yoki telefonda ishga tushiring.
5. Ro'yxatdan o'tib emailni tasdiqlang va ilovaga kiring.

Firebase qadamlarini FIREBASE_SETUP.md, test jarayonini docs/QA_REPORT.md va docs/QA_MATRIX.md dan ko'ring.

## Tekshiruv

app:assembleDebug, app:testDebugUnitTest, app:assembleDebugAndroidTest, app:lint, app:assembleRelease.

Firestore Rules emulator testlari Node.js/npx va Firebase Emulator Suite talab qiladi. Bu muhitda Node.js yo'qligi uchun rules testlari ishga tushmadi. Android UI test APK yig'ildi, lekin emulyatorda ishga tushirilmadi.

## Release

applicationId hali com.example.dasturxon. Firebase'dagi Android app va google-services.json yangilanmasdan o'zgartirmang. Release signing, App Check (Play Integrity), Crashlytics va Play Console sozlamalari tashqi konfiguratsiya talab qiladi.