package com.example.dasturxon.data.repository

import com.example.dasturxon.data.model.Business
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

open class BusinessRepository {
    private val firestore: FirebaseFirestore?

    constructor(firestore: FirebaseFirestore) {
        this.firestore = firestore
    }

    constructor() {
        this.firestore = null
    }

    protected fun db(): FirebaseFirestore =
        firestore ?: throw IllegalStateException("Firestore not configured")

    fun create(
        ownerId: String,
        name: String,
        type: String,
        address: String,
        phone: String,
        onComplete: (Result<Unit>) -> Unit,
        typeNote: String? = null
    ) {
        val data = mutableMapOf<String, Any>(
            "ownerId" to ownerId,
            "name" to name,
            "type" to type,
            "address" to address,
            "phone" to phone,
            "status" to "pending",
            "createdAt" to FieldValue.serverTimestamp()
        )
        typeNote?.trim()?.takeIf(String::isNotEmpty)?.let { data["typeNote"] = it }
        db().collection("businesses").add(data)
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    fun resubmit(
        businessId: String,
        name: String,
        type: String,
        address: String,
        phone: String,
        onComplete: (Result<Unit>) -> Unit,
        typeNote: String? = null
    ) {
        val updates = mutableMapOf<String, Any>(
            "name" to name,
            "type" to type,
            "address" to address,
            "phone" to phone,
            "status" to "pending",
            "rejectionReason" to FieldValue.delete(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        updates["typeNote"] = typeNote?.trim()
            ?.takeIf(String::isNotEmpty)
            ?: FieldValue.delete()
        db().collection("businesses").document(businessId)
            .update(updates)
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    open suspend fun getById(businessId: String): Business? = suspendCancellableCoroutine { continuation ->
        db().collection("businesses").document(businessId).get()
            .addOnSuccessListener { snapshot ->
                if (continuation.isActive) {
                    continuation.resume(
                        if (snapshot.exists()) Business.fromDocument(snapshot.id, snapshot.data.orEmpty()) else null
                    )
                }
            }
            .addOnFailureListener { error ->
                if (continuation.isActive) continuation.resumeWithException(error)
            }
    }

    fun listenForOwner(
        ownerId: String,
        onUpdate: (Result<List<Business>>) -> Unit
    ): ListenerRegistration = db().collection("businesses")
        .whereEqualTo("ownerId", ownerId)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                onUpdate(Result.failure(error))
            } else {
                onUpdate(
                    Result.success(
                        snapshot?.documents.orEmpty().map { doc ->
                            Business.fromDocument(doc.id, doc.data.orEmpty())
                        }
                    )
                )
            }
        }

    fun listenPending(onUpdate: (Result<List<Business>>) -> Unit): ListenerRegistration =
        db().collection("businesses")
            .whereEqualTo("status", "pending")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onUpdate(Result.failure(error))
                } else {
                    onUpdate(
                        Result.success(
                            snapshot?.documents.orEmpty().map { doc ->
                                Business.fromDocument(doc.id, doc.data.orEmpty())
                            }
                        )
                    )
                }
            }

    fun listenApproved(onUpdate: (Result<List<Business>>) -> Unit): ListenerRegistration =
        db().collection("businesses")
            .whereEqualTo("status", "approved")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onUpdate(Result.failure(error))
                } else {
                    onUpdate(
                        Result.success(
                            snapshot?.documents.orEmpty().map { doc ->
                                Business.fromDocument(doc.id, doc.data.orEmpty())
                            }
                        )
                    )
                }
            }

    fun listenAll(onUpdate: (Result<List<Business>>) -> Unit): ListenerRegistration =
        db().collection("businesses")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onUpdate(Result.failure(error))
                } else {
                    onUpdate(
                        Result.success(
                            snapshot?.documents.orEmpty().map { doc ->
                                Business.fromDocument(doc.id, doc.data.orEmpty())
                            }
                        )
                    )
                }
            }

    fun setStatus(
        businessId: String,
        status: String,
        rejectionReason: String? = null,
        onComplete: (Result<Unit>) -> Unit
    ) {
        val updates = mutableMapOf<String, Any>("status" to status)
        if (rejectionReason != null) updates["rejectionReason"] = rejectionReason
        db().collection("businesses").document(businessId)
            .update(updates)
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }
}
