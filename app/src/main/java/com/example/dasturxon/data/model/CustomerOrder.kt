package com.example.dasturxon.data.model

import com.google.firebase.Timestamp

data class CustomerOrder(
    val id: String,
    val customerId: String,
    val businessId: String,
    val businessName: String,
    val productName: String,
    val quantity: Long,
    val totalPrice: Long,
    val status: String,
    val pickupTime: Timestamp?,
    val productId: String = "",
    val unitPrice: Long? = null,
    val createdAt: Timestamp? = null,
    val fulfillmentType: String = "pickup",
    val deliveryAddress: String = "",
    val customerPhone: String = "",
    val customerName: String = ""
) {
    companion object {
        fun fromDocument(id: String, data: Map<String, Any?>): CustomerOrder {
            val item = (data["items"] as? List<*>)
                ?.firstOrNull()
                ?.let { it as? Map<*, *> }

            return CustomerOrder(
                id = id,
                customerId = data["customerId"] as? String ?: "",
                businessId = data["businessId"] as? String ?: "",
                businessName = data["businessName"] as? String ?: "",
                productName = item?.get("name") as? String
                    ?: data["productName"] as? String
                    ?: data["name"] as? String
                    ?: "",
                quantity = item?.get("quantity") as? Long
                    ?: data["quantity"] as? Long
                    ?: 0L,
                totalPrice = data["totalPrice"] as? Long ?: 0L,
                status = data["status"] as? String ?: "new",
                pickupTime = data["pickupTime"] as? Timestamp,
                productId = item?.get("productId") as? String
                    ?: data["productId"] as? String
                    ?: "",
                unitPrice = item?.get("priceAtOrder") as? Long,
                createdAt = data["createdAt"] as? Timestamp,
                fulfillmentType = data["fulfillmentType"] as? String ?: "pickup",
                deliveryAddress = (data["deliveryAddress"] as? String).orEmpty(),
                customerPhone = (data["customerPhone"] as? String).orEmpty(),
                customerName = (data["customerName"] as? String).orEmpty()
            )
        }
    }
}
