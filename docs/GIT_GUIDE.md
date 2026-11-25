# Dasturxon — Git versiyalar boshqaruvi qo‘llanmasi (`GIT_GUIDE`)

Ushbu qo‘llanma loyihaning haqiqiy commit tarixiga tayangan holda oldingi barqaror versiyaga qaytish, o‘zgarishlarni bekor qilish va fayllarni tiklash usullarini tushuntiradi.

---

## 1. Loyihaning haqiqiy commit tarixini ko‘rish (`git log`)

Loyihadagi barcha commitlar semantik prefikslar (`feat:`, `fix:`, `security:`, `test:`, `docs:`, `chore:`) bilan `ai-night` tarmog‘ida saqlanadi:

```bash
git log --oneline -n 10
```

Misol tariqasida ushbu repozitoriydagi haqiqiy tarix:

```text
0d15a44 docs(report): add Uzbek engineering report chapters 01-07 and 10
406df9a docs(diagrams): add Mermaid sources, exported PNGs, and app screenshots
b3e74e8 docs(report): add Uzbek quality, security, and testing metrics reports
b836501 fix(ui): remove mobile header overflow on WelcomePage
4b83ed0 test(vitest): add 20 unit and boundary tests for order logic, validators, and analytics
633fff0 security: add CSP headers in firebase.json and prevent token or localStorage leaks
ff826ba security: enforce service-layer input validation and user-text escaping
008996b security: harden Firestore rules for role immutability, bounds, and ownership
4bb1795 chore(quality): add CODE_CONVENTIONS, ESLint, Prettier, and modular UI refactors
b3dc640 docs(status): record Phase 1 E2E emulator verification and final test pass
```

Biror commitning aniq o‘zgarishini ko‘rish uchun:

```bash
git show --stat 008996b
```

---

## 2. Oldingi versiyani xavfsiz tekshirish (`git checkout <hash>`)

Masalan, Phase 1 MVP (`92145db` — ro‘yxatdan o‘tishdagi xatolik tuzatilishidan oldingi holat) yoki `b836501` versiyasini ishga tushirib tekshirmoqchi bo‘lsangiz, eski tarixni buzmasdan vaqtincha `detached HEAD` holatiga o‘tish mumkin:

```bash
# 1. Ishchi papka toza ekanini tekshirish
git status

# 2. Ma'lum commit holatiga vaqtincha o'tish (masalan: c79735e)
git checkout c79735e

# 3. Ilovani tekshirib bo'lgach, asosiy ai-night tarmog'iga qaytish
git checkout ai-night
```

Eski holatdan yangi tajriba tarmog‘i yaratish kerak bo‘lsa:

```bash
git checkout -b hotfix/check-c79735e c79735e
```

---

## 3. Noto‘g‘ri commitni tarixni o‘chirmasdan bekor qilish (`git revert`)

Jamoaviy yoki GitHub ga push qilingan tarmoqda `git reset --hard` ishlatish tarixni buzadi. Buning o‘rniga **yangi teskari commit** yaratuvchi `git revert` ishlatiladi. Masalan, `b836501` (`WelcomePage` sarlavha tuzatishi) o‘zgarishini xavfsiz orqaga qaytarish:

```bash
# b836501 commitiga teskari bo'lgan yangi commit yaratadi
git revert b836501

# Tekshiruvdan so'ng agar kerak bo'lmasa commitni yakunlash; ziddiyat bo'lsa:
git revert --abort
```

---

## 4. Hali commit qilinmagan faylni asl holiga qaytarish (`git restore`)

Agar faylni tahrirlab qo‘ysangiz, lekin commit qilishdan avval oxirgi commit holatiga qaytarmoqchi bo‘lsangiz:

```bash
# Masalan, web/src/pages/WelcomePage.tsx dagi mahalliy tahrirni bekor qilish
git restore web/src/pages/WelcomePage.tsx

# Agar fayl git add bilan stage qilingan bo'lsa, avval unstage qilish:
git restore --staged web/src/pages/WelcomePage.tsx
```

---

## 5. Har bir o‘zgarishdan keyin majburiy tekshiruv

Har qanday tiklash yoki `revert` amalidan so‘ng ilova yarim buzilgan holatda qolmasligi uchun:

```bash
cd web && npm run build && npm run lint && npm run format:check && npm test
```
