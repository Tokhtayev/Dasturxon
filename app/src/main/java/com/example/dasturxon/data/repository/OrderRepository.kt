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
        fulfillmentType: String = "pickup",
        deliveryAddress: String = "",
        customerPhone: String = "",
        customerName: String = "",
        onComplete: (Result<Unit>) -> Unit
    ) {
        val productRef = db().collection("products").document(product.id)
        val businessRef = db().collection("businesses").document(business.id)
        val orderRef = db().collection("orders").document()
        val itemRef = orderRef.collection("items").document()

        db().runTransaction { transaction ->
            val productSnapshot = transaction.get(productRef)
            val businessSnapshot = transaction.get(businessRef)
            val status = productSnapshot.getString("status")
            val currentStock = productSnapshot.getLong("stock")
            val price = productSnapshot.getLong("price")
                ?: throw IllegalStateException("Mahsulot narxi topilmadi.")

            if (businessSnapshot.getString("status") != "approved") {
                throw IllegalStateException("Bu biznes hozir buyurtma olmayapti.")
            }
            if (status !in listOf("available", "hot_ready")) {
                throw IllegalStateException("Mahsulot hozir mavjud emas.")
            }
            if (quantity <= 0L || (currentStock != null && quantity > currentStock)) {
                throw IllegalStateException("Zaxira yetarli emas.")
            }

            // In accordance with PRD AMENDMENTS:
            // "unitPrice == product.sellingPrice; max ~15 lines per order. Customer never writes totals."
            val unitPrice = price

            val order = mapOf(
                "customerId" to customerId,
                "businessId" to business.id,
                "businessName" to business.name,
                "productId" to product.id,
                "productName" to (productSnapshot.getString("name") ?: product.name),
                "quantity" to quantity,
                "unitPrice" to unitPrice,
                "status" to "pending",
                "paymentStatus" to "unpaid",
                "pickupTime" to pickupTime,
                "fulfillmentType" to fulfillmentType,
                "deliveryAddress" to deliveryAddress,
                "customerPhone" to customerPhone,
                "customerName" to customerName,
                "createdAt" to FieldValue.serverTimestamp()
            )
            transaction.set(orderRef, order)

            // Line item in subcollection: orders/{orderId}/items/{itemId}
            val lineItem = mapOf(
                "productId" to product.id,
                "name" to (productSnapshot.getString("name") ?: product.name),
                "qty" to quantity,
                "unitPrice" to unitPrice
            )
            transaction.set(itemRef, lineItem)

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
            .update(
                mapOf(
                    "status" to status,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun cancelOrder(
        orderId: String,
        onComplete: (Result<Unit>) -> Unit
    ) {
        // Customer cancellation: rules allow status pending/new -> cancelled
        db().collection("orders").document(orderId)
            .update(
                mapOf(
                    "status" to "cancelled",
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun completeOrder(
        orderId: String,
        unitCost: Long? = null,
        onComplete: (Result<Unit>) -> Unit
    ) {
        val orderRef = db().collection("orders").document(orderId)
        val updates = mutableMapOf<String, Any>(
            "status" to "completed",
            "updatedAt" to FieldValue.serverTimestamp()
        )
        orderRef.update(updates)
            .addOnSuccessListener {
                if (unitCost != null && unitCost > 0L) {
                    orderRef.collection("items").get()
                        .addOnSuccessListener { snap ->
                            val batch = db().batch()
                            snap.documents.forEach { itemDoc ->
                                batch.update(itemDoc.reference, "unitCost", unitCost)
                            }
                            batch.commit()
                                .addOnCompleteListener { onComplete(Result.success(Unit)) }
                        }
                        .addOnFailureListener { onComplete(Result.success(Unit)) }
                } else {
                    onComplete(Result.success(Unit))
                }
            }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun setPaymentStatus(
        orderId: String,
        paymentStatus: String,
        onComplete: (Result<Unit>) -> Unit
    ) {
        val updates = mutableMapOf<String, Any>(
            "paymentStatus" to paymentStatus,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (paymentStatus == "paid") {
            updates["paidAt"] = FieldValue.serverTimestamp()
        }
        db().collection("orders").document(orderId)
            .update(updates)
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }
}
