package com.example.dasturxon.core.data.repository

import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.data.model.CustomerOrder
import kotlinx.coroutines.flow.Flow

interface OrderRepository {
    fun getActiveOrdersForCustomer(customerId: String): Flow<AppResult<List<CustomerOrder>>>
    fun getHistoryOrdersForCustomer(customerId: String): Flow<AppResult<List<CustomerOrder>>>
    fun getActiveOrdersForBusiness(businessId: String): Flow<AppResult<List<CustomerOrder>>>
    fun getHistoryOrdersForBusiness(businessId: String): Flow<AppResult<List<CustomerOrder>>>
    suspend fun createOrder(order: CustomerOrder): AppResult<Unit>
    suspend fun updateOrderStatus(orderId: String, newStatus: String): AppResult<Unit>
}
