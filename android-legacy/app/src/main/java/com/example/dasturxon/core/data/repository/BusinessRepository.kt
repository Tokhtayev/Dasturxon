package com.example.dasturxon.core.data.repository

import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.data.model.Business
import kotlinx.coroutines.flow.Flow

interface BusinessRepository {
    fun getBusiness(id: String): Flow<AppResult<Business?>>
    fun getOwnerBusinesses(ownerId: String): Flow<AppResult<List<Business>>>
    suspend fun createBusiness(business: Business): AppResult<Unit>
    suspend fun updateBusiness(business: Business): AppResult<Unit>
}
