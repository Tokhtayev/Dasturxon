# Manual QA Matrix

| Rol/holat | Amal | Kutiladigan natija |
|---|---|---|
| Yangi foydalanuvchi | Noto'g'ri email/parol | Validatsiya, hisob yaratilmaydi |
| Yangi foydalanuvchi | Tasdiq paroli boshqa | Submit bloklanadi |
| Yangi foydalanuvchi | To'g'ri registration | Tasdiq xati keladi, tasdiqlamaguncha login bloklanadi |
| Mijoz | Forgot password | Reset havolasi emailga keladi |
| Mijoz | Bo'sh feed | Yuklanishdan keyin empty holat |
| Mijoz | Stock'dan katta qty | Submit bloklanadi va rules ham rad etadi |
| Ikki mijoz | Oxirgi stock uchun parallel buyurtma | Faqat bittasi muvaffaqiyatli |
| Owner | Pending biznes | Mahsulot boshqaruvi berilmaydi |
| Owner | Rejected biznes | Rad sababi ko'rinadi; tahrirlab qayta yuboriladi |
| Owner | Status o'zgarishi | Faqat ruxsat berilgan state transitionlar o'tadi |
| Admin | Registrationda admin roli tanlash | Mumkin emas |
| Admin | Sababsiz reject | Tugma bloklangan |
| User | Boshqa user role/profile o'zgartirish | Firestore rad etadi |
| Har rol | Offline/reconnect | Xato va qayta urinish holati |
| Telefon/tablet | Klaviatura/rotation/font scale | Muhim amallar ko'rinadi, kiritilgan state saqlanadi |
| Accessibility | TalkBack | Label, focus order, kontrast va target size tekshiriladi |