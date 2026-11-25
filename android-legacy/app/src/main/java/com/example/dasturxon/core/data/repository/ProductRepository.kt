package com.example.dasturxon.core.data.repository

import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.data.model.Product
import kotlinx.coroutines.flow.Flow

interface ProductRepository {
    fun getProductsForBusiness(businessId: String): Flow<AppResult<List<Product>>>
    fun getAvailableProducts(): Flow<AppResult<List<Product>>>
    suspend fun saveProduct(product: Product): AppResult<Unit>
    suspend fun updateProduct(product: Product): AppResult<Unit>
    suspend fun deleteProduct(productId: String): AppResult<Unit>
}
