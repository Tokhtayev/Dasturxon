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
        // 1. Asosiy novvoyxona (UI dizayndagi "Baraka novvoyxonasi")
        Business(
            id = "demo_bakery_baraka",
            ownerId = "demo_owner_baraka",
            name = "Baraka novvoyxonasi",
            type = "bakery",
            address = "Chilonzor, 12-mavze, 4-uy",
            phone = "+998 90 123 45 67",
            status = "approved",
            typeNote = "⭐ 4.8 · Ochiq · 20-30 daqiqa. Tandirda pishirilgan issiq nonlar, somsa va patirlar."
        ),
        // 2. Narx solishtirish uchun "Nonvoy" do'koni
        Business(
            id = "demo_bakery_nonvoy",
            ownerId = "demo_owner_nonvoy",
            name = "Nonvoy",
            type = "bakery",
            address = "Chilonzor, 9-mavze, 21-uy",
            phone = "+998 91 333 44 55",
            status = "approved",
            typeNote = "⭐ 4.6 · Ochiq · 25-35 daqiqa. An'anaviy tandir nonlari va issiq kulchalar."
        ),
        Business(
            id = "demo_pastry_bodomzor",
            ownerId = "demo_owner_bodomzor",
            name = "Bodomzor Somsa & Tandir",
            type = "pastry",
            address = "Bodomzor metro bekati, 1-chiqish",
            phone = "+998 93 500 11 22",
            status = "approved",
            typeNote = "Tandir go'shtli, tovuqli va qovoqli mazali qatlama somsalar."
        ),
        Business(
            id = "demo_confectionery_safia",
            ownerId = "demo_owner_safia",
            name = "Safia Qandolatxonasi",
            type = "confectionery",
            address = "Chilonzor 7-mavze, 14-uy",
            phone = "+998 71 200 44 44",
            status = "approved",
            typeNote = "Shirinliklar, bayram tortlari va yangi pishiriqlar do'koni."
        ),
        Business(
            id = "demo_kitchen_osh",
            ownerId = "demo_owner_osh",
            name = "Chilonzor Osh Markazi",
            type = "kitchen",
            address = "Chilonzor 11-mavze, 2-uy",
            phone = "+998 97 777 88 99",
            status = "approved",
            typeNote = "Har kuni 11:30 dan boshlab issiq to'y oshi va choyxona palovi tayyor."
        )
    )

    val products: List<Product> = listOf(
        // 1. UI Rasm 04 va 05 dagi "Tandir non" (Baraka novvoyxonasi - 5 000 so'm / dona · 350 g)
        Product(
            id = "demo_prod_tandir_non",
            businessId = "demo_bakery_baraka",
            businessName = "Baraka novvoyxonasi",
            businessType = "bakery",
            businessAddress = "Chilonzor, 12-mavze",
            businessPhone = "+998 90 123 45 67",
            name = "Tandir non",
            description = "Tandirda pishirilgan, issiq va qarsildoq, tabiiy un mahsulotlaridan tayyorlangan (350 g).",
            price = 5000L,
            status = "hot_ready",
            stock = 12L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 2. UI Rasm 04 dagi "Go'shtli somsa" (Baraka novvoyxonasi - 8 000 so'm)
        Product(
            id = "demo_prod_goshtli_somsa",
            businessId = "demo_bakery_baraka",
            businessName = "Baraka novvoyxonasi",
            businessType = "pastry",
            businessAddress = "Chilonzor, 12-mavze",
            businessPhone = "+998 90 123 45 67",
            name = "Go'shtli somsa",
            description = "Mayin mol go'shti, shirin piyoz va maydalangan zira bilan qatlama tandir somsa.",
            price = 8000L,
            status = "hot_ready",
            stock = 20L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 3. UI Rasm 05 dagi narx solishtirish uchun "Nonvoy" do'konidagi Tandir non (5 500 so'm)
        Product(
            id = "demo_prod_tandir_non_nonvoy",
            businessId = "demo_bakery_nonvoy",
            businessName = "Nonvoy",
            businessType = "bakery",
            businessAddress = "Chilonzor, 9-mavze, 21-uy",
            businessPhone = "+998 91 333 44 55",
            name = "Tandir non",
            description = "Oliy sifatli undan yopilgan klassik tandir noni.",
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
            businessAddress = "Chilonzor, 12-mavze",
            businessPhone = "+998 90 123 45 67",
            name = "G'ijduvon Patir Non",
            description = "Sut va sariyog' bilan qorilgan, sedana va kunjut sepilgan yumshoq patir non.",
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
            businessAddress = "Chilonzor, 12-mavze",
            businessPhone = "+998 90 123 45 67",
            name = "Qovoqli Tandir Somsa",
            description = "Shirin qovoq va nozik ziravorlar bilan tayyorlangan parhezbop tandir somsasi.",
            price = 6000L,
            status = "available",
            stock = 15L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        // 5. Boshqa toifadagi taomlar
        Product(
            id = "demo_prod_toy_oshi",
            businessId = "demo_kitchen_osh",
            businessName = "Chilonzor Osh Markazi",
            businessType = "kitchen",
            businessAddress = "Chilonzor 11-mavze, 2-uy",
            businessPhone = "+998 97 777 88 99",
            name = "Chilonzor To'y Oshi",
            description = "Devzira guruch, barra mol go'shti, no'xat va mayiz bilan damlangan tansiq to'y oshi.",
            price = 38000L,
            status = "hot_ready",
            stock = 18L,
            discountPercent = 0L,
            discountEndsAt = null
        ),
        Product(
            id = "demo_prod_medovik",
            businessId = "demo_confectionery_safia",
            businessName = "Safia Qandolatxonasi",
            businessType = "confectionery",
            businessAddress = "Chilonzor 7-mavze, 14-uy",
            businessPhone = "+998 71 200 44 44",
            name = "Klassik Medovik Tort",
            description = "Tabiiy tog' asali va mayin qaymoqli kremdan tayyorlangan 8 qavatli afsonaviy medovik.",
            price = 65000L,
            status = "available",
            stock = 6L,
            discountPercent = 15L,
            discountEndsAt = Timestamp(Date(System.currentTimeMillis() + 86400000L * 4))
        )
    )

    /**
     * Seeds demo businesses, products, and customer orders matching the UI designs into Firestore.
     */
    fun seedToFirestore(
        firestore: FirebaseFirestore,
        currentUserId: String? = null,
        onComplete: (success: Boolean, message: String) -> Unit
    ) {
        val batch = firestore.batch()

        // 1. Add businesses
        businesses.forEach { b ->
            val docRef = firestore.collection("businesses").document(b.id)
            val data = mapOf(
                "ownerId" to b.ownerId,
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

        // 3. Add demo orders (active and history) ONLY for guest user
        if (!currentUserId.isNullOrBlank() && currentUserId.startsWith("guest")) {
            val safeUid = currentUserId.replace("-", "_")

            // Active order: Buyurtma №2715 - Tayyorlanmoqda (36 000 so'm)
            val activeOrderRef = firestore.collection("orders").document("demo_order_2715_$safeUid")
            val activeOrderData = mapOf(
                "orderNumber" to "№2715",
                "customerId" to currentUserId,
                "customerName" to "Azizbek Karimov",
                "customerPhone" to "+998 90 123 45 67",
                "deliveryAddress" to "Uy - Chilonzor, 12-mavze",
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
                "deliveryAddress" to "Uy - Chilonzor, 12-mavze",
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
        }

        batch.commit()
            .addOnSuccessListener {
                onComplete(true, "✅ Rasmdagi demo ma'lumotlar muvaffaqiyatli yuklandi!")
            }
            .addOnFailureListener { e ->
                onComplete(false, "Xatolik: ${e.localizedMessage ?: "Yuklab bo'lmadi"}")
            }
    }
}
