# Talaba bajarishi kerak bo‘lgan ishlar ro‘yxati (`STUDENT_TODO`)

Ushbu hujjatda avtomatik tarzda to‘ldirib bo‘lmaydigan (inson tomonidan kiritilishi shart bo‘lgan) ma’lumotlar hamda qo‘lda bajariladigan tashqi konfiguratsiya va Firebase Hosting deploy qadamlari jamlangan. Hech bir insoniy ma’lumot (sarflangan soat, suhbat, UX sinovi yoki so‘rovnoma natijasi) uydirma tarzda yozilmagan.

---

## 1. Hisobotlar va `.docx` fayldagi `[TO'LDIRING]` joylari

| Fayl | Bo‘lim / Maydon | Nima kiritish kerak |
| :--- | :--- | :--- |
| `docs/report/Dasturxon_Yakuniy_Hisobot.docx` | **Titul varag‘i** | Universitet, fakultet, kafedra nomi, talaba F.I.Sh./guruhi, o‘qituvchi F.I.Sh. va ommaviy Firebase Hosting URL |
| `docs/report/Dasturxon_Yakuniy_Hisobot.docx` | **Mundarija (`TOC`)** | Faylni Microsoft Word da ochib, Mundarija ustida sichqoncha o‘ng tugmasi → **Update Field** (`F9`) → *"Update entire table"* ni bosing |
| `docs/report/Dasturxon_Yakuniy_Hisobot.docx` | **Xulosa (1 bet)** | Talabaning shaxsiy xulosasi (1–2-bandlar), haqiqiy jami sarflangan soat va ommaviy sayt havolasi |
| `docs/report/00-migratsiya.md` | Muallif va 1-bo‘lim | Talaba F.I.Sh., Android versiyada sarflangan real soatlar va telefonda uchragan aniq xatolar |
| `docs/report/01-muammo.md` | Sarlavha va 3-bo‘lim | Tadqiqot o‘tkazilgan mahalla/tuman nomi va real mahalliy do‘kon kuzatuvi izohi |
| `docs/report/03-reja.md` | 1, 4, 5-bo‘limlar | Loyiha boshlangan sana, jamoa a’zolari/rollar, **Vaqt jurnali** (bo‘sh jadval) va **Reja vs Amalda** (`Amalda` ustuni ataylab bo‘sh) |
| `docs/report/04-talablar.md` | 1-bo‘lim | Mahalliy biznes egasi va xaridor bilan o‘tkazilgan real intervyu javoblari |
| `docs/report/06-ux.md` | 3 va 4-bo‘limlar | Kamida 3 ta haqiqiy odam bilan UX sinovi natijalari (soniya, xato soni, baho) va yakuniy UX xulosalari |
| `docs/report/08-sifat-xavfsizlik.md` | Sarlavha | Talabaning to‘liq F.I.Sh. va guruh raqami |
| `docs/report/09-test-metrika.md` | Sarlavha | Talabaning to‘liq F.I.Sh. va guruh raqami |
| `docs/report/10-xavflar.md` | 3-bo‘lim | 3 ta savoldan iborat real foydalanuvchi so‘rovnomasi yig‘ma natijalari |

*(Izoh: Agar `.md` fayllarni tahrirlagandan keyin Word faylini qayta yig‘moqchi bo‘lsangiz, `docs/report/` dagi tegishli `.md` ni yangilab `.docx` ni Word ning o‘zida ham tahrirlash mumkin.)*

---

## 2. Firebase Console va Production tayyorgarligi

1. **Firebase Web App yaratish (`dasturxon-27a6e`):**
   - Firebase Console → Project Settings → Your apps → **Add app (`</> Web`)** orqali web ilova yarating.
   - Olingan qiymatlarni [`web/.env.example`](../web/.env.example) namunasiga ko‘ra mahalliy `web/.env` fayliga kiriting (bunda **`VITE_USE_FIREBASE_EMULATOR=false`** bo‘lishi shart!):
     ```env
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=dasturxon-27a6e.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=dasturxon-27a6e
     VITE_FIREBASE_STORAGE_BUCKET=dasturxon-27a6e.firebasestorage.app
     VITE_FIREBASE_MESSAGING_SENDER_ID=437798898747
     VITE_FIREBASE_APP_ID=...
     VITE_USE_FIREBASE_EMULATOR=false
     ```
2. **Firebase Authentication sozlamalari:**
   - Firebase Console → Authentication → Sign-in method → **Email/Password** usuli yoqilganini tekshiring.
   - Authorized domains ro‘yxatiga Firebase Hosting (`dasturxon-27a6e.web.app`, `dasturxon-27a6e.firebaseapp.com`) va (agar ishlatilsa) `tokhtayev.github.io` domenlari kiritilganini tekshiring.
3. **Administrator rolini tayinlash:**
   - Xavfsizlik qoidasiga ko‘ra ro‘yxatdan o‘tish orqali `admin` roli berilmaydi. Admin hisobi uchun avval saytda oddiy hisob yarating, so‘ng Firebase Console → Firestore → `users/{uid}` hujjatidagi `role` maydonini qo‘lda `"admin"` ga o‘zgartiring.

---

## 3. Firebase Hosting ga chiqarish (Deploy) qadamlari

> Loyiha ichida `firebase login` va `firebase deploy` ataylab ishga tushirilmadi — ularni talaba o‘z kompyuteridan bajaradi va ommaviy havolani oladi. Root [`package.json`](../package.json), [`.firebaserc`](../.firebaserc) (`dasturxon-27a6e`) va [`firebase.json`](../firebase.json) (CSP sarlavhalari, `public: "web/dist"`) tayyorlab qo‘yilgan.

Loyihaning asosiy papkasidan (`Dasturxon/`) ketma-ket bajaring:

```bash
# 1. Firebase CLI ga shaxsiy Google hisobingiz bilan kiring
npx firebase login

# 2. web/.env da VITE_USE_FIREBASE_EMULATOR=false ekanini tekshirib,
#    Firestore qoidalari va indekslarini joylang
npm run deploy:rules

# 3. Ishlab chiqarish (production) yig‘masini qurib, Firebase Hosting ga yuklang
npm run deploy:hosting
```

Muvaffaqiyatli yakunlangandan so‘ng terminalda chiqadigan ommaviy havolani (masalan, `https://dasturxon-27a6e.web.app`) Titul varag‘i va Xulosa bo‘limiga ko‘chirib yozing.

### Qo‘shimcha (ixtiyoriy): GitHub Pages workflow uchun Secrets
Agar GitHub Pages ham ishlatilsa, GitHub repository → Settings → Secrets and variables → Actions bo‘limiga `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` sirlarini kiriting.
