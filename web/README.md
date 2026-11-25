# Dasturxon — Mahalla Bozori Web Sayti

**Dasturxon** loyihasining rasmiy veb-sayti va uch rolli (Xaridor · Biznes egasi · Administrator) jonli interaktiv veb-platformasi.

## Imkoniyatlar

- **Bosh sahifa va Brend tizimi**: `app/src/main` dizayn tokenlari (`#B7500A`, `#0F7C84`, `#4C7A2B`, `#FFF8F1`, Dark Mode), `ic_logo_mark.xml` vektor emblemasi va haqiqiy o‘zbek taomlari fotogalereyasi.
- **Jonli 3 rolli veb-ilova (`#live-app`)**:
  - **Xaridor**: Mahsulot qidirish, 7 biznes toifasi bo‘yicha filtrlash, aksiyalar karuseli, do‘kon xaritasi (Yunusobod), chekout (olib ketish / yetkazib berish), zaxirani real vaqtda kamaytirish va buyurtmalar tarixi.
  - **Biznes egasi**: KPI boshqaruv paneli, maxfiy tannarx (`costPrice`), mahsulot qo‘shish va holat boshqaruvi, buyurtmalarni qabul qilish / to‘lov tasdiqlash, `AnalyticsCalculator` moliya va foyda grafiklari hamda xarajatlar jurnali.
  - **Administrator**: Biznes arizalarini ko‘rib chiqish (`Tasdiqlash` yoki sabab bilan `Rad etish`) va tasdiqlangan do‘konlarni xaridor lentasiga chiqarish.
- **Narx taqqoslash va Yunusobod katalogi**: Tandir non, somsa va palov narxlarini mahalla bo‘ylab solishtirish.
- **Firestore Rules va Arxitektura**: 7 ta Firestore kolleksiyasining least-privilege qoidalari va `docs/STATUS.md` natijalari.

## Mahalliy ishga tushirish

```bash
cd web
npm install
npm run dev
```

## Build va testlar

```bash
cd web
npm run build
npm run lint
node --test tests/analytics.test.ts
```
