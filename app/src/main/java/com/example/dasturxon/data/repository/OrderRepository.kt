package com.example.dasturxon.data.repository

import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.data.model.Product
import com.example.dasturxon.domain.OrderStatus
import com.example.dasturxon.domain.OrderStatusGroup
import com.example.dasturxon.domain.PAGE_SIZE
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import java.util.Date
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine

private const val ACTIVE_ORDER_LIMIT = 100

data class HistoryOrderPage(
    val orders: List<CustomerOrder>,
    val lastDocument: DocumentSnapshot?
)

open class OrderRepository {
    private val firestore: FirebaseFirestore?

    constructor(firestore: FirebaseFirestore) {
        this.firestore = firestore
    }

    constructor() {
        this.firestore = null
    }

    protected fun db(): FirebaseFirestore =
        firestore ?: throw IllegalStateException("Firestore not configured")

    open fun create(
        customerId: String,
        business: Business,
        product: Product,
        quantity: Long,
        pickupTime: Timestamp,
        onComplete: (Result<Unit>) -> Unit
    ) {
        val productRef = db().collection("products").document(product.id)
        val businessRef = db().collection("businesses").document(business.id)
        val orderRef = db().collection("orders").document()

        db().runTransaction { transaction ->
            val productSnapshot = transaction.get(productRef)
            val businessSnapshot = transaction.get(businessRef)
            val status = productSnapshot.getString("status")
            val currentStock = productSnapshot.getLong("stock")
            val price = productSnapshot.getLong("price")
                ?: throw IllegalStateException("Mahsulot narxi topilmadi.")
            val storedDiscount = productSnapshot.getLong("discountPercent") ?: 0L
            val discountEndsAt = productSnapshot.getTimestamp("discountEndsAt")
            val discount = if (
                discountEndsAt == null || discountEndsAt.toDate().after(Date())
            ) storedDiscount else 0L

            if (businessSnapshot.getString("status") != "approved") {
                throw IllegalStateException("Bu biznes hozir buyurtma olmayapti.")
            }
            if (status !in listOf("available", "hot_ready")) {
                throw IllegalStateException("Mahsulot hozir mavjud emas.")
            }
            if (quantity <= 0L || (currentStock != null && quantity > currentStock)) {
                throw IllegalStateException("Zaxira yetarli emas.")
            }

            val priceAtOrder = price - (price * discount / 100L)
            val totalPrice = Math.multiplyExact(priceAtOrder, quantity)
            val item = mapOf(
                "productId" to product.id,
                "name" to (productSnapshot.getString("name") ?: product.name),
                "quantity" to quantity,
                "priceAtOrder" to priceAtOrder
            )
            val order = mapOf(
                "customerId" to customerId,
                "businessId" to business.id,
                "businessName" to business.name,
                "productId" to product.id,
                "quantity" to quantity,
                "items" to listOf(item),
                "totalPrice" to totalPrice,
                "status" to "new",
                "pickupTime" to pickupTime,
                "createdAt" to FieldValue.serverTimestamp()
            )
            transaction.set(orderRef, order)
            if (currentStock != null) {
                val remaining = currentStock - quantity
                transaction.update(
                    productRef,
                    mapOf(
                        "stock" to remaining,
                        "status" to if (remaining == 0L) "sold_out" else "available",
                        "lastCheckoutOrderId" to orderRef.id,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                )
            }
            null
        }.addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun listenForCustomer(
        customerId: String,
        onUpdate: (Result<List<CustomerOrder>>) -> Unit
    ): ListenerRegistration = db().collection("orders")
        .whereEqualTo("customerId", customerId)
        .addSnapshotListener { snapshot, error ->
            if (error != null) onUpdate(Result.failure(error))
            else onUpdate(
                Result.success(snapshot?.documents.orEmpty().map {
                    CustomerOrder.fromDocument(it.id, it.data.orEmpty())
                }.sortedByDescending { it.pickupTime?.toDate() ?: Date(0) })
            )
        }

    @OptIn(ExperimentalCoroutinesApi::class)
    open fun observeActiveForCustomer(customerId: String): Flow<Result<List<CustomerOrder>>> = callbackFlow {
        val registration = db().collection("orders")
            .whereEqualTo("customerId", customerId)
            .whereIn("status", OrderStatus.firestoreValues(OrderStatusGroup.ACTIVE))
            .limit(ACTIVE_ORDER_LIMIT.toLong())
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                } else {
                    val orders = snapshot?.documents.orEmpty()
                        .map { CustomerOrder.fromDocument(it.id, it.data.orEmpty()) }
                        .sortedBy { it.pickupTime?.toDate()?.time ?: Long.MAX_VALUE }
                    trySend(Result.success(orders))
                }
            }
        awaitClose { registration.remove() }
    }

    open suspend fun loadHistoryPage(
        customerId: String,
        cursor: DocumentSnapshot?
    ): HistoryOrderPage = suspendCancellableCoroutine { continuation ->
        var query: Query = db().collection("orders")
            .whereEqualTo("customerId", customerId)
            .whereIn("status", OrderStatus.firestoreValues(OrderStatusGroup.HISTORY))
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(PAGE_SIZE.toLong())
        if (cursor != null) query = query.startAfter(cursor)

        query.get()
            .addOnSuccessListener { snapshot ->
                if (continuation.isActive) {
                    val documents = snapshot.documents
                    continuation.resume(
                        HistoryOrderPage(
                            orders = documents.map { CustomerOrder.fromDocument(it.id, it.data.orEmpty()) },
                            lastDocument = documents.lastOrNull()
                        )
                    )
                }
            }
            .addOnFailureListener { error ->
                if (continuation.isActive) continuation.resumeWithException(error)
            }
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    fun observeAllForCustomer(customerId: String): Flow<Result<List<CustomerOrder>>> = callbackFlow {
        val registration = db().collection("orders")
            .whereEqualTo("customerId", customerId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                } else {
                    val orders = snapshot?.documents.orEmpty()
                        .map { CustomerOrder.fromDocument(it.id, it.data.orEmpty()) }
                        .sortedByDescending { it.pickupTime?.toDate() ?: Date(0) }
                    trySend(Result.success(orders))
                }
            }
        awaitClose { registration.remove() }
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    fun observeOrdersForBusiness(businessId: String): Flow<Result<List<CustomerOrder>>> = callbackFlow {
        val registration = db().collection("orders")
            .whereEqualTo("businessId", businessId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                } else {
                    val orders = snapshot?.documents.orEmpty().map {
                        CustomerOrder.fromDocument(it.id, it.data.orEmpty())
                    }.sortedByDescending { it.createdAt?.toDate() ?: Date(0) }
                    trySend(Result.success(orders))
                }
            }
        awaitClose { registration.remove() }
    }

    fun listenForBusiness(
        businessId: String,
        onUpdate: (Result<List<CustomerOrder>>) -> Unit
    ): ListenerRegistration = db().collection("orders")
        .whereEqualTo("businessId", businessId)
        .addSnapshotListener { snapshot, error ->
            if (error != null) onUpdate(Result.failure(error))
            else onUpdate(
                Result.success(snapshot?.documents.orEmpty().map {
                    CustomerOrder.fromDocument(it.id, it.data.orEmpty())
                })
            )
        }

    fun updateStatus(
        orderId: String,
        status: String,
        onComplete: (Result<Unit>) -> Unit
    ) {
        db().collection("orders").document(orderId)
            .update("status", status)
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }
}
