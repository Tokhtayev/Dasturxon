package com.example.dasturxon.data.repository

import com.example.dasturxon.data.model.Product
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration

class ProductRepository(private val firestore: FirebaseFirestore) {
    fun create(
        business: com.example.dasturxon.data.model.Business,
        name: String,
        description: String,
        price: Long,
        stock: Long?,
        discountPercent: Long,
        discountEndsAt: Timestamp?,
        onComplete: (Result<Unit>) -> Unit
    ) {
        val data = mutableMapOf<String, Any>(
            "businessId" to business.id,
            "businessName" to business.name,
            "businessType" to business.type,
            "businessAddress" to business.address,
            "businessPhone" to business.phone,
            "name" to name,
            "description" to description,
            "price" to price,
            "status" to "available",
            "discountPercent" to discountPercent,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (stock != null) data["stock"] = stock
        if (discountEndsAt != null) data["discountEndsAt"] = discountEndsAt
        firestore.collection("products").add(data)
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun listenForBusiness(
        businessId: String,
        onUpdate: (Result<List<Product>>) -> Unit
    ): ListenerRegistration = firestore.collection("products")
        .whereEqualTo("businessId", businessId)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                onUpdate(Result.failure(error))
            } else {
                onUpdate(
                    Result.success(
                        snapshot?.documents.orEmpty().map { doc ->
                            Product.fromDocument(doc.id, doc.data.orEmpty())
                        }
                    )
                )
            }
        }

    fun listenFeed(onUpdate: (Result<List<Product>>) -> Unit): ListenerRegistration =
        firestore.collection("products")
            .whereIn("status", listOf("available", "hot_ready"))
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onUpdate(Result.failure(error))
                } else {
                    onUpdate(
                        Result.success(
                            snapshot?.documents.orEmpty().map { doc ->
                                Product.fromDocument(doc.id, doc.data.orEmpty())
                            }
                        )
                    )
                }
            }

    fun updateProduct(
        product: Product,
        name: String,
        description: String,
        price: Long,
        stock: Long?,
        discountPercent: Long,
        discountEndsAt: Timestamp?,
        onComplete: (Result<Unit>) -> Unit
    ) {
        val updates = mutableMapOf<String, Any>(
            "name" to name,
            "description" to description,
            "price" to price,
            "discountPercent" to discountPercent,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        updates["stock"] = stock ?: FieldValue.delete()
        updates["discountEndsAt"] = discountEndsAt ?: FieldValue.delete()
        firestore.collection("products").document(product.id).update(updates)
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun setStatus(
        productId: String,
        status: String,
        onComplete: (Result<Unit>) -> Unit
    ) {
        firestore.collection("products").document(productId)
            .update(
                mapOf(
                    "status" to status,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }
}
