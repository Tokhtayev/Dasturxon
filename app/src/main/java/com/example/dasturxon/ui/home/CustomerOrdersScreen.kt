package com.example.dasturxon.ui.home

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.Tab
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.snapshotFlow
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.dasturxon.R
import com.example.dasturxon.core.designsystem.EmptyState
import com.example.dasturxon.core.designsystem.ErrorState
import com.example.dasturxon.core.designsystem.SkeletonItem
import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.domain.OrderHistoryMonthGroup
import com.example.dasturxon.domain.OrderStatus
import com.example.dasturxon.domain.OrderStatusGroup
import com.example.dasturxon.domain.groupOrdersByMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.collect

private val ORDER_TIME_ZONE: ZoneId = ZoneId.of("Asia/Tashkent")

internal fun formatPrice(price: Long): String = "%,d".format(price).replace(',', ' ')

@Composable
internal fun CustomerOrdersScreen(
    viewModel: CustomerOrdersViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }

    if (state.selectedOrder != null) {
        BackHandler { viewModel.closeOrder() }
        OrderDetailScreen(
            order = state.selectedOrder!!,
            business = state.business,
            loadingBusiness = state.detailLoading,
            detailError = state.detailError,
            onBack = viewModel::closeOrder,
            modifier = modifier
        )
        return
    }

    Column(modifier = modifier) {
        PrimaryTabRow(selectedTabIndex = selectedTab) {
            Tab(
                selected = selectedTab == 0,
                onClick = {
                    selectedTab = 0
                },
                text = {
                    BadgedBox(badge = {
                        Badge { Text(state.activeOrders.size.toString()) }
                    }) {
                        Text(stringResource(R.string.orders_tab_active))
                    }
                }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = {
                    selectedTab = 1
                    viewModel.refreshHistory()
                },
                text = { Text(stringResource(R.string.orders_tab_history)) }
            )
        }
        if (selectedTab == 0) {
            ActiveOrdersList(
                state = state,
                onRefresh = viewModel::refreshActive,
                onRetry = viewModel::refreshActive,
                onOrderClick = viewModel::openOrder,
                modifier = Modifier.weight(1f).fillMaxWidth()
            )
        } else {
            HistoryOrdersList(
                state = state,
                onRefresh = viewModel::refreshHistory,
                onRetry = {
                    if (state.historyOrders.isEmpty()) viewModel.refreshHistory()
                    else viewModel.loadNextHistoryPage()
                },
                onOrderClick = viewModel::openOrder,
                onLoadMore = viewModel::loadNextHistoryPage,
                modifier = Modifier.weight(1f).fillMaxWidth()
            )
        }
    }
}

@Composable
private fun ActiveOrdersList(
    state: CustomerOrdersUiState,
    onRefresh: () -> Unit,
    onRetry: () -> Unit,
    onOrderClick: (CustomerOrder) -> Unit,
    modifier: Modifier
) {
    val locale = currentAppLocale()
    val emptyMessage = stringResource(R.string.orders_empty_active)
    val loadingMessage = stringResource(R.string.orders_loading)
    val offlineMessage = stringResource(R.string.orders_offline_error)
    val errorMessage = stringResource(R.string.orders_load_error)

    PullToRefreshBox(
        isRefreshing = state.activeLoading && state.activeOrders.isNotEmpty(),
        onRefresh = onRefresh,
        modifier = modifier
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (state.activeLoading && state.activeOrders.isEmpty()) {
                items(3, key = { "active_skeleton_$it" }) {
                    SkeletonItem(height = 110)
                }
            } else if (state.activeError != null && state.activeOrders.isEmpty()) {
                item(key = "active_error") {
                    ErrorState(
                        message = if (state.activeError == OrdersError.OFFLINE) offlineMessage else errorMessage,
                        onRetry = onRetry
                    )
                }
            } else if (state.activeOrders.isEmpty()) {
                item(key = "active_empty") {
                    EmptyState(
                        title = emptyMessage,
                        description = "Hozircha sizda faol buyurtmalar mavjud emas."
                    )
                }
            }

            items(state.activeOrders, key = CustomerOrder::id) { order ->
                CustomerOrderCard(order = order, locale = locale, onClick = { onOrderClick(order) })
            }
            if (state.activeError != null && state.activeOrders.isNotEmpty()) {
                item(key = "active_error_with_data") {
                    RetryMessage(
                        message = if (state.activeError == OrdersError.OFFLINE) offlineMessage else errorMessage,
                        retryLabel = stringResource(R.string.orders_retry),
                        onRetry = onRetry
                    )
                }
            }
        }
    }
}

