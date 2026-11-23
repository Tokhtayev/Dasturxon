# Firebase sozlash

Package: com.example.dasturxon. Android config: app/google-services.json.

## Firebase Console

1. Authentication → Sign-in method → Email/Password ni yoqing.
2. Authentication email templates va allowed domain sozlamalarini tekshiring.
3. Cloud Firestore production database yarating.
4. firestore.rules mazmunini Firestore → Rules ga publish qiling. Test mode ishlatmang.
5. Admin foydalanuvchini alohida yarating va users/{uid} hujjatidagi role=admin ni faqat ishonchli admin console orqali o'rnating.
6. Release oldidan App Check (Play Integrity), Crashlytics, signing va Play policy sahifalarini sozlang. Ular hozircha loyihaga ulanmagan.

## MVP

Email/parol auth, tasdiqlash/reset email, owner business review, product stock/discount, customer feed/checkout, transaction stock decrement, order status va owner analytics.

Rasm yuklash, push bildirishnomalar va to'lovlar MVPga kiritilmagan. Rules emulator testlari Node.js/npx va Firebase Emulator Suite talab qiladi; joriy muhitda Node.js yo'q.