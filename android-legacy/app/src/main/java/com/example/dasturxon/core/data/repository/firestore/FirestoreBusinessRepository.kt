package com.example.dasturxon.core.data.repository.firestore

import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.core.data.repository.BusinessRepository
import com.example.dasturxon.data.model.Business
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class FirestoreBusinessRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) : BusinessRepository {

    override fun getBusiness(id: String): Flow<AppResult<Business?>> = callbackFlow {
        val listener = firestore.collection("businesses").document(id)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(AppResult.Error(error))
                    return@addSnapshotListener
                }
                val business = snapshot?.takeIf { it.exists() }?.let {
                    Business.fromDocument(it.id, it.data ?: emptyMap())
                }
                trySend(AppResult.Success(business))
            }
        awaitClose { listener.remove() }
    }

    override fun getOwnerBusinesses(ownerId: String): Flow<AppResult<List<Business>>> = callbackFlow {
        val listener = firestore.collection("businesses")
            .whereEqualTo("ownerId", ownerId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(AppResult.Error(error))
                    return@addSnapshotListener
                }
                val businesses = snapshot?.documents?.map {
                    Business.fromDocument(it.id, it.data ?: emptyMap())
                } ?: emptyList()
                trySend(AppResult.Success(businesses))
            }
        awaitClose { listener.remove() }
    }

    override suspend fun createBusiness(business: Business): AppResult<Unit> = try {
        firestore.collection("businesses").document(business.id).set(business).await()
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error(e)
    }

    override suspend fun updateBusiness(business: Business): AppResult<Unit> = try {
        firestore.collection("businesses").document(business.id).set(business).await()
        AppResult.Success(Unit)
    } catch (e: Exception) {
        AppResult.Error(e)
    }
}