@Composable
private fun HistoryOrdersList(
    state: CustomerOrdersUiState,
    onRefresh: () -> Unit,
    onRetry: () -> Unit,
    onOrderClick: (CustomerOrder) -> Unit,
    onLoadMore: () -> Unit,
    modifier: Modifier
) {
    val locale = currentAppLocale()
    val listState = rememberLazyListState()
    val emptyMessage = stringResource(R.string.orders_empty_history)
    val loadingMessage = stringResource(R.string.orders_loading_history)
    val offlineMessage = stringResource(R.string.orders_offline_error)
    val errorMessage = stringResource(R.string.orders_load_error)
    val missingDate = stringResource(R.string.orders_date_unavailable)
    val groups = remember(state.historyOrders, locale) {
        groupOrdersByMonth(state.historyOrders, { order -> order.createdAt?.toDate()?.toInstant() }, locale)
    }
    val lazyItemCount = groups.sumOf { group -> group.orders.size + 1 } +
        if (state.historyLoading || state.historyHasMore) 1 else 0

    LaunchedEffect(
        listState,
        groups.size,
        lazyItemCount,
        state.historyLoading,
        state.historyHasMore,
        state.historyError
    ) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: -1 }
            .distinctUntilChanged()
            .collect { lastVisible ->
                if (
                    lastVisible >= 0 &&
                    lastVisible >= lazyItemCount - 5 &&
                    state.historyHasMore &&
                    !state.historyLoading &&
                    state.historyError == null
                ) {
                    onLoadMore()
                }
            }
    }

    PullToRefreshBox(
        isRefreshing = state.historyLoading && state.historyOrders.isNotEmpty(),
        onRefresh = onRefresh,
        modifier = modifier
    ) {
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (state.historyLoading && state.historyOrders.isEmpty()) {
                items(3, key = { "history_skeleton_$it" }) {
                    SkeletonItem(height = 110)
                }
            } else if (state.historyError != null && state.historyOrders.isEmpty()) {
                item(key = "history_error") {
                    ErrorState(
                        message = if (state.historyError == OrdersError.OFFLINE) offlineMessage else errorMessage,
                        onRetry = onRetry
                    )
                }
            } else if (state.historyOrders.isEmpty()) {
                item(key = "history_empty") {
                    EmptyState(
                        title = emptyMessage,
                        description = "Oldingi buyurtmalaringiz bu yerda saqlanadi."
                    )
                }
            }

            groups.forEach { group ->
                item(key = "month_${group.month}") {
                    MonthHeader(group = group, locale = locale, missingDate = missingDate)
                }
                items(group.orders, key = CustomerOrder::id) { order ->
                    CustomerOrderCard(order = order, locale = locale, onClick = { onOrderClick(order) })
                }
            }

            if (state.historyLoading && state.historyOrders.isNotEmpty()) {
                item(key = "history_loading_more") { CenterMessage { CircularProgressIndicator() } }
            }
            if (state.historyError != null && state.historyOrders.isNotEmpty()) {
                item(key = "history_load_error") {
                    RetryMessage(
                        message = if (state.historyError == OrdersError.OFFLINE) offlineMessage else errorMessage,
                        retryLabel = stringResource(R.string.orders_retry),
                        onRetry = onRetry
                    )
                }
            }
        }
    }
}

@Composable
private fun MonthHeader(
    group: OrderHistoryMonthGroup<CustomerOrder>,
    locale: Locale,
    missingDate: String
) {
    Text(
        text = group.title(locale).ifBlank { missingDate },
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(top = 8.dp)
    )
}

