# 09. Testlash va dasturiy metrikalar hisoboti

**Loyiha nomi:** Dasturxon (Mahalla Bozori)  
**Fan:** Dasturiy injiniringga kirish  
**Tarmoq:** `ai-night`  
**Muallif (talaba):** [TO'LDIRING: Talaba F.I.Sh. va guruh raqami]  
**Sana:** 2026-11-25

---

## 1. Avtomatlashtirilgan testlar yakuni (`Vitest` va `Firestore Emulator`)

Loyihaning biznes mantig‘i, chegara holatlari va xavfsizlik qoidalari quyidagi ikkita avtomatlashtirilgan test to‘plami orqali tekshirildi:

1. **Vitest birlik va chegaraviy testlari (`cd web && npm test`):**
   ```text
   > vitest run
   RUN  v5.1.1 C:/Users/asadb/AndroidStudioProjects/Dasturxon/web

   ✓ tests/orderLogic.test.ts (7 tests) 12ms
   ✓ tests/analytics.test.ts (6 tests) 13ms
   ✓ tests/validators.test.ts (7 tests) 11ms

   Test Files  3 passed (3)
        Tests  20 passed (20)
     Start at  10:35:35
     Duration  305ms
   ```
2. **Firestore xavfsizlik qoidalari testlari (`npm run test:rules`):**
   - `@firebase/rules-unit-testing` bilan Firebase Firestore Emulyatorida (`demo-dasturxon`) jami **39 ta test** ishga tushirildi: **39 ta PASS, 0 ta FAIL** (`duration_ms 6142.4228`).

---

## 2. Chegaraviy qiymatlar test jadvali (`Boundary Testing`)

Barcha natijalar `web/tests/orderLogic.test.ts`, `web/tests/validators.test.ts` va `web/tests/analytics.test.ts` dagi haqiqiy Vitest ijrosidan olingan:

| Tekshirilayotgan mantiq | Kirish qiymati (`Input`) | Kutilgan natija (`Expected`) | Amaldagi natija (`Actual`) | Test fayli |
| :--- | :--- | :--- | :--- | :--- |
| **Zaxira chegarasi (0 dona)** | `currentStock = 0, quantity = 1` | Xatolik: `Zaxira yetarli emas (0 ta qolgan)` | Xatolik otildi va xabar mos keldi (PASS) | `orderLogic.test.ts` |
| **Zaxira chegarasi (1 dona)** | `currentStock = 1, quantity = 1` | Qolgan zaxira `0`, holat `'sold_out'` | Qaytarildi `0`, holat `'sold_out'` (PASS) | `orderLogic.test.ts` |
| **Miqdor pastki chegarasi (0)** | `currentStock = 10, quantity = 0` | Xatolik: `Buyurtma miqdori kamida 1 bo'lishi kerak.` | Mos xatolik otildi (PASS) | `orderLogic.test.ts` |
| **Miqdor pastki chegarasi (-1)** | `currentStock = 10, quantity = -1` | Xatolik: minimal chegara buzilishi | Mos xatolik otildi (PASS) | `orderLogic.test.ts` |
| **Miqdor yuqori chegarasi (99)** | `currentStock = 99, quantity = 99` | Qolgan zaxira `0`; jami `4722 * 99 = 467478` | `0` va `467478` qaytarildi (PASS) | `orderLogic.test.ts` |
| **Miqdor chegaradan oshishi (100)** | `currentStock = 150, quantity = 100` | Xatolik: `...ko'pi bilan 99 dona...` | Mos xatolik otildi (PASS) | `orderLogic.test.ts` |
| **Buyurtma summasi (narx = 0)** | `unitPrice = 0, quantity = 1` | Xatolik: `Mahsulot narxi noto'g'ri.` | Mos xatolik otildi (PASS) | `orderLogic.test.ts` |
| **Buyurtma summasi (manfiy narx)** | `unitPrice = -100, quantity = 1` | Xatolik: `Mahsulot narxi noto'g'ri.` | Mos xatolik otildi (PASS) | `orderLogic.test.ts` |
| **Buyurtma summasi (min narx/miqdor)** | `unitPrice = 5000, quantity = 1` | `totalPrice = 5000` | `5000` qaytarildi (PASS) | `orderLogic.test.ts` |
| **Mahsulot formasi (narx = 1, zaxira = 0, chegirma = 90)** | `price: '1', stock: '0', discount: '90'` | `{ valid: true }` | `{ valid: true }` qaytarildi (PASS) | `validators.test.ts` |
| **Mahsulot formasi (narx = 0 va -5000)** | `price: '0'` va `price: '-5000'` | `{ valid: false }` | Ikkalasi ham `{ valid: false }` (PASS) | `validators.test.ts` |
| **Mahsulot formasi (manfiy zaxira, chegirma 91%)** | `stock: '-1'` va `discount: '91'` | `{ valid: false }` | Ikkalasi ham `{ valid: false }` (PASS) | `validators.test.ts` |
| **Parol uzunligi chegaralari (7 / 8 / 128 / 129)** | `Pass123`, `Pass1234`, `128` va `129` belgi | `7` va `129`: `false`; `8` va `128`: `true` | `false`, `true`, `true`, `false` (PASS) | `validators.test.ts` |
| **Bo‘sh satrlar (`""` va `"   "`)** | Bo‘sh `email`, `fullName`, `businessName`, `expense`, `rejectionReason` | Barchasi `{ valid: false }` | Barchasi `{ valid: false }` (PASS) | `validators.test.ts` |
| **Buyurtma holat o‘tishlari** | Customer `pending->cancelled` vs `accepted->cancelled`; Owner `pending->accepted->ready->completed` | Customer faqat `pending->cancelled` (`true`); `completed->cancelled` (`false`) | Barcha holat o‘tishlari kutilganidek (PASS) | `orderLogic.test.ts` |
| **Foyda hisobi (paid vs unpaid)** | 1 ta `completed+paid` (`50 000`), 1 ta `completed+unpaid` (`25 000`), `COGS=30 000`, `exp=8 000` | `Daromad = 50 000`, `Yalpi = 20 000`, `Sof = 12 000` | `50000`, `20000`, `12000` qaytarildi (PASS) | `analytics.test.ts` |

---

## 3. Tanlangan kichik funksiya uchun Halstead metrikalari

Tahlil uchun `web/src/services/orderLogic.ts` (8–19-satrlar) faylidagi **12 satrli**, aniq **3 ta shartli** `computeRemainingStock` funksiyasi tanlandi:

```ts
export function computeRemainingStock(currentStock: number, quantity: number): number {
  if (quantity < MIN_ORDER_QUANTITY) {
    throw new Error("Buyurtma miqdori kamida 1 bo'lishi kerak.");
  }
  if (quantity > MAX_ORDER_QUANTITY) {
    throw new Error("Bir buyurtmada ko'pi bilan 99 dona tanlash mumkin.");
  }
  if (quantity > currentStock) {
    throw new Error(`Zaxira yetarli emas (${currentStock} ta qolgan).`);
  }
  return currentStock - quantity;
}
```

### 3.1. Operatorlar va operandlar ro‘yxati (ijro etiluvchi tana: 9–18-satrlar)

Tokenizatsiya qoidasi: boshqaruv operatorlari (`if ()`, `{}` blok, `throw`, `new`, `Error()`, `return`), solishtirish/arifmetik operatorlar (`<`, `>`, `-`), shablon interpolyatsiyasi (`${...}`) hamda nuqta-vergul ajratuvchilari (`;`) operator sifatida; o‘zgaruvchilar, konstantalar va matn literallari operand sifatida sanaldi.

| Operator (`n1`) | Takrorlanish soni (`f1`) | Operand (`n2`) | Takrorlanish soni (`f2`) |
| :--- | :---: | :--- | :---: |
| `if (...)` | 3 | `quantity` | 4 |
| `<` | 1 | `MIN_ORDER_QUANTITY` | 1 |
| `>` | 2 | `MAX_ORDER_QUANTITY` | 1 |
| `throw` | 3 | `currentStock` | 3 |
| `new` | 3 | `"Buyurtma miqdori kamida 1 bo'lishi kerak."` | 1 |
| `Error(...)` | 3 | `"Bir buyurtmada ko'pi bilan 99 dona tanlash mumkin."` | 1 |
| `;` | 4 | `` `Zaxira yetarli emas (... ta qolgan).` `` | 1 |
| `{ ... }` | 3 | | |
| `${...}` | 1 | | |
| `return` | 1 | | |
| `-` | 1 | | |
| **Jami (`n1 = 11`)** | **`N1 = 25`** | **Jami (`n2 = 7`)** | **`N2 = 12`** |

### 3.2. Halstead hisob-kitoblari (`Node.js` orqali tekshirilgan)

- Noyob operatorlar soni: $n_1 = 11$
- Noyob operandlar soni: $n_2 = 7$
- Jami operatorlar soni: $N_1 = 25$
- Jami operandlar soni: $N_2 = 12$
- **Lug‘at hajmi ($n$):** $n = n_1 + n_2 = 11 + 7 = 18$
- **Dastur uzunligi ($N$):** $N = N_1 + N_2 = 25 + 12 = 37$
- **Dastur hajmi ($V$):**
  $$V = N \times \log_2(n) = 37 \times \log_2(18) = 37 \times 4.169925 = 154.29\text{ bit}$$
- **Murakkablik / Qiyinlik darajasi ($D$):**
  $$D = \frac{n_1}{2} \times \frac{N_2}{n_2} = \frac{11}{2} \times \frac{12}{7} = 5.5 \times 1.714286 = 9.43$$
- **Harakat / Mehnat hajmi ($E$):**
  $$E = D \times V = 9.428571 \times 154.287225 = 1454.71$$

*(Izoh: kichik hajm $V = 154.29$ va past qiyinlik $D = 9.43$ funksiyaning sodda, oson o‘qiladigan va kam xato ehtimolli ekanini ko‘rsatadi.)*

---

## 4. Siklomatik murakkablik (`V(G)`) va bazis yo‘llar qamrovi

`computeRemainingStock` funksiyasida murakkab mantiqiy bog‘lovchilar (`&&`, `||`, `?:`) ishlatilmagan, faqat **3 ta mustaqil `if` qaror nuqtasi** (`decisions`) mavjud:

1. $D_1$: `if (quantity < MIN_ORDER_QUANTITY)` (9-satr)
2. $D_2$: `if (quantity > MAX_ORDER_QUANTITY)` (12-satr)
3. $D_3$: `if (quantity > currentStock)` (15-satr)

$$V(G) = \text{decisions} + 1 = 3 + 1 = 4$$

- **Talab etiladigan minimal testlar soni:** Siklomatik murakkablik $V(G) = 4$ bo‘lgani uchun barcha tarmoqlarni to‘liq qoplash uchun kamida **4 ta mustaqil bazis yo‘l (`Basis Path`)** testdan o‘tkazilishi shart.

| Bazis yo‘l | Shartlar ketma-ketligi | Kutilgan natija | Qamrab oluvchi mavjud Vitest testi (`web/tests/orderLogic.test.ts`) |
| :--- | :--- | :--- | :--- |
| **Yo‘l 1** | $D_1 = \text{true}$ (`quantity < 1`) | Pastki miqdor chegarasi xatosi | `computeRemainingStock rejects quantity below 1 (boundary qty 0 / negative)` |
| **Yo‘l 2** | $D_1 = \text{false}$, $D_2 = \text{true}$ (`quantity > 99`) | Yuqori miqdor chegarasi xatosi | `computeRemainingStock rejects quantity above 99 (boundary qty 100)` |
| **Yo‘l 3** | $D_1 = \text{false}$, $D_2 = \text{false}$, $D_3 = \text{true}$ (`quantity > currentStock`) | Zaxira yetarli emasligi xatosi | `computeRemainingStock rejects insufficient stock (boundary stock 0 and stock < qty)` |
| **Yo‘l 4** | $D_1 = \text{false}$, $D_2 = \text{false}$, $D_3 = \text{false}$ | Qoldiq qaytariladi (`currentStock - quantity`) | `computeRemainingStock decrements stock accurately at valid boundaries (stock 1, qty 1 & 99)` |

Xulosa: `V(G) = 4` ta barcha mustaqil bazis yo‘l `web/tests/orderLogic.test.ts` dagi mavjud 4 ta aniq unit test bilan **100% qoplangan**.
