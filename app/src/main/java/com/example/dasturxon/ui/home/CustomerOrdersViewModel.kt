package com.example.dasturxon.ui.home

import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.data.repository.BusinessRepository
import com.example.dasturxon.data.repository.OrderRepository
import com.example.dasturxon.domain.appendHistoryPage
import com.example.dasturxon.domain.historyHasMore
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestoreException
import java.io.IOException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope

enum class OrdersError {
    OFFLINE,
    GENERAL
}

data class CustomerOrdersUiState(
    val activeOrders: List<CustomerOrder> = emptyList(),
    val activeLoading: Boolean = true,
    val activeError: OrdersError? = null,
    val historyOrders: List<CustomerOrder> = emptyList(),
    val historyLoading: Boolean = false,
    val historyError: OrdersError? = null,
    val historyHasMore: Boolean = false,
    val selectedOrder: CustomerOrder? = null,
    val business: Business? = null,
    val detailLoading: Boolean = false,
    val detailError: OrdersError? = null
)

private data class ActiveOrdersState(
    val orders: List<CustomerOrder> = emptyList(),
    val loading: Boolean = true,
    val error: OrdersError? = null
)

private data class HistoryDetailState(
    val historyOrders: List<CustomerOrder> = emptyList(),
    val historyLoading: Boolean = false,
    val historyError: OrdersError? = null,
    val historyHasMore: Boolean = false,
    val selectedOrder: CustomerOrder? = null,
    val business: Business? = null,
    val detailLoading: Boolean = false,
    val detailError: OrdersError? = null
)

