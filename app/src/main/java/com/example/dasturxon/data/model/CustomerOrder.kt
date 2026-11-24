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
    val customerName: String = "",
    val paymentStatus: String = "unpaid",
    val paidAt: Timestamp? = null
) {
    val computedTotal: Long
        get() = if (totalPrice > 0L) totalPrice else (unitPrice ?: 0L) * quantity

    companion object {
        fun fromDocument(id: String, data: Map<String, Any?>): CustomerOrder {
            val item = (data["items"] as? List<*>)
                ?.firstOrNull()
                ?.let { it as? Map<*, *> }

            val rawStatus = data["status"] as? String ?: "pending"
            val status = when (rawStatus) {
                "new" -> "pending"
                "done" -> "completed"
                else -> rawStatus
            }

            val price = item?.get("priceAtOrder") as? Long
                ?: item?.get("unitPrice") as? Long
                ?: data["unitPrice"] as? Long
            val qty = item?.get("quantity") as? Long
                ?: item?.get("qty") as? Long
                ?: data["quantity"] as? Long
                ?: 0L
            val total = data["totalPrice"] as? Long ?: ((price ?: 0L) * qty)

            return CustomerOrder(
                id = id,
                customerId = data["customerId"] as? String ?: "",
                businessId = data["businessId"] as? String ?: "",
                businessName = data["businessName"] as? String ?: "",
                productName = item?.get("name") as? String
                    ?: data["productName"] as? String
                    ?: data["name"] as? String
                    ?: "",
                quantity = qty,
                totalPrice = total,
                status = status,
                pickupTime = data["pickupTime"] as? Timestamp,
                productId = item?.get("productId") as? String
                    ?: data["productId"] as? String
                    ?: "",
                unitPrice = price,
                createdAt = data["createdAt"] as? Timestamp,
                fulfillmentType = data["fulfillmentType"] as? String ?: "pickup",
                deliveryAddress = (data["deliveryAddress"] as? String).orEmpty(),
                customerPhone = (data["customerPhone"] as? String).orEmpty(),
                customerName = (data["customerName"] as? String).orEmpty(),
                paymentStatus = data["paymentStatus"] as? String ?: "unpaid",
                paidAt = data["paidAt"] as? Timestamp
            )
        }
    }
}
