package com.example.dasturxon.ui.home

import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.data.repository.BusinessRepository
import com.example.dasturxon.data.repository.HistoryOrderPage
import com.example.dasturxon.data.repository.OrderRepository
import com.example.dasturxon.domain.PAGE_SIZE
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.TestDocumentSnapshotFactory
import java.io.IOException
import java.util.Date
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class CustomerOrdersViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val testScope = TestScope(testDispatcher)

    private val activeFlow = MutableSharedFlow<Result<List<CustomerOrder>>>(replay = 1)
    private var historyPages = mutableListOf<HistoryOrderPage>()
    private var historyLoadCount = 0
    private var businessToReturn: Business? = null

    private val fakeOrderRepository = object : OrderRepository() {
        override fun observeActiveForCustomer(customerId: String): Flow<Result<List<CustomerOrder>>> {
            return activeFlow
        }

        override suspend fun loadHistoryPage(
            customerId: String,
            cursor: DocumentSnapshot?
        ): HistoryOrderPage {
            historyLoadCount++
            return if (historyPages.isNotEmpty()) {
                historyPages.removeAt(0)
            } else {
                HistoryOrderPage(emptyList(), null)
            }
        }
    }

    private val fakeBusinessRepository = object : BusinessRepository() {
        override suspend fun getById(businessId: String): Business? {
            return businessToReturn
        }
    }

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        historyPages.clear()
        historyLoadCount = 0
        businessToReturn = null
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun TestScope.startCollecting(viewModel: CustomerOrdersViewModel) {
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect()
        }
    }

    private fun createOrder(
        id: String,
        status: String,
        businessId: String = "biz-1",
        productName: String = "Non",
        totalPrice: Long = 10000L
    ): CustomerOrder = CustomerOrder(
        id = id,
        customerId = "customer-1",
        businessId = businessId,
        businessName = "Baraka",
        productName = productName,
        productId = "prod-1",
        quantity = 2,
        totalPrice = totalPrice,
        status = status,
        pickupTime = Timestamp(Date(1700000000000L)),
        createdAt = Timestamp(Date(1699990000000L))
    )

    @Test
    fun initialStateShowsLoadingForActiveOrders() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)
        val initial = viewModel.uiState.value
        assertTrue(initial.activeLoading)
        assertTrue(initial.activeOrders.isEmpty())
        assertNull(initial.activeError)
    }

    @Test
    fun activeOrdersEmissionUpdatesUiState() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)
        val order1 = createOrder("ord-1", "new")
        activeFlow.emit(Result.success(listOf(order1)))
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.activeLoading)
        assertEquals(1, state.activeOrders.size)
        assertEquals("ord-1", state.activeOrders[0].id)
        assertEquals("new", state.activeOrders[0].status)
    }

    @Test
    fun realTimeStatusChangeUpdatesActiveOrdersAndSelectedOrder() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)
        val order = createOrder("ord-1", "new")
        activeFlow.emit(Result.success(listOf(order)))
        advanceUntilIdle()

        // Customer opens the order
        viewModel.openOrder(order)
        advanceUntilIdle()
        assertEquals("new", viewModel.uiState.value.selectedOrder?.status)

        // Owner updates status to accepted in real time
        val updatedOrder = createOrder("ord-1", "accepted")
        activeFlow.emit(Result.success(listOf(updatedOrder)))
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals("accepted", state.activeOrders[0].status)
        assertEquals("accepted", state.selectedOrder?.status)

        // Owner updates status to ready in real time
        val readyOrder = createOrder("ord-1", "ready")
        activeFlow.emit(Result.success(listOf(readyOrder)))
        advanceUntilIdle()

        assertEquals("ready", viewModel.uiState.value.selectedOrder?.status)
    }

    @Test
    fun orderDisappearingFromActiveTriggersHistoryRefresh() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)
        val order = createOrder("ord-1", "ready")
        activeFlow.emit(Result.success(listOf(order)))
        advanceUntilIdle()

        val completedOrder = createOrder("ord-1", "done")
        historyPages.add(HistoryOrderPage(listOf(completedOrder), null))

        // Owner marks order as done -> it disappears from active query
        activeFlow.emit(Result.success(emptyList()))
        advanceUntilIdle()

        assertTrue(historyLoadCount > 0)
        val state = viewModel.uiState.value
        assertTrue(state.activeOrders.isEmpty())
        assertEquals(1, state.historyOrders.size)
        assertEquals("done", state.historyOrders[0].status)
    }

    @Test
    fun offlineErrorClassifiedCorrectly() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)
        activeFlow.emit(Result.failure(IOException("No network")))
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.activeLoading)
        assertEquals(OrdersError.OFFLINE, state.activeError)
    }

    @Test
    fun firestoreUnavailableClassifiedAsOffline() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)
        activeFlow.emit(
            Result.failure(
                FirebaseFirestoreException("Unavailable", FirebaseFirestoreException.Code.UNAVAILABLE)
            )
        )
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(OrdersError.OFFLINE, state.activeError)
    }

    @Test
    fun generalErrorClassifiedCorrectly() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)
        activeFlow.emit(Result.failure(IllegalStateException("Unknown error")))
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(OrdersError.GENERAL, state.activeError)
    }

    @Test
    fun openAndCloseOrderManagesState() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)
        businessToReturn = Business(
            id = "biz-1",
            ownerId = "owner-1",
            name = "Baraka Novvoyxona",
            type = "bakery",
            address = "Yunusobod",
            phone = "+998901234567",
            status = "approved"
        )
        val order = createOrder("ord-1", "new", businessId = "biz-1")
        activeFlow.emit(Result.success(listOf(order)))
        advanceUntilIdle()

        viewModel.openOrder(order)
        advanceUntilIdle()

        val openState = viewModel.uiState.value
        assertEquals("ord-1", openState.selectedOrder?.id)
        assertNotNull(openState.business)
        assertEquals("Baraka Novvoyxona", openState.business?.name)
        assertFalse(openState.detailLoading)

        viewModel.closeOrder()
        advanceUntilIdle()
        val closedState = viewModel.uiState.value
        assertNull(closedState.selectedOrder)
        assertNull(closedState.business)
    }

    @Test
    fun loadNextHistoryPageAppendsOrders() = testScope.runTest {
        val viewModel = CustomerOrdersViewModel("customer-1", fakeOrderRepository, fakeBusinessRepository)
        startCollecting(viewModel)

        // Generate full first page so historyHasMore becomes true
        val page1 = (1..PAGE_SIZE).map { createOrder("p1-$it", "done") }
        val dummyDoc = TestDocumentSnapshotFactory.createDummySnapshot()
        historyPages.add(HistoryOrderPage(page1, dummyDoc))

        viewModel.refreshHistory()
        advanceUntilIdle()

        assertEquals(PAGE_SIZE, viewModel.uiState.value.historyOrders.size)
        assertTrue(viewModel.uiState.value.historyHasMore)

        // Load next page
        val page2 = listOf(createOrder("p2-1", "done"))
        historyPages.add(HistoryOrderPage(page2, null))

        viewModel.loadNextHistoryPage()
        advanceUntilIdle()

        assertEquals(PAGE_SIZE + 1, viewModel.uiState.value.historyOrders.size)
        assertFalse(viewModel.uiState.value.historyHasMore)
    }
}
