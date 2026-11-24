package com.example.dasturxon.data.repository

import com.example.dasturxon.data.model.Expense
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

class ExpenseRepository(private val firestore: FirebaseFirestore) {

    fun create(
        businessId: String,
        title: String,
        amount: Long,
        category: String,
        onComplete: (Result<Unit>) -> Unit
    ) {
        val data = mapOf(
            "businessId" to businessId,
            "title" to title,
            "amount" to amount,
            "category" to category,
            "createdAt" to FieldValue.serverTimestamp()
        )
        firestore.collection("expenses").add(data)
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    fun observeForBusiness(businessId: String): Flow<Result<List<Expense>>> = callbackFlow {
        val registration = firestore.collection("expenses")
            .whereEqualTo("businessId", businessId)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                } else {
                    val expenses = snapshot?.documents.orEmpty().map { doc ->
                        Expense.fromDocument(doc.id, doc.data.orEmpty())
                    }
                    trySend(Result.success(expenses))
                }
            }
        awaitClose { registration.remove() }
    }

    fun delete(
        expenseId: String,
        onComplete: (Result<Unit>) -> Unit
    ) {
        firestore.collection("expenses").document(expenseId).delete()
            .addOnSuccessListener { onComplete(Result.success(Unit)) }
            .addOnFailureListener { onComplete(Result.failure(it)) }
    }
}
