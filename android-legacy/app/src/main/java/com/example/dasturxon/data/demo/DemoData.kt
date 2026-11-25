package com.example.dasturxon.data.demo

import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.data.model.Product
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import java.util.Date

object DemoData {

    val businesses: List<Business> = listOf(
        // 1. Asosiy novvoyxona (UI dizayndagi "Baraka novvoyxonasi" - Yunusobod 4-mavze)
        Business(
            id = "demo_bakery_baraka",
            ownerId = "demo_owner_baraka",
            name = "Baraka novvoyxonasi",
            type = "bakery",
            address = "Yunusobod tumani, 4-mavze, 12-uy",
            phone = "+998 90 123 45 67",
            status = "approved",
            typeNote = "⭐ 4.8 · Ochiq · 15-25 daqiqa. Tandirda pishirilgan issiq nonlar, go'shtli somsa va sariyog'li patirlar."
        ),
        // 2. Bodomzor metro yaqinidagi mashhur somsaxona
        Business(
            id = "demo_pastry_bodomzor",
            ownerId = "demo_owner_bodomzor",
            name = "Bodomzor Somsa & Tandir",
            type = "pastry",
            address = "Yunusobod tumani, Bodomzor metro bekati, Chinobod ko'chasi, 2-uy",
            phone = "+998 93 500 11 22",
            status = "approved",
            typeNote = "⭐ 4.9 · Ochiq · 20-30 daqiqa. Mashhur Bodomzor qatlama tandir somsasi, tovuqli va pishloqli pishiriqlar."
        ),
        // 3. Ahmad Donish ko'chasidagi Nonvoy markazi
        Business(
            id = "demo_bakery_nonvoy",
            ownerId = "demo_owner_nonvoy",
            name = "Yunusobod Nonvoy Markazi",
            type = "bakery",
            address = "Yunusobod tumani, 11-mavze, Ahmad Donish ko'chasi, 28-uy",
            phone = "+998 91 333 44 55",
            status = "approved",
            typeNote = "⭐ 4.7 · Ochiq · 20-30 daqiqa. Har 20 daqiqada yangi uzilgan issiq tandir nonlari va shirmoy nonlar."
        ),
        // 4. Shahriston chorrahasidagi mashhur oshxona
        Business(
            id = "demo_kitchen_osh",
            ownerId = "demo_owner_osh",
            name = "Yunusobod Osh Markazi",
            type = "kitchen",
            address = "Yunusobod tumani, Amir Temur shoh ko'chasi, 42-uy (Shahriston)",
            phone = "+998 97 777 88 99",
            status = "approved",
            typeNote = "⭐ 4.9 · Ochiq · 11:00 dan tansiq Yunusobod To'y oshi, Choyxona palovi va ot go'shti qazisi."
        ),
        // 5. Mega Planet SM ro'parasidagi Safia qandolatxonasi
        Business(
            id = "demo_confectionery_safia",
            ownerId = "demo_owner_safia",
            name = "Safia Qandolatxonasi (Yunusobod)",
            type = "confectionery",
            address = "Yunusobod tumani, 7-mavze, Mega Planet SM ro'parasida, 14-uy",
            phone = "+998 71 200 44 44",
            status = "approved",
            typeNote = "⭐ 4.8 · Ochiq · 10-20 daqiqa. Shirinliklar, sara bayram tortlari, fransuz kruassanlari va desertlar."
        ),
        // 6. 19-mavzedagi shashlik va taomlar markazi
        Business(
            id = "demo_kitchen_shashlik",
            ownerId = "demo_owner_shashlik",
            name = "Yunusobod Tandir & Shashlik House",
            type = "kitchen",
            address = "Yunusobod tumani, 19-mavze, Yangi shahar ko'chasi, 7-uy",
            phone = "+998 94 600 70 80",
            status = "approved",
            typeNote = "⭐ 4.7 · Ochiq · 25-35 daqiqa. Ko'mirda pishirilgan yumshoq g'ijduvon shashliklari va tandir jarkop."
        )
    )

