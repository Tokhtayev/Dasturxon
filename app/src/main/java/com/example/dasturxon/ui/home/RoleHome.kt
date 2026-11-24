package com.example.dasturxon.ui.home

import android.app.DatePickerDialog
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.io.ByteArrayOutputStream
import com.example.dasturxon.R
import com.example.dasturxon.core.common.MoneyFormatter
import com.example.dasturxon.core.designsystem.DxScaffold
import com.example.dasturxon.core.designsystem.DxTopBar
import com.example.dasturxon.core.designsystem.EmptyState
import com.example.dasturxon.core.designsystem.KpiCard
import com.example.dasturxon.core.designsystem.ProductCard
import com.example.dasturxon.core.designsystem.SectionHeader
import com.example.dasturxon.core.designsystem.ShopAvatar
import com.example.dasturxon.core.designsystem.charts.DonutChart
import com.example.dasturxon.core.designsystem.charts.LineChart
import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.data.model.Expense
import com.example.dasturxon.data.model.Product
import com.example.dasturxon.data.repository.AnalyticsRepository
import com.example.dasturxon.data.repository.BusinessRepository
import com.example.dasturxon.data.repository.ExpenseRepository
import com.example.dasturxon.data.repository.OrderRepository
import com.example.dasturxon.data.repository.ProductRepository
import com.example.dasturxon.domain.BusinessType
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import java.util.Calendar
import java.util.Date

@Composable
fun RoleHome(
    uid: String,
    email: String,
    role: String,
    firestore: FirebaseFirestore,
    onSignOut: () -> Unit,
    fullName: String = ""
) {
    when (role) {
        "owner" -> OwnerHome(uid, email, firestore, onSignOut)
        "admin" -> AdminHome(email, firestore, onSignOut)
        else -> CustomerOrderFlow(uid, email, fullName = fullName, firestore, onSignOut)
    }
}

