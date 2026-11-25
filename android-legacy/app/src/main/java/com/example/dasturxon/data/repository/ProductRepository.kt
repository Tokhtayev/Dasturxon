package com.example.dasturxon.data.repository

import com.example.dasturxon.data.model.Product
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class ProductRepository(private val firestore: FirebaseFirestore) {
    fun create(
        business: com.example.dasturxon.data.model.Business,
        name: String,
        description: String,
        price: Long,
        stock: Long?,
        discountPercent: Long,
        discountEndsAt: Timestamp?,
        costPrice: Long = 0L,
        published: Boolean = true,
        image: String = "",
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
            "published" to published,
            "imageUrl" to image,
            "status" to "available",
            "discountPercent" to discountPercent,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (stock != null) data["stock"] = stock
        if (discountEndsAt != null) data["discountEndsAt"] = discountEndsAt
        // Note: costPrice is NEVER stored in the public products collection document
        firestore.collection("products").add(data)
            .addOnSuccessListener { docRef ->
                if (costPrice > 0L) {
                    firestore.collection("products").document(docRef.id)
                        .collection("private").document("cost")
                        .set(
                            mapOf(
                                "costPrice" to costPrice,
                                "updatedAt" to FieldValue.serverTimestamp()
                            )
                        )
                        .addOnSuccessListener { onComplete(Result.success(Unit)) }
                        .addOnFailureListener { onComplete(Result.success(Unit)) }
                } else {
                    onComplete(Result.success(Unit))
                }
            }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun getCostPrice(
        productId: String,
        onComplete: (Result<Long>) -> Unit
    ) {
        firestore.collection("products").document(productId)
            .collection("private").document("cost")
            .get()
            .addOnSuccessListener { doc ->
                val cost = doc.getLong("costPrice") ?: 0L
                onComplete(Result.success(cost))
            }
            .addOnFailureListener {
                onComplete(Result.failure(it))
            }
    }

    /**
     * Loads private cost prices (`products/{id}/private/cost`) for the given product IDs.
     * Intended strictly for the owning business.
     */
    suspend fun loadCostPrices(productIds: List<String>): Map<String, Long> = coroutineScope {
        productIds.distinct()
            .filter { it.isNotBlank() }
            .map { id ->
                async {
                    try {
                        val doc = firestore.collection("products").document(id)
                            .collection("private").document("cost")
                            .get()
                            .await()
                        val cost = doc.getLong("costPrice") ?: 0L
                        id to cost
                    } catch (_: Exception) {
                        id to 0L
                    }
                }
            }
            .awaitAll()
            .toMap()
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    fun observeForBusiness(businessId: String): Flow<Result<List<Product>>> = callbackFlow {
        val registration = firestore.collection("products")
            .whereEqualTo("businessId", businessId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                } else {
                    val products = snapshot?.documents.orEmpty().map { doc ->
                        Product.fromDocument(doc.id, doc.data.orEmpty())
                    }
                    trySend(Result.success(products))
                }
            }
        awaitClose { registration.remove() }
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

    @OptIn(ExperimentalCoroutinesApi::class)
    fun observeFeed(): Flow<Result<List<Product>>> = callbackFlow {
        val registration = firestore.collection("products")
            .whereIn("status", listOf("available", "hot_ready"))
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                } else {
                    val products = snapshot?.documents.orEmpty().map { doc ->
                        Product.fromDocument(doc.id, doc.data.orEmpty())
                    }.filter { it.published }
                    trySend(Result.success(products))
                }
            }
        awaitClose { registration.remove() }
    }

    fun listenFeed(onUpdate: (Result<List<Product>>) -> Unit): ListenerRegistration =
        firestore.collection("products")
            .whereIn("status", listOf("available", "hot_ready"))
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onUpdate(Result.failure(error))
                } else {
                    val products = snapshot?.documents.orEmpty().map { doc ->
                        Product.fromDocument(doc.id, doc.data.orEmpty())
                    }.filter { it.published }
                    onUpdate(Result.success(products))
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
        costPrice: Long = product.costPrice,
        published: Boolean = product.published,
        image: String? = null,
        onComplete: (Result<Unit>) -> Unit
    ) {
        val updates = mutableMapOf<String, Any>(
            "name" to name,
            "description" to description,
            "price" to price,
            "published" to published,
            "discountPercent" to discountPercent,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (image != null) updates["imageUrl"] = image
        updates["stock"] = stock ?: FieldValue.delete()
        updates["discountEndsAt"] = discountEndsAt ?: FieldValue.delete()
        // Note: costPrice is strictly omitted from public product updates
        firestore.collection("products").document(product.id).update(updates)
            .addOnSuccessListener {
                if (costPrice > 0L || product.costPrice > 0L) {
                    firestore.collection("products").document(product.id)
                        .collection("private").document("cost")
                        .set(
                            mapOf(
                                "costPrice" to costPrice.coerceAtLeast(0L),
                                "updatedAt" to FieldValue.serverTimestamp()
                            )
                        )
                        .addOnSuccessListener { onComplete(Result.success(Unit)) }
                        .addOnFailureListener { onComplete(Result.success(Unit)) }
                } else {
                    onComplete(Result.success(Unit))
                }
            }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun delete(
        productId: String,
        onComplete: (Result<Unit>) -> Unit
    ) {
        firestore.collection("products").document(productId).delete()
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
