# Talaba bajarishi kerak bo‘lgan ishlar ro‘yxati (`STUDENT_TODO`)

Ushbu hujjatda avtomatik tarzda to‘ldirib bo‘lmaydigan (inson tomonidan kiritilishi shart bo‘lgan) ma’lumotlar hamda qo‘lda bajariladigan tashqi konfiguratsiya qadamlari jamlangan. Hech bir insoniy ma’lumot (vaqt sarfi, suhbat, so‘rovnoma natijasi) uydirma tarzda yozilmagan.

---

## 1. Hisobotlardagi `[TO'LDIRING]` joylari

| Fayl | Bo‘lim / Maydon | Nima kiritish kerak |
| :--- | :--- | :--- |
| `docs/report/00-migratsiya.md` | Muallif (talaba) | Talabaning to‘liq F.I.Sh. va universitet guruh raqami |
| `docs/report/00-migratsiya.md` | 1-bo‘lim: shaxsiy izoh va vaqt jurnali | Avvalgi Android ilovada sarflangan real soatlar va telefonda uchragan aniq xatolar |

---

## 2. Firebase Console va GitHub Pages bo‘yicha qo‘lda bajariladigan qadamlar

1. **Firebase Web App yaratish (`dasturxon-27a6e`):**
   - Firebase Console → Project Settings → Your apps → **Add app (`</> Web`)** orqali web ilova yarating.
   - Olingan `apiKey`, `messagingSenderId`, `appId` qiymatlarini mahalliy `web/.env` fayliga (`web/.env.example` asosida) kiriting.
2. **Firebase Authentication sozlamalari:**
   - Firebase Console → Authentication → Sign-in method → **Email/Password** usuli yoqilganini tekshiring.
   - Authorized domains ro‘yxatiga `tokhtayev.github.io` domenini qo‘shing.
3. **Production Firestore Rules va Indexes deploy qilish:**
   - Loyiha ildizida `firebase deploy --only firestore:rules,firestore:indexes` buyrug‘i orqali `firestore.rules` va `firestore.indexes.json` fayllarini haqiqiy `dasturxon-27a6e` loyihasiga joylang.
4. **Administrator rolini tayinlash:**
   - Qoidaga ko‘ra ro‘yxatdan o‘tish orqali `admin` roli berilmaydi. Admin hisobi uchun avval oddiy hisob yarating, so‘ng Firebase Console → Firestore → `users/{uid}` hujjatidagi `role` maydonini qo‘lda `"admin"` ga o‘zgartiring.
5. **GitHub Actions Secrets (jonli saytni haqiqiy Firebase ga ulash uchun):**
   - GitHub repository → Settings → Secrets and variables → Actions bo‘limiga `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` o‘zgaruvchilarini kiriting va workflow ni yangilang.
