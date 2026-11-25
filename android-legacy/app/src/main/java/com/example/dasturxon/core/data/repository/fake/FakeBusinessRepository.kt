package com.example.dasturxon.core.data.repository.fake

import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.core.data.repository.BusinessRepository
import com.example.dasturxon.data.model.Business
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject

class FakeBusinessRepository @Inject constructor() : BusinessRepository {
    private val businesses = mutableListOf<Business>()

    override fun getBusiness(id: String): Flow<AppResult<Business?>> {
        return flowOf(AppResult.Success(businesses.find { it.id == id }))
    }

    override fun getOwnerBusinesses(ownerId: String): Flow<AppResult<List<Business>>> {
        return flowOf(AppResult.Success(businesses.filter { it.ownerId == ownerId }))
    }

    override suspend fun createBusiness(business: Business): AppResult<Unit> {
        businesses.add(business)
        return AppResult.Success(Unit)
    }

    override suspend fun updateBusiness(business: Business): AppResult<Unit> {
        val index = businesses.indexOfFirst { it.id == business.id }
        if (index != -1) {
            businesses[index] = business
        }
        return AppResult.Success(Unit)
    }
}
