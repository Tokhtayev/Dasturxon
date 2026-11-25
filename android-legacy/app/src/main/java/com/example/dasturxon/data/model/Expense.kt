package com.example.dasturxon.data.model

import com.google.firebase.Timestamp

data class Expense(
    val id: String,
    val businessId: String,
    val title: String,
    val amount: Long,
    val category: String,
    val createdAt: Timestamp
) {
    companion object {
        fun fromDocument(id: String, data: Map<String, Any?>): Expense = Expense(
            id = id,
            businessId = (data["businessId"] as? String).orEmpty(),
            title = (data["title"] as? String).orEmpty(),
            amount = data["amount"] as? Long ?: 0L,
            category = (data["category"] as? String) ?: "Boshqa",
            createdAt = (data["createdAt"] as? Timestamp) ?: Timestamp.now()
        )
    }
}
