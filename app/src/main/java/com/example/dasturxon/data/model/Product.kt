package com.example.dasturxon.data.model

import com.google.firebase.Timestamp

data class Product(
    val id: String,
    val businessId: String,
    val businessName: String,
    val businessType: String,
    val businessAddress: String,
    val businessPhone: String,
    val name: String,
    val description: String,
    val price: Long,
    val status: String,
    val stock: Long?,
    val discountPercent: Long,
    val discountEndsAt: Timestamp?,
    val costPrice: Long = 0L,
    val image: String = ""
) {
    val sellingPrice: Long get() = price
    val imageUrl: String get() = image

    companion object {
        fun fromDocument(id: String, data: Map<String, Any?>): Product = Product(
            id = id,
            businessId = (data["businessId"] as? String).orEmpty(),
            businessName = (data["businessName"] as? String).orEmpty(),
            businessType = (data["businessType"] as? String).orEmpty(),
            businessAddress = (data["businessAddress"] as? String).orEmpty(),
            businessPhone = (data["businessPhone"] as? String).orEmpty(),
            name = (data["name"] as? String).orEmpty(),
            description = (data["description"] as? String).orEmpty(),
            price = data["price"] as? Long ?: (data["sellingPrice"] as? Long) ?: 0L,
            status = data["status"] as? String ?: "available",
            stock = data["stock"] as? Long,
            discountPercent = data["discountPercent"] as? Long ?: 0L,
            discountEndsAt = data["discountEndsAt"] as? Timestamp,
            costPrice = data["costPrice"] as? Long ?: 0L,
            image = (data["image"] as? String) ?: (data["imageUrl"] as? String).orEmpty()
        )
    }
}