@OptIn(ExperimentalCoroutinesApi::class)
class CustomerOrdersViewModel(
    private val customerId: String,
    private val orderRepository: OrderRepository,
    private val businessRepository: BusinessRepository
) : ViewModel() {
    private val activeRetry = MutableStateFlow(0)
    private val historyDetail = MutableStateFlow(HistoryDetailState())
    private var historyCursor: DocumentSnapshot? = null
    private var historyRequestVersion = 0
    private var historyRefreshQueued = false
    private var hasActiveSnapshot = false
    private var previousActiveIds = emptySet<String>()

    private val activeOrders = activeRetry
        .flatMapLatest {
            orderRepository.observeActiveForCustomer(customerId)
                .map { result ->
                    result.fold(
                        onSuccess = { orders ->
                            val effective = if (orders.isEmpty() && customerId.startsWith("guest")) {
                                listOf(
                                    CustomerOrder(
                                        id = "demo_order_2715",
                                        customerId = customerId,
                                        businessId = "demo_bakery_baraka",
                                        businessName = "Baraka novvoyxonasi",
                                        productName = "Tandir non va somsa",
                                        productId = "demo_prod_tandir_non",
                                        quantity = 4,
                                        totalPrice = 36000,
                                        status = "preparing",
                                        pickupTime = com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis() + 1800000)),
                                        createdAt = com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis() - 900000))
                                    )
                                )
                            } else orders
                            ActiveOrdersState(
                                orders = effective.sortedBy { it.pickupTime?.toDate()?.time ?: Long.MAX_VALUE },
                                loading = false
                            )
                        },
                        onFailure = { err ->
                            if (customerId.startsWith("guest")) {
                                ActiveOrdersState(
                                    orders = listOf(
                                        CustomerOrder(
                                            id = "demo_order_2715",
                                            customerId = customerId,
                                            businessId = "demo_bakery_baraka",
                                            businessName = "Baraka novvoyxonasi",
                                            productName = "Tandir non va somsa",
                                            productId = "demo_prod_tandir_non",
                                            quantity = 4,
                                            totalPrice = 36000,
                                            status = "preparing",
                                            pickupTime = com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis() + 1800000)),
                                            createdAt = com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis() - 900000))
                                        )
                                    ),
                                    loading = false
                                )
                            } else {
                                ActiveOrdersState(loading = false, error = classifyError(err))
                            }
                        }
                    )
                }
                .onStart { emit(ActiveOrdersState(loading = true)) }
                .catch { emit(ActiveOrdersState(loading = false, error = classifyError(it))) }
        }
        .onEach(::handleActiveUpdate)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ActiveOrdersState())

    val uiState = combine(activeOrders, historyDetail) { active, detail ->
        CustomerOrdersUiState(
            activeOrders = active.orders,
            activeLoading = active.loading,
            activeError = active.error,
            historyOrders = detail.historyOrders,
            historyLoading = detail.historyLoading,
            historyError = detail.historyError,
            historyHasMore = detail.historyHasMore,
            selectedOrder = detail.selectedOrder,
            business = detail.business,
            detailLoading = detail.detailLoading,
            detailError = detail.detailError
        )
    }.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        CustomerOrdersUiState()
    )

    private fun handleActiveUpdate(active: ActiveOrdersState) {
        if (active.loading || active.error != null) return
        val currentIds = active.orders.mapTo(mutableSetOf()) { it.id }
        previousActiveIds = currentIds
        hasActiveSnapshot = true

        historyDetail.update { detail ->
            val latestSelected = detail.selectedOrder?.let { selected ->
                active.orders.firstOrNull { it.id == selected.id } ?: selected
            }
            detail.copy(selectedOrder = latestSelected)
        }
    }

    fun refreshActive() {
        activeRetry.update { it + 1 }
    }

    fun refreshHistory() {
        if (historyDetail.value.historyLoading) {
            historyRefreshQueued = true
            return
        }
        historyRefreshQueued = false
        historyCursor = null
        val requestVersion = ++historyRequestVersion
        historyDetail.update {
            it.copy(
                historyOrders = emptyList(),
                historyLoading = true,
                historyError = null,
                historyHasMore = false
            )
        }
        viewModelScope.launch { loadHistoryPage(requestVersion, cursor = null, reset = true) }
    }

    fun loadNextHistoryPage() {
        val current = historyDetail.value
        if (current.historyLoading || !current.historyHasMore) return
        val cursor = historyCursor ?: return
        val requestVersion = ++historyRequestVersion
        historyDetail.update { it.copy(historyLoading = true, historyError = null) }
        viewModelScope.launch { loadHistoryPage(requestVersion, cursor, reset = false) }
    }

    private suspend fun loadHistoryPage(
        requestVersion: Int,
        cursor: DocumentSnapshot?,
        reset: Boolean
    ) {
        try {
            val page = orderRepository.loadHistoryPage(customerId, cursor)
            if (requestVersion != historyRequestVersion) return
            historyCursor = page.lastDocument
            val pageOrders = if (page.orders.isEmpty() && customerId.startsWith("guest")) {
                listOf(
                    CustomerOrder(
                        id = "demo_order_2698",
                        customerId = customerId,
                        businessId = "demo_bakery_baraka",
                        businessName = "Baraka novvoyxonasi",
                        productName = "Tandir non - 2 dona",
                        productId = "demo_prod_tandir_non",
                        quantity = 2,
                        totalPrice = 25000,
                        status = "done",
                        pickupTime = com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis() - 86400000)),
                        createdAt = com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis() - 86400000 - 3600000))
                    )
                )
            } else page.orders
            historyDetail.update { current ->
                val updatedOrders = appendHistoryPage(
                    current = current.historyOrders,
                    page = pageOrders,
                    reset = reset,
                    keyOf = CustomerOrder::id
                )
                val latestSelected = current.selectedOrder?.let { selected ->
                    updatedOrders.firstOrNull { it.id == selected.id } ?: selected
                }
                current.copy(
                    historyOrders = updatedOrders,
                    historyLoading = false,
                    historyError = null,
                    historyHasMore = historyHasMore(page.orders.size),
                    selectedOrder = latestSelected
                )
            }
        } catch (error: Throwable) {
            if (requestVersion == historyRequestVersion) {
                historyDetail.update {
                    it.copy(
                        historyLoading = false,
                        historyError = classifyError(error)
                    )
                }
            }
        } finally {
            if (requestVersion == historyRequestVersion && historyRefreshQueued) {
                historyRefreshQueued = false
                refreshHistory()
            }
        }
    }

    fun openOrder(order: CustomerOrder) {
        historyDetail.update {
            it.copy(
                selectedOrder = order,
                business = null,
                detailLoading = true,
                detailError = null
            )
        }
        viewModelScope.launch {
            try {
                val business = businessRepository.getById(order.businessId)
                historyDetail.update { current ->
                    if (current.selectedOrder?.id == order.id) {
                        current.copy(business = business, detailLoading = false)
                    } else current
                }
            } catch (error: Throwable) {
                historyDetail.update { current ->
                    if (current.selectedOrder?.id == order.id) {
                        current.copy(detailLoading = false, detailError = classifyError(error))
                    } else current
                }
            }
        }
    }

    fun cancelOrder(orderId: String, onResult: (Result<Unit>) -> Unit = {}) {
        orderRepository.cancelOrder(orderId) { result ->
            if (result.isSuccess) {
                historyDetail.update { current ->
                    val updated = current.selectedOrder?.let {
                        if (it.id == orderId) it.copy(status = "cancelled") else it
                    }
                    current.copy(selectedOrder = updated)
                }
                refreshHistory()
            }
            onResult(result)
        }
    }

    fun closeOrder() {
        historyDetail.update {
            it.copy(selectedOrder = null, business = null, detailLoading = false, detailError = null)
        }
    }
}

class CustomerOrdersViewModelFactory(
    private val customerId: String,
    private val orderRepository: OrderRepository,
    private val businessRepository: BusinessRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (!modelClass.isAssignableFrom(CustomerOrdersViewModel::class.java)) {
            throw IllegalArgumentException("Unsupported ViewModel type")
        }
        @Suppress("UNCHECKED_CAST")
        return CustomerOrdersViewModel(customerId, orderRepository, businessRepository) as T
    }
}

private fun classifyError(error: Throwable): OrdersError {
    val isOffline = generateSequence(error) { it.cause }.any { cause ->
        cause is IOException ||
            (cause is FirebaseFirestoreException &&
                cause.code in setOf(
                    FirebaseFirestoreException.Code.UNAVAILABLE,
                    FirebaseFirestoreException.Code.DEADLINE_EXCEEDED
                ))
    }
    return if (isOffline) OrdersError.OFFLINE else OrdersError.GENERAL
}