    val products: List<Product> = listOf(
        // 1. UI Rasm 04 va 05 dagi "Tandir non" (Baraka novvoyxonasi - 5 000 so'm / dona · 350 g)
        Product(
            id = "demo_prod_tandir_non",
            businessId = "demo_bakery_baraka",
            businessName = "Baraka novvoyxonasi",
            businessType = "bakery",
            businessAddress = "Yunusobod tumani, 4-mavze, 12-uy",
            businessPhone = "+998 90 123 45 67",
            name = "Tandir non",
            description = "Tandirda pishirilgan, issiq va qarsildoq, tabiiy un mahsulotlaridan tayyorlangan klassik Toshkent noni (350 g).",
            price = 5000L,
            status = "hot_ready",
            stock = 16L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 2. UI Rasm 04 dagi "Go'shtli somsa" (Baraka novvoyxonasi - 8 000 so'm)
        Product(
            id = "demo_prod_goshtli_somsa",
            businessId = "demo_bakery_baraka",
            businessName = "Baraka novvoyxonasi",
            businessType = "pastry",
            businessAddress = "Yunusobod tumani, 4-mavze, 12-uy",
            businessPhone = "+998 90 123 45 67",
            name = "Go'shtli somsa",
            description = "Mayin mol go'shti, shirin piyoz va maydalangan zira bilan qatlama tandir somsa.",
            price = 8000L,
            status = "hot_ready",
            stock = 24L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 3. UI Rasm 05 dagi narx solishtirish uchun "Yunusobod Nonvoy Markazi"dagi Tandir non (5 500 so'm)
        Product(
            id = "demo_prod_tandir_non_nonvoy",
            businessId = "demo_bakery_nonvoy",
            businessName = "Yunusobod Nonvoy Markazi",
            businessType = "bakery",
            businessAddress = "Yunusobod tumani, 11-mavze, Ahmad Donish ko'chasi, 28-uy",
            businessPhone = "+998 91 333 44 55",
            name = "Tandir non",
            description = "Oliy sifatli bug'doy unidan yopilgan qarsildoq tandir noni.",
            price = 5500L,
            status = "available",
            stock = 25L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 4. Baraka novvoyxonasining boshqa mashhur mahsulotlari
        Product(
            id = "demo_prod_gijduvon_patir",
            businessId = "demo_bakery_baraka",
            businessName = "Baraka novvoyxonasi",
            businessType = "bakery",
            businessAddress = "Yunusobod tumani, 4-mavze, 12-uy",
            businessPhone = "+998 90 123 45 67",
            name = "G'ijduvon Patir Non",
            description = "Sut va tabiiy sariyog' bilan qorilgan, sedana va kunjut sepilgan yumshoq patir non.",
            price = 14000L,
            status = "hot_ready",
            stock = 8L,
            discountPercent = 10L,
            discountEndsAt = Timestamp(Date(System.currentTimeMillis() + 86400000L * 3))
        ),
        Product(
            id = "demo_prod_qovoqli_somsa",
            businessId = "demo_bakery_baraka",
            businessName = "Baraka novvoyxonasi",
            businessType = "pastry",
            businessAddress = "Yunusobod tumani, 4-mavze, 12-uy",
            businessPhone = "+998 90 123 45 67",
            name = "Qovoqli Tandir Somsa",
            description = "Shirin qovoq va nozik ziravorlar bilan tayyorlangan parhezbop tandir somsasi.",
            price = 6000L,
            status = "available",
            stock = 15L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 5. Bodomzor Somsa & Tandir mahsulotlari
        Product(
            id = "demo_prod_bodomzor_somsa",
            businessId = "demo_pastry_bodomzor",
            businessName = "Bodomzor Somsa & Tandir",
            businessType = "pastry",
            businessAddress = "Yunusobod tumani, Bodomzor metro bekati, Chinobod ko'chasi, 2-uy",
            businessPhone = "+998 93 500 11 22",
            name = "Bodomzor Go'shtli Somsa",
            description = "Mayin mol go'shti va qat-qat xamirdan tayyorlangan mashhur Bodomzor somsasi.",
            price = 10000L,
            status = "hot_ready",
            stock = 30L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        Product(
            id = "demo_prod_bodomzor_tovuqli",
            businessId = "demo_pastry_bodomzor",
            businessName = "Bodomzor Somsa & Tandir",
            businessType = "pastry",
            businessAddress = "Yunusobod tumani, Bodomzor metro bekati, Chinobod ko'chasi, 2-uy",
            businessPhone = "+998 93 500 11 22",
            name = "Tovuq va Pishloqli Somsa",
            description = "Mayin tovuq filesi, erigan Golland pishlog'i va ziravorlar bilan tansiq pishiriq.",
            price = 8500L,
            status = "available",
            stock = 18L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 6. Yunusobod Osh Markazi mahsulotlari
        Product(
            id = "demo_prod_toy_oshi",
            businessId = "demo_kitchen_osh",
            businessName = "Yunusobod Osh Markazi",
            businessType = "kitchen",
            businessAddress = "Yunusobod tumani, Amir Temur shoh ko'chasi, 42-uy (Shahriston)",
            businessPhone = "+998 97 777 88 99",
            name = "Yunusobod To'y Oshi",
            description = "Lazer guruch, barra buzoq go'shti, sariq sabzi, no'xat va mayiz bilan damlangan tansiq to'y oshi.",
            price = 42000L,
            status = "hot_ready",
            stock = 25L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        Product(
            id = "demo_prod_chust_palov",
            businessId = "demo_kitchen_osh",
            businessName = "Yunusobod Osh Markazi",
            businessType = "kitchen",
            businessAddress = "Yunusobod tumani, Amir Temur shoh ko'chasi, 42-uy (Shahriston)",
            businessPhone = "+998 97 777 88 99",
            name = "Chust Choyxona Palovi",
            description = "Qora devzira guruch, barra qo'y go'shti, sarimsoqpiyoz va achchiq murch bilan choyxona palovi.",
            price = 45000L,
            status = "hot_ready",
            stock = 20L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 7. Safia Qandolatxonasi mahsulotlari
        Product(
            id = "demo_prod_medovik",
            businessId = "demo_confectionery_safia",
            businessName = "Safia Qandolatxonasi (Yunusobod)",
            businessType = "confectionery",
            businessAddress = "Yunusobod tumani, 7-mavze, Mega Planet SM ro'parasida, 14-uy",
            businessPhone = "+998 71 200 44 44",
            name = "Klassik Medovik Tort",
            description = "Tabiiy tog' asali va mayin qaymoqli kremdan tayyorlangan 8 qavatli afsonaviy medovik.",
            price = 75000L,
            status = "available",
            stock = 8L,
            discountPercent = 15L,
            discountEndsAt = Timestamp(Date(System.currentTimeMillis() + 86400000L * 4))
        ),
        Product(
            id = "demo_prod_san_sebastian",
            businessId = "demo_confectionery_safia",
            businessName = "Safia Qandolatxonasi (Yunusobod)",
            businessType = "confectionery",
            businessAddress = "Yunusobod tumani, 7-mavze, Mega Planet SM ro'parasida, 14-uy",
            businessPhone = "+998 71 200 44 44",
            name = "San Sebastian Chizkeyk",
            description = "Ispancha kuydirilgan mayin pishloqli nozik desert, Belgiya shokoladi bilan.",
            price = 32000L,
            status = "available",
            stock = 10L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 8. Yunusobod Shashlik House
        Product(
            id = "demo_prod_kiyma_shashlik",
            businessId = "demo_kitchen_shashlik",
            businessName = "Yunusobod Tandir & Shashlik House",
            businessType = "kitchen",
            businessAddress = "Yunusobod tumani, 19-mavze, Yangi shahar ko'chasi, 7-uy",
            businessPhone = "+998 94 600 70 80",
            name = "G'ijduvon Qiyma Shashlik",
            description = "Sara mol go'shti va qo'y dumbasi qiymasidan tayyorlangan yumshoq va shirali shashlik.",
            price = 18000L,
            status = "hot_ready",
            stock = 30L,
            discountPercent = 0L,
            discountEndsAt = null
        )
    )

    /**
     * Seeds demo businesses, products, and customer orders matching the UI designs into Firestore for Yunusobod.
     */
    fun seedToFirestore(
        firestore: FirebaseFirestore,
        currentUserId: String? = null,
        onComplete: (success: Boolean, message: String) -> Unit
    ) {
        val batch = firestore.batch()

        // 1. Add businesses (Set currentUserId as owner of primary bakery if present)
        businesses.forEach { b ->
            val docRef = firestore.collection("businesses").document(b.id)
            val owner = if (!currentUserId.isNullOrBlank() && b.id == "demo_bakery_baraka") currentUserId else b.ownerId
            val data = mapOf(
                "ownerId" to owner,
                "name" to b.name,
                "type" to b.type,
                "address" to b.address,
                "phone" to b.phone,
                "status" to b.status,
                "typeNote" to (b.typeNote ?: ""),
                "createdAt" to FieldValue.serverTimestamp()
            )
            batch.set(docRef, data, SetOptions.merge())
        }

        // 2. Add products
        products.forEach { p ->
            val docRef = firestore.collection("products").document(p.id)
            val data = mutableMapOf<String, Any>(
                "businessId" to p.businessId,
                "businessName" to p.businessName,
                "businessType" to p.businessType,
                "businessAddress" to p.businessAddress,
                "businessPhone" to p.businessPhone,
                "name" to p.name,
                "description" to p.description,
                "price" to p.price,
                "status" to p.status,
                "stock" to (p.stock ?: 20L),
                "discountPercent" to p.discountPercent,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            if (p.discountEndsAt != null) {
                data["discountEndsAt"] = p.discountEndsAt
            }
            batch.set(docRef, data, SetOptions.merge())
        }

        // 3. Add demo orders (active and history) for current user
        if (!currentUserId.isNullOrBlank()) {
            val safeUid = currentUserId.replace("-", "_")

            // Active order: Buyurtma №2715 - Tayyorlanmoqda (36 000 so'm)
            val activeOrderRef = firestore.collection("orders").document("demo_order_2715_$safeUid")
            val activeOrderData = mapOf(
                "orderNumber" to "№2715",
                "customerId" to currentUserId,
                "customerName" to "Azizbek Karimov",
                "customerPhone" to "+998 90 123 45 67",
                "deliveryAddress" to "Uy - Yunusobod tumani, 4-mavze, 12-uy, 45-xonadon",
                "businessId" to "demo_bakery_baraka",
                "businessName" to "Baraka novvoyxonasi",
                "productName" to "Tandir non va somsa",
                "productId" to "demo_prod_tandir_non",
                "quantity" to 4L,
                "items" to listOf(
                    mapOf(
                        "productId" to "demo_prod_tandir_non",
                        "name" to "Tandir non",
                        "quantity" to 2L,
                        "priceAtOrder" to 5000L
                    ),
                    mapOf(
                        "productId" to "demo_prod_goshtli_somsa",
                        "name" to "Go'shtli somsa",
                        "quantity" to 2L,
                        "priceAtOrder" to 8000L
                    )
                ),
                "subtotal" to 26000L,
                "deliveryFee" to 10000L,
                "totalPrice" to 36000L,
                "paymentMethod" to "Naqd pul",
                "status" to "preparing", // Tayyorlanmoqda
                "deliveryEstimate" to "Bugun, 12:30 - 13:00 oralig'ida (20-30 daqiqa)",
                "pickupTime" to Timestamp(Date(System.currentTimeMillis() + 1800000L)),
                "createdAt" to Timestamp(Date(System.currentTimeMillis() - 900000L))
            )
            batch.set(activeOrderRef, activeOrderData, SetOptions.merge())

            // History order: So'nggi buyurtma №2698 - Tugallangan (25 000 so'm)
            val historyOrderRef = firestore.collection("orders").document("demo_order_2698_$safeUid")
            val historyOrderData = mapOf(
                "orderNumber" to "№2698",
                "customerId" to currentUserId,
                "customerName" to "Azizbek Karimov",
                "customerPhone" to "+998 90 123 45 67",
                "deliveryAddress" to "Uy - Yunusobod tumani, 4-mavze, 12-uy, 45-xonadon",
                "businessId" to "demo_bakery_baraka",
                "businessName" to "Baraka novvoyxonasi",
                "productName" to "Tandir non - 2 dona",
                "productId" to "demo_prod_tandir_non",
                "quantity" to 2L,
                "items" to listOf(
                    mapOf(
                        "productId" to "demo_prod_tandir_non",
                        "name" to "Tandir non",
                        "quantity" to 2L,
                        "priceAtOrder" to 5000L
                    )
                ),
                "subtotal" to 15000L,
                "deliveryFee" to 10000L,
                "totalPrice" to 25000L,
                "paymentMethod" to "Naqd pul",
                "status" to "done", // Tugallangan / Yetkazildi
                "pickupTime" to Timestamp(Date(System.currentTimeMillis() - 86400000L)),
                "createdAt" to Timestamp(Date(System.currentTimeMillis() - 86400000L - 3600000L))
            )
            batch.set(historyOrderRef, historyOrderData, SetOptions.merge())

            // 4. Seed sample view events for Baraka novvoyxonasi
            val eventRef1 = firestore.collection("events").document("event_demo_1_$safeUid")
            batch.set(eventRef1, mapOf(
                "businessId" to "demo_bakery_baraka",
                "productId" to "demo_prod_tandir_non",
                "userId" to currentUserId,
                "type" to "view_product",
                "createdAt" to FieldValue.serverTimestamp()
            ), SetOptions.merge())

            val eventRef2 = firestore.collection("events").document("event_demo_2_$safeUid")
            batch.set(eventRef2, mapOf(
                "businessId" to "demo_bakery_baraka",
                "productId" to "demo_prod_goshtli_somsa",
                "userId" to currentUserId,
                "type" to "view_business",
                "createdAt" to FieldValue.serverTimestamp()
            ), SetOptions.merge())
        }

        batch.commit()
            .addOnSuccessListener {
                onComplete(true, "✅ Yunusobod tumani ma'lumotlari muvaffaqiyatli yuklandi!")
            }
            .addOnFailureListener { e ->
                onComplete(false, "Xatolik: ${e.localizedMessage ?: "Yuklab bo'lmadi"}")
            }
    }
}
