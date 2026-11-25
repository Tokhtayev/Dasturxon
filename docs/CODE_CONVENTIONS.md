# Dasturxon — Kod yozish qoidalari (`CODE_CONVENTIONS`)

Ushbu hujjat Dasturxon veb-loyihasi (`web/`) uchun qabul qilingan va **ESLint + Prettier** sozlamalari orqali avtomatik tekshiriladigan 6 ta majburiy muhandislik qoidasini belgilaydi.

---

## 1. Nomlash qoidalari (`Naming Conventions`)

- **Komponentlar, interfeyslar va tur (`type`) nomlari:** `PascalCase` (`CustomerFeedPage.tsx`, `OrderCheckoutModal`, `CustomerOrder`, `BusinessStatus`).
- **Funksiya, o‘zgaruvchi, hook va repozitoriylar:** `camelCase` (`formatSoM`, `applyStockDecrement`, `orderRepository`). Barcha React hooklar `use` prefiksi bilan boshlanadi (`useCustomerOrders.ts`, `useOwnerDashboard.ts`).
- **O‘zgarmas konstantalar (module-level constants):** `UPPER_SNAKE_CASE` (`MAX_ORDER_QUANTITY`, `MIN_PASSWORD_LENGTH`, `ACTIVE_PRODUCT_STATUSES`).
- **Avtomatik tekshiruv:** ESLint `@typescript-eslint/naming-convention` qoidasi orqali tekshiriladi.

---

## 2. Papka tuzilmasi va qatlamlar izolyatsiyasi (`Folder Structure`)

Loyiha qat’iy uch qatlamli arxitekturaga bo‘linadi:

```text
web/src/
  pages/         # Sahifa darajasidagi marshrut komponentlari (role bo'yicha ajratilgan)
  components/    # Qayta ishlatiladigan UI komponentlar va modallar
  hooks/         # Observer (onSnapshot) va UI holat hooklari
  context/       # Global AuthContext va sessiya provayderi
  services/      # Sof biznes mantiq, validatorlar, analitika va xavfsizlik yordamchilari
  repositories/  # Firebase Auth va Firestore bilan yagona aloqa qatlami
  config/        # Firebase SDK initialization (.env orqali)
  types/         # Umumiy TypeScript domen turlari
```

- **Qoidalar:** `pages/` va `components/` papkalaridan to‘g‘ridan-to‘g‘ri `firebase/*` SDK ni import qilish **taqiqlanadi** — barcha ma’lumot almashinuvi `hooks/` va `repositories/` orqali o‘tadi.
- **Avtomatik tekshiruv:** ESLint `no-restricted-imports` (`firebase/*`) va `oxlint` orqali tekshiriladi.

---

## 3. Sehrli satr va raqamlarni taqiqlash (`No Magic Strings & Numbers`)

- Status nomlari (`pending`, `accepted`, `ready`, `completed`, `rejected`, `cancelled`), biznes turlari va chegaraviy sonlar (`MIN_PASSWORD_LENGTH = 8`, `MAX_ORDER_QUANTITY = 99`, `MAX_DISCOUNT_PERCENT = 90`, `REGISTRATION_DEBOUNCE_MS = 1500`, `TASHKENT_UTC_OFFSET_MS`) markaziy `web/src/services/constants.ts` hamda `web/src/types/domain.ts` fayllarida e’lon qilinadi.
- `services/` va `repositories/` qatlamlarida izohsiz noma’lum raqamlar ishlatilmaydi.
- **Avtomatik tekshiruv:** ESLint `no-magic-numbers` qoidasi (`services/` va `repositories/` fayllarida konstantalarsiz biznes raqamlarini aniqlaydi).

---

## 4. Funksiya uzunligi va modullilik (`Function Length`)

- Servis, hook va repozitoriy funksiyalari ixcham va bitta vazifaga yo‘naltirilgan bo‘ladi (bo‘sh satr va izohlarsiz ko‘pi bilan **80 satr**); UI sahifa va komponentlar esa katta modallarni ajratish orqali ko‘pi bilan **120 satr** bilan cheklanadi (`max-depth: 3`).
- Murakkab sahifalar (`CustomerFeedPage`, `OwnerProductsPage`, `AdminDashboardPage`) tarkibidagi kartochka va modallar alohida komponentlarga (`web/src/components/`) ajratiladi.
- **Avtomatik tekshiruv:** ESLint `max-lines-per-function` va `max-depth` qoidalari bilan nazorat qilinadi.

---

## 5. Xatoliklarni boshqarish va xavfsiz UI (`Error Handling & Safe Failures`)

- Har bir asinxron foydalanuvchi amali (`handleSubmit`, `handleConfirmOrder`, `handleCancel`) `try / catch` bilan ushlanadi va foydalanuvchiga tushunarli o‘zbekcha xabar `getReadableErrorMessage(err, fallback)` yordamchisi orqali ko‘rsatiladi (`error`/`status` alert blokida).
- Jim o‘tib ketadigan bo‘sh `catch` bloklari (`no-empty`), brauzer konsoliga ma’lumot chiqarish (`no-console`), `localStorage` / `sessionStorage` ga token saqlash (`no-restricted-globals`) hamda `dangerouslySetInnerHTML` (`react/no-danger`) ishlatish taqiqlanadi.
- **Avtomatik tekshiruv:** ESLint (`no-empty`, `no-console`, `no-restricted-globals`, `react/no-danger`).

---

## 6. Izohlar va kod formatlash (`Comments & Formatting`)

- Kod izohlari *nimani* emas, *nima sababdan* bunday yozilganini (masalan, `firestore.rules` bilan `math.floor` pariteti, `Asia/Tashkent` hafta boshi, Auth rollback mantiqi) tushuntiradi.
- Barcha fayllar `web/.prettierrc` (`singleQuote: true`, `printWidth: 100`, `semi: true`, `trailingComma: "es5"`) bo‘yicha formatlanadi.
- **Tekshiruv buyruqlari:**
  - `cd web && npm run lint` — ESLint qoidalarini tekshiradi.
  - `cd web && npm run format:check` — Prettier formatiga moslikni tekshiradi.