@Composable
private fun CustomerOrderCard(
    order: CustomerOrder,
    locale: Locale,
    onClick: () -> Unit
) {
    val unavailable = stringResource(R.string.orders_date_unavailable)
    val dateFormatter = remember(locale) {
        DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM)
            .withLocale(locale)
            .withZone(ORDER_TIME_ZONE)
    }
    val pickup = remember(order.pickupTime, dateFormatter) {
        order.pickupTime?.toDate()?.toInstant()?.let(dateFormatter::format) ?: unavailable
    }
    val created = remember(order.createdAt, dateFormatter) {
        order.createdAt?.toDate()?.toInstant()?.let(dateFormatter::format) ?: unavailable
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(order.productName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                OrderStatusPill(order.status)
            }
            Text(order.businessName, style = MaterialTheme.typography.bodyMedium)
            Text(stringResource(R.string.order_quantity, order.quantity))
            Text(stringResource(R.string.order_total_price, formatPrice(order.totalPrice)))
            Text(stringResource(R.string.order_pickup_time, pickup), style = MaterialTheme.typography.bodySmall)
            Text(stringResource(R.string.order_created_time, created), style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun OrderStatusPill(status: String) {
    com.example.dasturxon.core.designsystem.StatusChip(
        status = com.example.dasturxon.core.model.OrderStatus.fromStoredValue(status)
    )
}

@Composable
private fun OrderDetailScreen(
    order: CustomerOrder,
    business: Business?,
    loadingBusiness: Boolean,
    detailError: OrdersError?,
    onBack: () -> Unit,
    modifier: Modifier
) {
    val context = LocalContext.current
    val locale = currentAppLocale()
    val unavailable = stringResource(R.string.orders_date_unavailable)
    val offlineMessage = stringResource(R.string.orders_offline_error)
    val detailErrorMessage = stringResource(R.string.order_status_detail_error)
    val dateFormatter = remember(locale) {
        DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM)
            .withLocale(locale)
            .withZone(ORDER_TIME_ZONE)
    }
    val pickup = remember(order.pickupTime, dateFormatter) {
        order.pickupTime?.toDate()?.toInstant()?.let(dateFormatter::format) ?: unavailable
    }
    val created = remember(order.createdAt, dateFormatter) {
        order.createdAt?.toDate()?.toInstant()?.let(dateFormatter::format) ?: unavailable
    }
    val shortCode = remember(order.id) { order.id.takeLast(6).uppercase(Locale.ROOT) }
    val title = stringResource(R.string.order_detail_title)
    val contactUnavailable = stringResource(R.string.order_contact_unavailable)
    val phone = business?.phone.orEmpty()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        TextButton(onClick = onBack) { Text(stringResource(R.string.order_back)) }
        Text(title, style = MaterialTheme.typography.headlineSmall)
        Text(stringResource(R.string.order_short_code, shortCode), style = MaterialTheme.typography.bodySmall)
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(stringResource(R.string.order_product_name, order.productName))
                Text(stringResource(R.string.order_business_name, business?.name ?: order.businessName))
                Text(stringResource(R.string.order_quantity, order.quantity))
                order.unitPrice?.let { Text(stringResource(R.string.order_unit_price, formatPrice(it))) }
                Text(stringResource(R.string.order_total_price, formatPrice(order.totalPrice)))
                val isDelivery = order.fulfillmentType == "delivery"
                Text(
                    text = if (isDelivery) "🚚 Yetkazib berish" else "🛍️ Olib ketish",
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
                if (isDelivery && order.deliveryAddress.isNotBlank()) {
                    Text("Manzil: ${order.deliveryAddress}")
                }
                Text(stringResource(R.string.order_pickup_time, pickup))
                Text(stringResource(R.string.order_created_time, created))
                OrderStatusTimeline(order.status)
            }
        }
        Text(stringResource(R.string.order_business_details), style = MaterialTheme.typography.titleMedium)
        if (loadingBusiness) {
            CircularProgressIndicator()
        } else {
            if (detailError != null) {
                Text(
                    if (detailError == OrdersError.OFFLINE) offlineMessage else detailErrorMessage,
                    color = MaterialTheme.colorScheme.error
                )
            }
            if (business?.address?.isNotBlank() == true) {
                Text(stringResource(R.string.order_business_address, business.address))
            }
            if (phone.isNotBlank()) {
                Text(stringResource(R.string.order_business_phone, phone))
                OutlinedButton(
                    onClick = {
                        val dialIntent = Intent(Intent.ACTION_DIAL, Uri.fromParts("tel", phone, null))
                        context.startActivity(dialIntent)
                    }
                ) {
                    Text(stringResource(R.string.order_call_business))
                }
            }
            if (business == null || (business.address.isBlank() && phone.isBlank())) {
                Text(contactUnavailable)
            }
        }
    }
}

@Composable
private fun OrderStatusTimeline(status: String) {
    val current = OrderStatus.fromFirestore(status)
    val timeline = if (current == OrderStatus.REJECTED || current == OrderStatus.CANCELLED) {
        listOf(OrderStatus.PENDING, current)
    } else {
        OrderStatus.timeline
    }
    val progressIndex = OrderStatus.timeline.indexOf(current)
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(stringResource(R.string.order_status_timeline), style = MaterialTheme.typography.titleSmall)
        timeline.forEach { step ->
            val complete = if (step.group == OrderStatusGroup.HISTORY && step != OrderStatus.COMPLETED) {
                step == current
            } else if (current == OrderStatus.REJECTED || current == OrderStatus.CANCELLED) {
                step == OrderStatus.PENDING || step == current
            } else {
                progressIndex >= OrderStatus.timeline.indexOf(step)
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(if (complete) "✓" else "○")
                Text(
                    stringResource(step.labelRes),
                    color = if (complete) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        if (current == null) Text(stringResource(R.string.orders_status_unknown))
    }
}

@Composable
private fun CenterMessage(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        content = { content() }
    )
}

@Composable
private fun RetryMessage(
    message: String,
    retryLabel: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(message, color = MaterialTheme.colorScheme.error)
        Button(onClick = onRetry) { Text(retryLabel) }
    }
}

@Composable
private fun currentAppLocale(): Locale {
    val configuration = LocalConfiguration.current
    return remember(configuration) {
        if (configuration.locales.isEmpty) Locale.getDefault()
        else configuration.locales[0] ?: Locale.getDefault()
    }
}
