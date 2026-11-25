# 01. Muammo tahlili va maqsadli auditoriya

**Loyiha nomi:** Dasturxon (Mahalla Bozori)  
**Fan:** Dasturiy injiniringga kirish  
**Hudud / bozor:** `[TO'LDIRING: Talaba tadqiqot o‘tkazayotgan mahalla yoki tuman nomi]`

---

## 1. Muammoning to‘rtta asosiy savol asosidagi tahlili

Mahalladagi kichik oziq-ovqat ishlab chiqaruvchilari (novvoyxona, qandolatxona, somsaxona, choyxona va uy oshxonalari) hamda mahalliy xaridorlar o‘rtasidagi kundalik savdo aloqalari ko‘pincha og‘zaki kelishuv, telefon qo‘ng‘iroqlari yoki tarqoq messenjer guruhlari orqali yuritiladi. Ushbu muammoni tizimli tahlil qilish uchun to‘rtta asosiy savolga javob shakllantirildi.

| № | Tahlil savoli | Tizimli javob va asosiy muammo mazmuni |
| :--- | :--- | :--- |
| **1** | **Kim qiynaladi?** | Birinchi navbatda **mahalla novvoyxonalari, qandolatxonalar va kichik ovqatlanish shoxobchalari egalari**; ikkinchidan **mahalladagi doimiy xaridorlar** (ishdan qaytayotgan oila a’zolari, talabalar, keksa yoshdagilar); uchinchidan **platforma moderatori / administratori** (soxta yoki sifatsiz e’lonlarni nazorat qilish zarurati tufayli). |
| **2** | **Nima muammo?** | Xaridorlar yaqin atrofdagi qaysi novvoyxonada issiq non, somsa yoki pishiriq ayni damda borligini (zaxirasini), aniq narxini va qachon tayyor bo‘lishini oldindan ko‘ra olmaydi. Tadbirkorlar esa telefon qo‘ng‘iroqlariga javob berishga chalg‘ib, buyurtma holatini boshqara olmaydi, tannarx (`costPrice`) va kundalik xarajatlar hisobini yuritmagani uchun haqiqiy sof foyda (`netProfit`) ni aniq bila olmaydi. |
| **3** | **Hozir qanday hal qilinadi?** | Hozirda muammo uchta noqulay usulda yechiladi: (a) xaridor shaxsan do‘konga borib navbat kutadi yoki mahsulot tugaganini ko‘rib qaytadi; (b) Telegram guruhlari yoki telefon qo‘ng‘iroqlari orqali buyurtma beriladi (lekin zaxira soni real vaqtda kamaymaydi); (v) biznes egasi kunlik tushum va xarajatlarni qog‘oz daftar yoki alohida jadvalda qo‘lda hisoblaydi. |
| **4** | **Nima yo‘qotiladi?** | **Vaqt:** xaridor behuda yo‘l va kutishga, sotuvchi esa takroriy telefon javoblariga vaqt yo‘qotadi. **Pul va mijoz:** zaxira hisobi noto‘g‘ri yuritilganda ikkita mijozga bir xil oxirgi mahsulot va’da qilinib, ishonch va buyurtma yo‘qotiladi; tannarx va xarajatlar hisobga olinmaganda biznes egasi zarar bilan ishlayotgan mahsulotni payqamaydi. |

---

## 2. Foydalanuvchi turlari (kamida 3 ta asosiy rol)

Dasturxon platformasi uchta aniq ajratilgan rol atrofida loyihalandi. Har bir rolning maqsadi, muammosi va tizimdan kutayotgan qiymati quyidagi jadvalda keltirilgan:

| Foydalanuvchi turi | Tizimdagi roli (`role`) | Kundalik vazifasi | Tizimga kirgandagi asosiy ehtiyoji |
| :--- | :--- | :--- | :--- |
| **1. Mahalla xaridori (Mijoz)** | `customer` | Yaqin atrofdagi yangi non, pishiriq va tayyor taomlarni topish hamda band qilish | Mahsulotlarni toifa va nom bo‘yicha tez qidirish, real qoldiqni ko‘rish, olib ketish (`pickup`) yoki yetkazib berish (`delivery`) ni tanlab buyurtma berish va *"Buyurtmalarim"* bo‘limida holatni jonli kuzatish. |
| **2. Mahalliy biznes egasi** | `owner` | Novvoyxona, qandolatxona, choyxona yoki oshxona faoliyatini boshqarish | Biznes profilini ro‘yxatdan o‘tkazish, mahsulotlar zaxirasi (`stock`), sotish narxi va faqat o‘ziga ko‘rinadigan tannarx (`costPrice`) ni kiritish, kiruvchi buyurtmalar holatini boshqarish hamda tushum, xarajat va sof foyda analitikasini ko‘rish. |
| **3. Platforma administratori** | `admin` | Mahalla bozori sifati, ishonchliligi va xavfsizligini ta’minlash | Yangi ro‘yxatdan o‘tgan biznes profillarini tekshirish, tasdiqlash (`approved`) yoki aniq sabab ko‘rsatib rad etish (`rejected`); tizimdagi rollar yaxlitligini saqlash. |

Qo‘shimcha ravishda, tizimda hali ro‘yxatdan o‘tmagan **mehmon tashrif buyuruvchi** (`guest`) ham mavjud bo‘lib, u tasdiqlangan bizneslarning ommaviy vitrinasini ko‘ra oladi, ammo buyurtma berish va shaxsiy kabinetdan foydalanish uchun tizimga kirishi talab etiladi.

---

## 3. Taklif etilayotgan yechim chegarasi (MVP doirasi)

Loyihaning birinchi bosqichi (Minimum Viable Product — MVP) faqat eng muhim qiymat yaratuvchi funksiyalarga yo‘naltirilgan:
- **Kiradigan qismlar:** Email + Parol autentifikatsiyasi, uchta rolga ajratilgan Marshrut himoyasi (`RoleGuard`), xaridor tasmasida qidiruv va toifa filtri, Cloud Firestore tranzaksiyasi (`runTransaction`) asosida zaxirani atomik kamaytiruvchi buyurtma berish, real vaqtdagi buyurtma tarixi, biznes egasi mahsulot CRUD hamda xarajat/foyda analitikasi, admin tasdiqlash paneli.
- **Kiritilmagan qismlar (MVP dan tashqari):** onlayn bank kartalari integratsiyasi (Click/Payme), push-bildirishnomalar, kuryer GPS xaritasi va rasmlarni ommaviy serverga yuklash (keyingi bosqich rejasiga qoldirilgan).

> **[TO'LDIRING: Talabaning shaxsiy kuzatuvi]**  
> - Kuzatuv o‘tkazilgan real do‘kon/novvoyxona turi (masalan, mahalla tandirxonasi): `[TO'LDIRING]`  
> - Xaridorda uchragan asosiy noqulaylik haqida qisqa izoh: `[TO'LDIRING]`