@Composable
private fun OwnerHome(
    uid: String,
    email: String,
    firestore: FirebaseFirestore,
    onSignOut: () -> Unit
) {
    val businessRepository = remember(firestore) { BusinessRepository(firestore) }
    val productRepository = remember(firestore) { ProductRepository(firestore) }
    val orderRepository = remember(firestore) { OrderRepository(firestore) }
    val expenseRepository = remember(firestore) { ExpenseRepository(firestore) }
    val analyticsRepository = remember(firestore) { AnalyticsRepository(firestore) }

    var currentTab by rememberSaveable { mutableIntStateOf(0) }
    var orders by remember { mutableStateOf(emptyList<CustomerOrder>()) }
    var expenses by remember { mutableStateOf(emptyList<Expense>()) }
    var viewCount by remember { mutableStateOf(0) }
    var businesses by remember { mutableStateOf(emptyList<Business>()) }
    var businessesLoaded by remember { mutableStateOf(false) }
    var products by remember { mutableStateOf(emptyList<Product>()) }
    var productsLoaded by remember { mutableStateOf(false) }
    var ordersLoaded by remember { mutableStateOf(false) }
    var editingProduct by remember { mutableStateOf<Product?>(null) }
    var showAddProductDialog by rememberSaveable { mutableStateOf(false) }
    var showAddExpenseDialog by rememberSaveable { mutableStateOf(false) }
    var showEditBusinessDialog by rememberSaveable { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Product tab filter
    var productFilter by rememberSaveable { mutableStateOf("all") }
    // Orders tab filter
    var orderTabSelected by rememberSaveable { mutableIntStateOf(0) }

    DisposableEffect(uid, businessRepository) {
        val registration = businessRepository.listenForOwner(uid) { result ->
            result.onSuccess { businesses = it; businessesLoaded = true }
                .onFailure { errorMessage = "Bizneslarni yuklab bo'lmadi."; businessesLoaded = true }
        }
        onDispose { registration.remove() }
    }

    val business = businesses.firstOrNull { it.status == "approved" }
        ?: businesses.firstOrNull { it.status == "pending" }
        ?: businesses.firstOrNull { it.status == "rejected" }
        ?: if (uid.startsWith("guest")) com.example.dasturxon.data.demo.DemoData.businesses.first() else null

    val effectiveProducts = remember(products, business?.id, uid) {
        if (uid.startsWith("guest") || products.isEmpty()) {
            val demoProds = com.example.dasturxon.data.demo.DemoData.products.filter { it.businessId == (business?.id ?: "demo_bakery_baraka") }
            (demoProds + products).distinctBy { it.id }
        } else products
    }

    val effectiveOrders = remember(orders, uid) {
        if (uid.startsWith("guest") || orders.isEmpty()) {
            listOf(
                CustomerOrder(
                    id = "demo_order_2715",
                    customerId = "demo_customer_1",
                    businessId = business?.id ?: "demo_bakery_baraka",
                    businessName = business?.name ?: "Baraka novvoyxonasi",
                    productName = "Tandir non va somsa",
                    productId = "demo_prod_tandir_non",
                    quantity = 4,
                    totalPrice = 36000,
                    status = "preparing",
                    pickupTime = Timestamp(Date(System.currentTimeMillis() + 1800000)),
                    createdAt = Timestamp(Date(System.currentTimeMillis() - 900000))
                ),
                CustomerOrder(
                    id = "demo_order_2698",
                    customerId = "demo_customer_1",
                    businessId = business?.id ?: "demo_bakery_baraka",
                    businessName = business?.name ?: "Baraka novvoyxonasi",
                    productName = "Tandir non - 2 dona",
                    productId = "demo_prod_tandir_non",
                    quantity = 2,
                    totalPrice = 25000,
                    status = "done",
                    pickupTime = Timestamp(Date(System.currentTimeMillis() - 86400000)),
                    createdAt = Timestamp(Date(System.currentTimeMillis() - 86400000 - 3600000))
                )
            ) + orders
        } else orders
    }

    DisposableEffect(business?.id, productRepository) {
        if (business?.status != "approved") {
            products = emptyList()
            productsLoaded = true
            onDispose { }
        } else {
            productsLoaded = false
            val registration = productRepository.listenForBusiness(business.id) { result ->
                result.onSuccess { products = it; productsLoaded = true }
                    .onFailure { errorMessage = "Mahsulotlarni yuklab bo'lmadi."; productsLoaded = true }
            }
            onDispose { registration.remove() }
        }
    }

    DisposableEffect(business?.id, orderRepository) {
        if (business?.status != "approved") {
            orders = emptyList()
            ordersLoaded = true
            onDispose { }
        } else {
            ordersLoaded = false
            val registration = orderRepository.listenForBusiness(business.id) { result ->
                result.onSuccess { orders = it; ordersLoaded = true }
                    .onFailure { errorMessage = "Buyurtmalarni yuklab bo'lmadi."; ordersLoaded = true }
            }
            onDispose { registration.remove() }
        }
    }

    DisposableEffect(business?.id, analyticsRepository) {
        if (business?.status != "approved") {
            viewCount = 0
            onDispose { }
        } else {
            val registration = analyticsRepository.listenViewCount(business.id) { result ->
                result.onSuccess { viewCount = it }
                    .onFailure { errorMessage = it.localizedMessage ?: "Ko'rishlar sonini yuklab bo'lmadi." }
            }
            onDispose { registration.remove() }
        }
    }

    DisposableEffect(business?.id) {
        val bId = business?.id
        if (business?.status == "approved" && bId != null && !uid.startsWith("guest")) {
            val registration = firestore.collection("expenses")
                .whereEqualTo("businessId", bId)
                .addSnapshotListener { snapshot, error ->
                    if (error == null && snapshot != null) {
                        expenses = snapshot.documents.map { Expense.fromDocument(it.id, it.data.orEmpty()) }
                    }
                }
            onDispose { registration.remove() }
        } else {
            onDispose { }
        }
    }

    val effectiveExpenses = remember(expenses, business?.id, uid) {
        if (uid.startsWith("guest") && expenses.isEmpty()) {
            listOf(
                Expense(
                    id = "demo_exp_1",
                    businessId = business?.id ?: "demo_bakery_baraka",
                    title = "Oliy navli un (10 qop)",
                    amount = 3500000L,
                    category = "Xomashyo",
                    createdAt = Timestamp(Date(System.currentTimeMillis() - 86400000L * 2))
                ),
                Expense(
                    id = "demo_exp_2",
                    businessId = business?.id ?: "demo_bakery_baraka",
                    title = "Elektr energiyasi to'lovi",
                    amount = 850000L,
                    category = "Kommunal",
                    createdAt = Timestamp(Date(System.currentTimeMillis() - 86400000L * 5))
                )
            )
        } else expenses
    }

    // If business is not yet approved or not yet created:
    if (business == null || business.status != "approved") {
        DxScaffold(
            topBar = { DxTopBar(showLogo = true) }
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                PageHeader(title = "Biznes paneli", email = email, onSignOut = onSignOut)

                errorMessage?.let {
                    Text(it, color = MaterialTheme.colorScheme.error)
                }

                when (business?.status) {
                    "pending" -> {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("⏳ Tasdiq kutilmoqda", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text("Biznes nomi: ${business.name}")
                                Text("Manzil: ${business.address}")
                                Text("Telefon: ${business.phone}")
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Profilingiz administrator tasdig'ini kutmoqda. Tasdiqlangach, barcha boshqaruv va mahsulot qo'shish imkoniyatlari ochiladi.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                    "rejected" -> {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("❌ Profil rad etildi", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onErrorContainer)
                                Text("Sabab: ${business.rejectionReason ?: "ko'rsatilmagan"}", color = MaterialTheme.colorScheme.onErrorContainer)
                                Text("Iltimos, ma'lumotlarni to'g'rilab, qayta yuboring.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onErrorContainer)
                            }
                        }
                        BusinessEditor(
                            ownerId = uid,
                            existingBusiness = business,
                            repository = businessRepository,
                            onError = { errorMessage = it },
                            onSuccess = { errorMessage = "Biznes qayta ko'rib chiqish uchun yuborildi." }
                        )
                    }
                    else -> {
                        if (!businessesLoaded) {
                            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        } else {
                            Text("Biznes profilingizni yarating", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            BusinessEditor(
                                ownerId = uid,
                                repository = businessRepository,
                                onError = { errorMessage = it },
                                onSuccess = { errorMessage = "Biznes administrator tasdig'iga yuborildi." }
                            )
                        }
                    }
                }
            }
        }
        return
    }

    // APPROVED BUSINESS: Full 5-tab owner interface
    DxScaffold(
        topBar = {
            DxTopBar(
                showLogo = true,
                actions = {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Text(
                            text = business.name,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentTab == 0,
                    onClick = { currentTab = 0 },
                    icon = { Text("📊") },
                    label = { Text(stringResource(R.string.nav_dashboard)) }
                )
                NavigationBarItem(
                    selected = currentTab == 1,
                    onClick = { currentTab = 1 },
                    icon = { Text("📦") },
                    label = { Text(stringResource(R.string.nav_products)) }
                )
                NavigationBarItem(
                    selected = currentTab == 2,
                    onClick = { currentTab = 2 },
                    icon = { Text("📋") },
                    label = { Text(stringResource(R.string.nav_orders)) }
                )
                NavigationBarItem(
                    selected = currentTab == 3,
                    onClick = { currentTab = 3 },
                    icon = { Text("📈") },
                    label = { Text(stringResource(R.string.nav_analytics)) }
                )
                NavigationBarItem(
                    selected = currentTab == 4,
                    onClick = { currentTab = 4 },
                    icon = { Text("👤") },
                    label = { Text(stringResource(R.string.nav_profile)) }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentTab) {
                // TAB 0: Boshqaruv (Dashboard)
                0 -> {
                    val completedRevenue = remember(effectiveOrders) {
                        effectiveOrders.filter { it.status == "done" }.sumOf { it.totalPrice }
                    }
                    val activeOrdersCount = remember(effectiveOrders) {
                        effectiveOrders.count { it.status in listOf("new", "accepted", "ready") }
                    }
                    val lowStockCount = remember(effectiveProducts) {
                        effectiveProducts.count { (it.stock ?: Long.MAX_VALUE) < 5 }
                    }
                    val pendingOrders = remember(effectiveOrders) {
                        effectiveOrders.filter { it.status == "new" }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Spacer(Modifier.height(4.dp))
                        SectionHeader(title = "Boshqaruv paneli")

                        errorMessage?.let {
                            Text(it, color = MaterialTheme.colorScheme.error)
                        }

                        // 4 KPI Cards
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard(
                                title = "Jami buyurtmalar",
                                value = "${effectiveOrders.size} ta",
                                modifier = Modifier.weight(1f)
                            )
                            KpiCard(
                                title = "Jami tushum",
                                value = MoneyFormatter.formatSoM(completedRevenue),
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard(
                                title = "Faol buyurtmalar",
                                value = "$activeOrdersCount ta",
                                modifier = Modifier.weight(1f)
                            )
                            KpiCard(
                                title = "Kam qolgan mahsulot",
                                value = "$lowStockCount ta",
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // "Diqqat talab qiladi" section
                        if (pendingOrders.isNotEmpty()) {
                            SectionHeader(title = "Diqqat talab qiladi (${pendingOrders.size})")
                            pendingOrders.forEach { order ->
                                OrderCard(order = order, ownerActions = true) { nextStatus ->
                                    orderRepository.updateStatus(order.id, nextStatus) { result ->
                                        result.onFailure { errorMessage = it.localizedMessage ?: "Buyurtma yangilanmadi." }
                                    }
                                }
                            }
                        }

                        // Quick actions
                        SectionHeader(title = "Tezkor amallar")
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = { showAddProductDialog = true },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("➕ Mahsulot")
                            }
                            OutlinedButton(
                                onClick = { currentTab = 2 },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("📋 Buyurtmalar")
                            }
                            OutlinedButton(
                                onClick = { currentTab = 3 },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("📈 Tahlil")
                            }
                        }

                        Spacer(Modifier.height(16.dp))
                    }
                }

                // TAB 1: Mahsulotlar (Products)
                1 -> {
                    val filteredProducts = remember(effectiveProducts, productFilter) {
                        when (productFilter) {
                            "available" -> effectiveProducts.filter { it.status == "available" }
                            "hot_ready" -> effectiveProducts.filter { it.status == "hot_ready" }
                            "sold_out" -> effectiveProducts.filter { it.status == "sold_out" }
                            "discount" -> effectiveProducts.filter { it.discountPercent > 0 }
                            else -> effectiveProducts
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Spacer(Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Mahsulotlar (${effectiveProducts.size})", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            Button(
                                onClick = { showAddProductDialog = true },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("➕ Qo'shish")
                            }
                        }

                        // Filter Chips
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(selected = productFilter == "all", onClick = { productFilter = "all" }, label = { Text("Hammasi") })
                            FilterChip(selected = productFilter == "available", onClick = { productFilter = "available" }, label = { Text("Mavjud") })
                            FilterChip(selected = productFilter == "hot_ready", onClick = { productFilter = "hot_ready" }, label = { Text("● Issiq tayyor") })
                            FilterChip(selected = productFilter == "sold_out", onClick = { productFilter = "sold_out" }, label = { Text("Tugagan") })
                            FilterChip(selected = productFilter == "discount", onClick = { productFilter = "discount" }, label = { Text("Chegirmali") })
                        }

                        errorMessage?.let {
                            Text(it, color = MaterialTheme.colorScheme.error)
                        }

                        if (!productsLoaded && effectiveProducts.isEmpty()) {
                            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        } else if (filteredProducts.isEmpty()) {
                            EmptyState(
                                title = "Mahsulotlar topilmadi",
                                description = "Yangi mahsulot qo'shish uchun yuqoridagi tugmani bosing."
                            )
                        } else {
                            filteredProducts.forEach { product ->
                                ProductCard(
                                    product = product,
                                    onClick = { editingProduct = product },
                                    showOwnerActions = true,
                                    onEditClick = { editingProduct = product },
                                    onDeleteClick = {
                                        productRepository.delete(product.id) { result ->
                                            result.onFailure { errorMessage = it.localizedMessage ?: "Mahsulotni o'chirib bo'lmadi." }
                                        }
                                    },
                                    onStatusChange = { newStatus ->
                                        productRepository.setStatus(product.id, newStatus) { result ->
                                            result.onFailure { errorMessage = it.localizedMessage ?: "Holat o'zgarmadi." }
                                        }
                                    }
                                )
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }
                }

                // TAB 2: Buyurtmalar (Orders)
                2 -> {
                    val filteredOrders = remember(effectiveOrders, orderTabSelected) {
                        when (orderTabSelected) {
                            0 -> effectiveOrders.filter { it.status == "new" }
                            1 -> effectiveOrders.filter { it.status in listOf("accepted", "ready") }
                            else -> effectiveOrders.filter { it.status in listOf("done", "cancelled", "rejected") }
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Spacer(Modifier.height(4.dp))
                        PrimaryTabRow(selectedTabIndex = orderTabSelected) {
                            Tab(
                                selected = orderTabSelected == 0,
                                onClick = { orderTabSelected = 0 },
                                text = { Text("Yangi (${effectiveOrders.count { it.status == "new" }})") }
                            )
                            Tab(
                                selected = orderTabSelected == 1,
                                onClick = { orderTabSelected = 1 },
                                text = { Text("Jarayonda (${effectiveOrders.count { it.status in listOf("accepted", "ready") }})") }
                            )
                            Tab(
                                selected = orderTabSelected == 2,
                                onClick = { orderTabSelected = 2 },
                                text = { Text("Tarix (${effectiveOrders.count { it.status in listOf("done", "cancelled", "rejected") }})") }
                            )
                        }

                        errorMessage?.let {
                            Text(it, color = MaterialTheme.colorScheme.error)
                        }

                        if (!ordersLoaded) {
                            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        } else if (filteredOrders.isEmpty()) {
                            EmptyState(
                                title = "Buyurtmalar yo'q",
                                description = when (orderTabSelected) {
                                    0 -> "Yangi buyurtmalar kelganda shu yerda ko'rinadi."
                                    1 -> "Ayni paytda tayyorlanayotgan buyurtmalar yo'q."
                                    else -> "Tugallangan buyurtmalar tarixi bo'sh."
                                }
                            )
                        } else {
                            filteredOrders.forEach { order ->
                                OrderCard(order = order, ownerActions = true) { nextStatus ->
                                    orderRepository.updateStatus(order.id, nextStatus) { result ->
                                        result.onFailure { errorMessage = it.localizedMessage ?: "Buyurtma yangilanmadi." }
                                    }
                                }
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }
                }

                // TAB 3: Analitika (Analytics)
                3 -> {
                    val completedOrders = remember(orders) { orders.filter { it.status == "done" } }
                    val totalRevenue = remember(completedOrders) { completedOrders.sumOf { it.totalPrice } }
                    val avgCheck = remember(completedOrders) {
                        if (completedOrders.isNotEmpty()) totalRevenue / completedOrders.size else 0L
                    }

                    val popularProduct = remember(orders) {
                        orders.groupBy { it.productName }
                            .maxByOrNull { (_, list) -> list.sumOf { it.quantity } }
                            ?.key ?: "—"
                    }

                    // Status distribution for donut chart
                    val statusCounts = remember(orders) {
                        val done = orders.count { it.status == "done" }.toFloat()
                        val inProgress = orders.count { it.status in listOf("new", "accepted", "ready") }.toFloat()
                        val cancelled = orders.count { it.status in listOf("cancelled", "rejected") }.toFloat()
                        listOf(done, inProgress, cancelled)
                    }

                    // Revenue chart data (mock spark/line from orders)
                    val chartData = remember(orders) {
                        if (orders.isEmpty()) listOf(1f, 2f, 1f, 3f)
                        else orders.take(7).map { it.totalPrice.toFloat() }.ifEmpty { listOf(1f, 2f, 1f, 3f) }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Spacer(Modifier.height(4.dp))
                        SectionHeader(title = "Biznes Tahlili")

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard(
                                title = "Jami daromad",
                                value = MoneyFormatter.formatSoM(totalRevenue),
                                modifier = Modifier.weight(1f)
                            )
                            KpiCard(
                                title = "O'rtacha chek",
                                value = MoneyFormatter.formatSoM(avgCheck),
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard(
                                title = "Ko'rishlar soni",
                                value = "$viewCount marta",
                                modifier = Modifier.weight(1f)
                            )
                            KpiCard(
                                title = "Top mahsulot",
                                value = popularProduct,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // Line chart of orders revenue
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Tushum grafigi", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                LineChart(data = chartData)
                            }
                        }

                        // Donut chart of status
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(
                                    "Buyurtmalar holati taqsimoti",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.align(Alignment.Start)
                                )
                                DonutChart(
                                    values = statusCounts,
                                    colors = listOf(
                                        Color(0xFF4C7A2B), // Completed Green
                                        Color(0xFF0F7C84), // In progress Turquoise
                                        Color(0xFFBA1A1A)  // Cancelled Red
                                    )
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceAround
                                ) {
                                    Text("🟢 Yakunlandi: ${statusCounts[0].toInt()}")
                                    Text("🔵 Jarayonda: ${statusCounts[1].toInt()}")
                                    Text("🔴 Bekor: ${statusCounts[2].toInt()}")
                                }
                            }
                        }

                        // Expenses Section
                        SectionHeader(
                            title = "Biznes xarajatlari",
                            actionLabel = "+ Qo'shish",
                            onAction = { showAddExpenseDialog = true }
                        )

                        if (effectiveExpenses.isEmpty()) {
                            Text(
                                text = "Hozircha xarajatlar mavjud emas. '+ Qo'shish' tugmasi orqali kiriting.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            effectiveExpenses.take(5).forEach { exp ->
                                ExpenseCard(
                                    expense = exp,
                                    onDelete = {
                                        expenseRepository.delete(exp.id) { result ->
                                            result.onFailure { errorMessage = it.localizedMessage ?: "Xarajatni o'chirib bo'lmadi." }
                                        }
                                    }
                                )
                            }
                        }

                        Spacer(Modifier.height(16.dp))
                    }
                }

                // TAB 4: Profil (Profile)
                4 -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    ShopAvatar(name = business.name, size = 56)
                                    Spacer(Modifier.width(16.dp))
                                    Column {
                                        Text(business.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                        val bType = BusinessType.fromStoredValue(business.type)
                                        Text("${bType.icon} ${stringResource(bType.labelRes)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                                    }
                                }
                                Spacer(Modifier.height(4.dp))
                                Text("📍 Manzil: ${business.address}")
                                Text("📞 Telefon: ${business.phone}")
                                Surface(
                                    color = MaterialTheme.colorScheme.tertiaryContainer,
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = "✓ Tasdiqlangan biznes",
                                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        OutlinedButton(
                            onClick = { showEditBusinessDialog = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Biznes ma'lumotlarini tahrirlash")
                        }

                        Spacer(Modifier.height(16.dp))

                        Button(
                            onClick = onSignOut,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Chiqish")
                        }
                    }
                }
            }
        }
    }

    // Add product dialog
    if (showAddProductDialog) {
        AlertDialog(
            onDismissRequest = { showAddProductDialog = false },
            title = { Text("Yangi mahsulot qo'shish", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ProductEditor(
                        business = business,
                        productRepository = productRepository,
                        onError = { errorMessage = it },
                        onSuccess = {
                            showAddProductDialog = false
                            errorMessage = "Mahsulot muvaffaqiyatli qo'shildi."
                        }
                    )
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showAddProductDialog = false }) {
                    Text("Yopish")
                }
            }
        )
    }

    // Edit business dialog
    if (showEditBusinessDialog) {
        AlertDialog(
            onDismissRequest = { showEditBusinessDialog = false },
            title = { Text("Biznesni tahrirlash", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    BusinessEditor(
                        ownerId = uid,
                        existingBusiness = business,
                        repository = businessRepository,
                        onError = { errorMessage = it },
                        onSuccess = {
                            showEditBusinessDialog = false
                            errorMessage = "Biznes ma'lumotlari yangilandi."
                        }
                    )
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showEditBusinessDialog = false }) {
                    Text("Yopish")
                }
            }
        )
    }

    // Edit product dialog
    editingProduct?.let { product ->
        ProductEditDialog(
            product = product,
            onDismiss = { editingProduct = null },
            onSave = { name, description, price, stock, discount, endAt, costPrice ->
                productRepository.updateProduct(product, name, description, price, stock, discount, endAt, costPrice) { result ->
                    result.onSuccess { editingProduct = null }
                        .onFailure { errorMessage = it.localizedMessage ?: "Mahsulotni yangilab bo'lmadi." }
                }
            },
            onDelete = {
                productRepository.delete(product.id) { result ->
                    result.onSuccess { editingProduct = null }
                        .onFailure { errorMessage = it.localizedMessage ?: "Mahsulotni o'chirib bo'lmadi." }
                }
            }
        )
    }

    // Add expense dialog
    if (showAddExpenseDialog) {
        AddExpenseDialog(
            onDismiss = { showAddExpenseDialog = false },
            onSubmit = { title, amount, category ->
                if (business != null) {
                    expenseRepository.create(business.id, title, amount, category) { result ->
                        result.onSuccess {
                            showAddExpenseDialog = false
                        }.onFailure {
                            errorMessage = it.localizedMessage ?: "Xarajatni saqlab bo'lmadi."
                        }
                    }
                }
            }
        )
    }
}

@Composable
private fun AdminHome(
    email: String,
    firestore: FirebaseFirestore,
    onSignOut: () -> Unit
) {
    val repository = remember(firestore) { BusinessRepository(firestore) }
    var currentTab by rememberSaveable { mutableIntStateOf(0) }
    var pendingBusinesses by remember { mutableStateOf(emptyList<Business>()) }
    var allBusinesses by remember { mutableStateOf(emptyList<Business>()) }
    var businessesLoaded by remember { mutableStateOf(false) }
    var rejectionTarget by remember { mutableStateOf<Business?>(null) }
    var rejectionReason by rememberSaveable { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    DisposableEffect(repository) {
        val reg1 = repository.listenPending { result ->
            result.onSuccess { pendingBusinesses = it; businessesLoaded = true }
                .onFailure { errorMessage = "Bizneslarni yuklab bo'lmadi."; businessesLoaded = true }
        }
        val reg2 = repository.listenAll { result ->
            result.onSuccess { allBusinesses = it }
        }
        onDispose {
            reg1.remove()
            reg2.remove()
        }
    }

    DxScaffold(
        topBar = {
            DxTopBar(
                showLogo = true,
                actions = {
                    Surface(
                        color = MaterialTheme.colorScheme.tertiaryContainer,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Text(
                            text = "Admin",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onTertiaryContainer,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentTab == 0,
                    onClick = { currentTab = 0 },
                    icon = { Text("📊") },
                    label = { Text(stringResource(R.string.nav_overview)) }
                )
                NavigationBarItem(
                    selected = currentTab == 1,
                    onClick = { currentTab = 1 },
                    icon = { Text("✅") },
                    label = { Text(stringResource(R.string.nav_approvals)) }
                )
                NavigationBarItem(
                    selected = currentTab == 2,
                    onClick = { currentTab = 2 },
                    icon = { Text("🏢") },
                    label = { Text(stringResource(R.string.nav_businesses)) }
                )
                NavigationBarItem(
                    selected = currentTab == 3,
                    onClick = { currentTab = 3 },
                    icon = { Text("👤") },
                    label = { Text(stringResource(R.string.nav_profile)) }
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when (currentTab) {
                // TAB 0: Umumiy (Overview)
                0 -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        SectionHeader(title = "Tizim umumiy statistikasi")
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard(
                                title = "Jami bizneslar",
                                value = "${allBusinesses.size} ta",
                                modifier = Modifier.weight(1f)
                            )
                            KpiCard(
                                title = "Tasdiq kutayotgan",
                                value = "${pendingBusinesses.size} ta",
                                modifier = Modifier.weight(1f)
                            )
                        }

                        val approvedCount = allBusinesses.count { it.status == "approved" }
                        val rejectedCount = allBusinesses.count { it.status == "rejected" }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard(
                                title = "Tasdiqlangan",
                                value = "$approvedCount ta",
                                modifier = Modifier.weight(1f)
                            )
                            KpiCard(
                                title = "Rad etilgan",
                                value = "$rejectedCount ta",
                                modifier = Modifier.weight(1f)
                            )
                        }

                        if (pendingBusinesses.isNotEmpty()) {
                            SectionHeader(title = "Tezkor tasdiqlar")
                            Button(
                                onClick = { currentTab = 1 },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Tasdiq kutayotgan bizneslarni ko'rish (${pendingBusinesses.size})")
                            }
                        }
                    }
                }

                // TAB 1: Tasdiqlar (Approvals)
                1 -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        SectionHeader(title = "Tasdiq kutayotgan bizneslar (${pendingBusinesses.size})")
                        errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }

                        if (!businessesLoaded) {
                            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator()
                            }
                        } else if (pendingBusinesses.isEmpty()) {
                            EmptyState(
                                title = "Hozircha arizalar yo'q",
                                description = "Yangi bizneslar ro'yxatdan o'tganda shu yerda ko'rinadi."
                            )
                        } else {
                            pendingBusinesses.forEach { business ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(business.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                        val businessType = BusinessType.fromStoredValue(business.type)
                                        Text(
                                            stringResource(
                                                R.string.business_type_display,
                                                "${businessType.icon} ${stringResource(businessType.labelRes)}"
                                            ),
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                        business.typeNote?.takeIf(String::isNotBlank)?.let { note ->
                                            Text(stringResource(R.string.business_type_note_display, note), style = MaterialTheme.typography.bodySmall)
                                        }
                                        Text("Manzil: ${business.address}", style = MaterialTheme.typography.bodyMedium)
                                        Text("Telefon: ${business.phone}", style = MaterialTheme.typography.bodyMedium)
                                        Spacer(Modifier.height(4.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Button(
                                                onClick = {
                                                    repository.setStatus(business.id, "approved") { result ->
                                                        result.onFailure { errorMessage = it.localizedMessage ?: "Tasdiqlash amalga oshmadi." }
                                                    }
                                                },
                                                shape = RoundedCornerShape(10.dp)
                                            ) {
                                                Text("Tasdiqlash")
                                            }
                                            OutlinedButton(
                                                onClick = {
                                                    rejectionTarget = business
                                                    rejectionReason = ""
                                                },
                                                shape = RoundedCornerShape(10.dp)
                                            ) {
                                                Text("Rad etish")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 2: Bizneslar (All Businesses)
                2 -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        SectionHeader(title = "Barcha bizneslar (${allBusinesses.size})")

                        allBusinesses.forEach { business ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    ShopAvatar(name = business.name, size = 48)
                                    Spacer(Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(business.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                        Text(business.address, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text(business.phone, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                                    }
                                    Surface(
                                        color = when (business.status) {
                                            "approved" -> MaterialTheme.colorScheme.tertiaryContainer
                                            "rejected" -> MaterialTheme.colorScheme.errorContainer
                                            else -> MaterialTheme.colorScheme.primaryContainer
                                        },
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            text = when (business.status) {
                                                "approved" -> "Tasdiqlangan"
                                                "rejected" -> "Rad etilgan"
                                                else -> "Kutilmoqda"
                                            },
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 3: Profil (Profile)
                3 -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                ShopAvatar(name = email, size = 64)
                                Spacer(Modifier.height(12.dp))
                                Text(email, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(4.dp))
                                Surface(
                                    color = MaterialTheme.colorScheme.tertiaryContainer,
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(
                                        text = "Tizim Administratori",
                                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        Button(
                            onClick = onSignOut,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Chiqish")
                        }
                    }
                }
            }
        }
    }

    rejectionTarget?.let { business ->
        AlertDialog(
            onDismissRequest = { rejectionTarget = null },
            title = { Text("Biznesni rad etish") },
            text = {
                OutlinedTextField(
                    value = rejectionReason,
                    onValueChange = { rejectionReason = it.take(500) },
                    label = { Text("Rad etish sababi") },
                    supportingText = { Text("Kamida 3 belgi") }
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val reason = rejectionReason.trim()
                        if (reason.length >= 3) {
                            repository.setStatus(business.id, "rejected", reason) { result ->
                                result.onSuccess { rejectionTarget = null }
                                    .onFailure { errorMessage = "Biznesni rad etib bo'lmadi." }
                            }
                        } else errorMessage = "Rad etish sababini kiriting."
                    },
                    enabled = rejectionReason.trim().length >= 3
                ) {
                    Text("Rad etish")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { rejectionTarget = null }) {
                    Text("Bekor qilish")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BusinessEditor(
    ownerId: String,
    existingBusiness: Business? = null,
    repository: BusinessRepository,
    onError: (String) -> Unit,
    onSuccess: () -> Unit
) {
    var name by rememberSaveable(existingBusiness?.id) { mutableStateOf(existingBusiness?.name.orEmpty()) }
    var address by rememberSaveable(existingBusiness?.id) { mutableStateOf(existingBusiness?.address.orEmpty()) }
    var phone by rememberSaveable(existingBusiness?.id) { mutableStateOf(existingBusiness?.phone.orEmpty()) }
    var typeValue by rememberSaveable(existingBusiness?.id) {
        mutableStateOf(existingBusiness?.type ?: BusinessType.BAKERY.storedValue)
    }
    var typeWasChanged by rememberSaveable(existingBusiness?.id) { mutableStateOf(false) }
    var typeNote by rememberSaveable(existingBusiness?.id) { mutableStateOf(existingBusiness?.typeNote.orEmpty()) }
    var typeMenuExpanded by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    val selectedType = BusinessType.fromStoredValue(typeValue)
    val nameRequired = stringResource(R.string.business_name_required)
    val addressRequired = stringResource(R.string.business_address_required)
    val phoneRequired = stringResource(R.string.business_phone_required)
    val typeNoteRequired = stringResource(R.string.business_type_note_required)
    val saveFailed = stringResource(R.string.business_save_failed)

    OutlinedTextField(
        value = name,
        onValueChange = { name = it },
        label = { Text(stringResource(R.string.business_name_field)) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true
    )
    Spacer(Modifier.height(8.dp))
    ExposedDropdownMenuBox(
        expanded = typeMenuExpanded,
        onExpandedChange = { typeMenuExpanded = it },
        modifier = Modifier.fillMaxWidth()
    ) {
        OutlinedTextField(
            value = stringResource(selectedType.labelRes),
            onValueChange = {},
            readOnly = true,
            label = { Text(stringResource(R.string.business_type_field)) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = typeMenuExpanded) },
            modifier = Modifier.menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable).fillMaxWidth()
        )
        ExposedDropdownMenu(
            expanded = typeMenuExpanded,
            onDismissRequest = { typeMenuExpanded = false }
        ) {
            BusinessType.ordered.forEach { type ->
                DropdownMenuItem(
                    text = { Text(stringResource(type.labelRes)) },
                    onClick = {
                        typeValue = type.storedValue
                        typeWasChanged = true
                        if (type != BusinessType.OTHER) typeNote = ""
                        typeMenuExpanded = false
                    }
                )
            }
        }
    }
    if (selectedType == BusinessType.OTHER) {
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = typeNote,
            onValueChange = { typeNote = it.take(40) },
            label = { Text(stringResource(R.string.business_type_note_field)) },
            supportingText = { Text(stringResource(R.string.business_type_note_hint)) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
    }
    Spacer(Modifier.height(8.dp))
    OutlinedTextField(
        value = address,
        onValueChange = { address = it },
        label = { Text(stringResource(R.string.business_address_field)) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true
    )
    Spacer(Modifier.height(8.dp))
    OutlinedTextField(
        value = phone,
        onValueChange = { phone = it },
        label = { Text(stringResource(R.string.business_phone_field)) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true
    )
    Spacer(Modifier.height(12.dp))
    Button(
        onClick = {
            when {
                name.isBlank() -> onError(nameRequired)
                address.isBlank() -> onError(addressRequired)
                phone.isBlank() -> onError(phoneRequired)
                selectedType == BusinessType.OTHER && typeNote.trim().length !in 3..40 ->
                    onError(typeNoteRequired)
                else -> {
                    saving = true
                    val completed: (Result<Unit>) -> Unit = { result ->
                        saving = false
                        result.onSuccess { onSuccess() }
                            .onFailure { onError(saveFailed) }
                    }
                    val isUnknownLegacyType = existingBusiness != null &&
                        BusinessType.fromStoredValue(existingBusiness.type) == BusinessType.OTHER &&
                        BusinessType.ordered.none { it.storedValue == existingBusiness.type } &&
                        !typeWasChanged
                    val typeToSave = if (isUnknownLegacyType) existingBusiness.type else selectedType.storedValue
                    val noteToSave = typeNote.trim().takeIf { selectedType == BusinessType.OTHER }
                    if (existingBusiness == null) {
                        repository.create(
                            ownerId,
                            name.trim(),
                            typeToSave,
                            address.trim(),
                            phone.trim(),
                            completed,
                            typeNote = noteToSave
                        )
                    } else {
                        repository.resubmit(
                            existingBusiness.id,
                            name.trim(),
                            typeToSave,
                            address.trim(),
                            phone.trim(),
                            completed,
                            typeNote = noteToSave
                        )
                    }
                }
            }
        },
        enabled = !saving,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            if (saving) stringResource(R.string.business_saving)
            else stringResource(R.string.business_submit)
        )
    }
}

@Composable
private fun ProductEditor(
    business: Business,
    productRepository: ProductRepository,
    onError: (String) -> Unit,
    onSuccess: () -> Unit
) {
    var name by rememberSaveable(business.id) { mutableStateOf("") }
    var description by rememberSaveable(business.id) { mutableStateOf("") }
    var priceText by rememberSaveable(business.id) { mutableStateOf("") }
    var costPriceText by rememberSaveable(business.id) { mutableStateOf("") }
    var stockText by rememberSaveable(business.id) { mutableStateOf("") }
    var discountText by rememberSaveable(business.id) { mutableStateOf("0") }
    var discountEndMillis by rememberSaveable(business.id) { mutableStateOf<Long?>(null) }
    var imageBase64 by rememberSaveable(business.id) { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            try {
                val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ImageDecoder.decodeBitmap(ImageDecoder.createSource(context.contentResolver, uri))
                } else {
                    @Suppress("DEPRECATION")
                    MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
                }
                val maxDimension = 600
                val ratio = bitmap.width.toFloat() / bitmap.height.toFloat()
                val targetWidth = if (ratio > 1) maxDimension else (maxDimension * ratio).toInt().coerceAtLeast(1)
                val targetHeight = if (ratio > 1) (maxDimension / ratio).toInt().coerceAtLeast(1) else maxDimension
                val scaled = Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
                val stream = ByteArrayOutputStream()
                scaled.compress(Bitmap.CompressFormat.JPEG, 75, stream)
                imageBase64 = Base64.encodeToString(stream.toByteArray(), Base64.DEFAULT)
            } catch (_: Exception) {
                onError("Rasmni yuklashda xatolik yuz berdi.")
            }
        }
    }

    OutlinedTextField(name, { name = it }, label = { Text("Mahsulot nomi") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
    OutlinedTextField(description, { description = it }, label = { Text("Tavsif (ixtiyoriy)") }, modifier = Modifier.fillMaxWidth())
    OutlinedTextField(priceText, { priceText = it.filter(Char::isDigit) }, label = { Text("Sotish narxi (so'm)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
    OutlinedTextField(costPriceText, { costPriceText = it.filter(Char::isDigit) }, label = { Text("Tannarxi (so'm, ixtiyoriy)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
    OutlinedTextField(stockText, { stockText = it.filter(Char::isDigit) }, label = { Text("Mavjud zaxira (dona)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
    OutlinedTextField(discountText, { discountText = it.filter(Char::isDigit) }, label = { Text("Chegirma foizi (0–90)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)

    if (imageBase64.isNotBlank()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
            if (bmp != null) {
                Image(
                    bitmap = bmp,
                    contentDescription = "Mahsulot rasmi",
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
            }
            TextButton(onClick = { imageBase64 = "" }) {
                Text("Rasmni olib tashlash", color = MaterialTheme.colorScheme.error)
            }
        }
    } else {
        OutlinedButton(
            onClick = {
                imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("📷 Rasm tanlash (ixtiyoriy)")
        }
    }

    OutlinedButton(
        onClick = {
            val calendar = Calendar.getInstance().apply {
                timeInMillis = discountEndMillis ?: System.currentTimeMillis()
            }
            DatePickerDialog(
                context,
                { _, year, month, day ->
                    calendar.set(year, month, day, 23, 59, 59)
                    discountEndMillis = calendar.timeInMillis
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        },
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            discountEndMillis?.let { "Chegirma tugashi: ${Date(it)}" }
                ?: "Chegirma tugash sanasini tanlash"
        )
    }

    Spacer(Modifier.height(8.dp))
    Button(
        onClick = {
            val price = priceText.toLongOrNull()
            val costPrice = costPriceText.toLongOrNull() ?: 0L
            val stock = stockText.takeIf(String::isNotBlank)?.toLongOrNull()
            val discount = discountText.toLongOrNull()
            when {
                name.isBlank() -> onError("Mahsulot nomini kiriting.")
                price == null || price <= 0L -> onError("Narx 0 dan katta butun son bo'lsin.")
                stockText.isNotBlank() && (stock == null || stock < 0L) -> onError("Zaxira sonini tekshiring.")
                discount == null || discount !in 0L..90L -> onError("Chegirma 0 dan 90 foizgacha bo'lishi kerak.")
                else -> {
                    saving = true
                    productRepository.create(
                        business = business,
                        name = name.trim(),
                        description = description.trim(),
                        price = price,
                        stock = stock,
                        discountPercent = discount,
                        discountEndsAt = discountEndMillis?.let { Timestamp(Date(it)) },
                        costPrice = costPrice,
                        image = imageBase64
                    ) { result ->
                        saving = false
                        result.onSuccess {
                            name = ""
                            description = ""
                            priceText = ""
                            costPriceText = ""
                            stockText = ""
                            discountText = "0"
                            discountEndMillis = null
                            imageBase64 = ""
                            onSuccess()
                        }.onFailure { onError(it.localizedMessage ?: "Mahsulotni saqlab bo'lmadi.") }
                    }
                }
            }
        },
        enabled = !saving,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(if (saving) "Saqlanmoqda..." else "Mahsulotni saqlash")
    }
}

@Composable
internal fun PageHeader(
    title: String,
    email: String,
    onSignOut: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        OutlinedButton(onClick = onSignOut) { Text("Chiqish") }
    }
}
