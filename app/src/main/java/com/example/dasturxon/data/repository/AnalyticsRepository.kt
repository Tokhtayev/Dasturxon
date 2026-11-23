package com.example.dasturxon.data.repository

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration

class AnalyticsRepository(private val firestore: FirebaseFirestore) {
    fun recordView(
        businessId: String,
        productId: String,
        userId: String,
        type: String
    ) {
        firestore.collection("events").add(
            mapOf(
                "businessId" to businessId,
                "productId" to productId,
                "userId" to userId,
                "type" to type,
                "createdAt" to FieldValue.serverTimestamp()
            )
        )
    }

    fun listenViewCount(
        businessId: String,
        onCount: (Result<Int>) -> Unit
    ): ListenerRegistration = firestore.collection("events")
        .whereEqualTo("businessId", businessId)
        .addSnapshotListener { snapshot, error ->
            if (error != null) onCount(Result.failure(error))
            else {
                val views = snapshot?.documents.orEmpty().count {
                    it.getString("type") == "view_product" ||
                        it.getString("type") == "view_business"
                }
                onCount(Result.success(views))
            }
        }
}
