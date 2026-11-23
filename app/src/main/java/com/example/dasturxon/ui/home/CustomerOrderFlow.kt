package com.example.dasturxon.ui.home

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.dasturxon.R
import com.example.dasturxon.core.designsystem.*
import com.example.dasturxon.data.demo.DemoData
import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.Product
import com.example.dasturxon.data.repository.AnalyticsRepository
import com.example.dasturxon.data.repository.BusinessRepository
import com.example.dasturxon.data.repository.OrderRepository
import com.example.dasturxon.data.repository.ProductRepository
import com.example.dasturxon.domain.BusinessType
import com.example.dasturxon.ui.customer.CheckoutSheet
import com.example.dasturxon.ui.customer.CustomerProfileScreen
import com.example.dasturxon.ui.customer.ProductDetailScreen
import com.example.dasturxon.ui.customer.ShopDetailScreen
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import java.util.Date

private data class CustomerNavItem(
    val label: String,
    val icon: String
)

private val customerNavItems = listOf(
    CustomerNavItem("Bosh sahifa", "🏠"),
    CustomerNavItem("Do'konlar", "🏪"),
    CustomerNavItem("Buyurtmalar", "🛒"),
    CustomerNavItem("Siz", "👤")
)

@Composable
internal fun CustomerOrderFlow(
    uid: String,
    email: String,
    fullName: String = "",
    firestore: FirebaseFirestore,
    onSignOut: () -> Unit
) {
    val context = LocalContext.current
    val productRepository = remember(firestore) { ProductRepository(firestore) }
    val orderRepository = remember(firestore) { OrderRepository(firestore) }
    val businessRepository = remember(firestore) { BusinessRepository(firestore) }
    val analyticsRepository = remember(firestore) { AnalyticsRepository(firestore) }

    val ordersViewModel: CustomerOrdersViewModel = viewModel(
        key = "customer_orders_$uid",
        factory = remember(firestore, uid) {
            CustomerOrdersViewModelFactory(
                customerId = uid,
                orderRepository = orderRepository,
                businessRepository = businessRepository
            )
        }
    )

    var currentTab by rememberSaveable { mutableIntStateOf(0) }
    var products by remember {
        mutableStateOf(if (uid.startsWith("guest")) DemoData.products else emptyList())
    }
    var businesses by remember {
        mutableStateOf(if (uid.startsWith("guest")) DemoData.businesses else emptyList())
    }
    var productsLoaded by remember { mutableStateOf(uid.startsWith("guest")) }
    var businessesLoaded by remember { mutableStateOf(uid.startsWith("guest")) }
    var loadError by remember { mutableStateOf<String?>(null) }

    // Navigation states
    var selectedProduct by remember { mutableStateOf<Product?>(null) }
    var selectedBusiness by remember { mutableStateOf<Business?>(null) }
    var checkoutProduct by remember { mutableStateOf<Product?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }
    var checkoutError by remember { mutableStateOf<String?>(null) }
    var orderSuccessMsg by remember { mutableStateOf<String?>(null) }

    // Filters
    var businessTypeFilter by rememberSaveable { mutableStateOf("all") }
    var searchQuery by rememberSaveable { mutableStateOf("") }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(orderSuccessMsg) {
        orderSuccessMsg?.let {
            snackbarHostState.showSnackbar(it)
            orderSuccessMsg = null
        }
    }

    // Firestore listeners
    DisposableEffect(productRepository) {
        val listener = productRepository.listenFeed { result ->
            result.onSuccess {
                products = it
                productsLoaded = true
                loadError = null
                if (it.isEmpty()) {
                    DemoData.seedToFirestore(firestore, uid) { _, _ -> }
                }
            }.onFailure {
                loadError = if (uid.startsWith("guest")) null else "Mahsulotlarni yuklab bo'lmadi"
                productsLoaded = true
            }
        }
        onDispose { listener.remove() }
    }

    DisposableEffect(businessRepository) {
        val listener = businessRepository.listenApproved { result ->
            result.onSuccess {
                businesses = it
                businessesLoaded = true
                if (it.isEmpty()) {
                    DemoData.seedToFirestore(firestore, uid) { _, _ -> }
                }
            }.onFailure {
                businessesLoaded = true
            }
        }
        onDispose { listener.remove() }
    }

    // Hardware back button navigation handling
    BackHandler(enabled = selectedProduct != null) {
        selectedProduct = null
    }
    BackHandler(enabled = selectedBusiness != null && selectedProduct == null) {
        selectedBusiness = null
    }
    BackHandler(enabled = currentTab != 0 && selectedProduct == null && selectedBusiness == null) {
        currentTab = 0
    }

    // Use Firestore data combined with DemoData for guest/demo completeness
    val effectiveProducts = remember(products, uid) {
        if (uid.startsWith("guest") || products.isEmpty()) {
            (DemoData.products + products).distinctBy { it.id }
        } else products
    }
    val effectiveBusinesses = remember(businesses, uid) {
        if (uid.startsWith("guest") || businesses.isEmpty()) {
            (DemoData.businesses + businesses).distinctBy { it.id }
        } else businesses
    }

    // --- Screen routing ---

    // Product detail screen
    if (selectedProduct != null && checkoutProduct == null) {
        val businessForProduct = effectiveBusinesses.find { it.id == selectedProduct!!.businessId }
        ProductDetailScreen(
            product = selectedProduct!!,
            business = businessForProduct,
            onBack = { selectedProduct = null },
            onOrderClick = { product ->
                checkoutProduct = product
            },
            onBusinessClick = { business ->
                selectedProduct = null
                selectedBusiness = business
            }
        )
        return
    }

    // Shop detail screen
    if (selectedBusiness != null) {
        val shopProducts = effectiveProducts.filter { it.businessId == selectedBusiness!!.id }
        val hotReadyCount = shopProducts.count { it.status == "hot_ready" }
        ShopDetailScreen(
            business = selectedBusiness!!,
            productCount = shopProducts.size,
            hotReadyCount = hotReadyCount,
            onBack = { selectedBusiness = null },
            onSeeProductsClick = {
                searchQuery = selectedBusiness!!.name
                selectedBusiness = null
                currentTab = 0
            },
            onCallClick = {
                val phone = selectedBusiness!!.phone
                if (phone.isNotBlank()) {
                    context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
                }
            },
            onMapClick = {
                val address = selectedBusiness!!.address
                if (address.isNotBlank()) {
                    val geoUri = Uri.parse("geo:0,0?q=${Uri.encode(address)}")
                    context.startActivity(Intent(Intent.ACTION_VIEW, geoUri))
                }
            }
        )
        return
    }

    // Checkout sheet
    checkoutProduct?.let { product ->
        CheckoutSheet(
            product = product,
            isSubmitting = isSubmitting,
            submitError = checkoutError,
            onDismiss = {
                if (!isSubmitting) {
                    checkoutProduct = null
                    checkoutError = null
                }
            },
            onConfirm = { quantity, pickupTime: Timestamp ->
                val business = effectiveBusinesses.find { it.id == product.businessId } ?: Business(
                    id = product.businessId,
                    ownerId = "",
                    name = product.businessName,
                    type = "",
                    address = product.businessAddress,
                    phone = product.businessPhone,
                    status = "approved"
                )
                isSubmitting = true
                checkoutError = null
                orderRepository.create(uid, business, product, quantity, pickupTime) { result ->
                    isSubmitting = false
                    result.onSuccess {
                        checkoutProduct = null
                        selectedProduct = null
                        currentTab = 2
                        orderSuccessMsg = "Buyurtmangiz muvaffaqiyatli yuborildi! 🎉"
                    }.onFailure { err ->
                        // Automatically seed demo products/business to Firestore and retry order transaction
                        DemoData.seedToFirestore(firestore, uid) { seeded, _ ->
                            if (seeded) {
                                orderRepository.create(uid, business, product, quantity, pickupTime) { retryResult ->
                                    retryResult.onSuccess {
                                        checkoutProduct = null
                                        selectedProduct = null
                                        currentTab = 2
                                        orderSuccessMsg = "Buyurtmangiz muvaffaqiyatli yuborildi! 🎉"
                                    }.onFailure {
                                        checkoutError = it.localizedMessage ?: "Buyurtma yaratilmadi."
                                    }
                                }
                            } else {
                                checkoutError = err.localizedMessage ?: "Buyurtma yaratilmadi. Zaxira yoki tarmoq holatini tekshiring."
                            }
                        }
                    }
                }
            }
        )
    }

    // --- Main Scaffold ---
    DxScaffold(
        topBar = {
            when (currentTab) {
                0 -> DxTopBar(showLogo = true)
                1 -> DxTopBar(title = "Do'konlar")
                2 -> DxTopBar(title = "Buyurtmalarim")
                3 -> DxTopBar(title = "Profil")
            }
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                customerNavItems.forEachIndexed { index, item ->
                    NavigationBarItem(
                        selected = currentTab == index,
                        onClick = { currentTab = index },
                        icon = {
                            Text(
                                text = item.icon,
                                fontSize = 20.sp
                            )
                        },
                        label = { Text(item.label, style = MaterialTheme.typography.labelSmall) }
                    )
                }
            }
        },
        snackbarHostState = snackbarHostState
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            AnimatedContent(
                targetState = currentTab,
                label = "tab_content"
            ) { tab ->
                when (tab) {
                    0 -> CustomerHomeTab(
                        products = effectiveProducts,
                        businesses = effectiveBusinesses,
                        productsLoaded = productsLoaded,
                        loadError = loadError,
                        searchQuery = searchQuery,
                        onSearchChange = { searchQuery = it },
                        businessTypeFilter = businessTypeFilter,
                        onFilterChange = { businessTypeFilter = it },
                        onProductClick = { product ->
                            analyticsRepository.recordView(product.businessId, product.id, uid, "view_product")
                            selectedProduct = product
                        },
                        onOrderClick = { product ->
                            analyticsRepository.recordView(product.businessId, product.id, uid, "view_product")
                            checkoutProduct = product
                        }
                    )
                    1 -> CustomerShopsTab(
                        businesses = effectiveBusinesses,
                        products = effectiveProducts,
                        businessesLoaded = businessesLoaded,
                        searchQuery = searchQuery,
                        onSearchChange = { searchQuery = it },
                        businessTypeFilter = businessTypeFilter,
                        onFilterChange = { businessTypeFilter = it },
                        onBusinessClick = { business -> selectedBusiness = business },
                        onCallClick = { business ->
                            if (business.phone.isNotBlank()) {
                                context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:${business.phone}")))
                            }
                        }
                    )
                    2 -> CustomerOrdersScreen(
                        viewModel = ordersViewModel,
                        modifier = Modifier.fillMaxSize()
                    )
                    3 -> CustomerProfileScreen(
                        email = email,
                        fullName = fullName,
                        onSignOut = onSignOut,
                        onOrdersClick = { currentTab = 2 },
                        onSeedDemoData = {
                            DemoData.seedToFirestore(firestore, uid) { success, msg ->
                                orderSuccessMsg = msg
                            }
                        }
                    )
                }
            }
        }
    }
}

// ─── HOME TAB ────────────────────────────────────────────────────────────────

@Composable
private fun CustomerHomeTab(
    products: List<Product>,
    businesses: List<Business>,
    productsLoaded: Boolean,
    loadError: String?,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    businessTypeFilter: String,
    onFilterChange: (String) -> Unit,
    onProductClick: (Product) -> Unit,
    onOrderClick: (Product) -> Unit
) {
    val filteredProducts = remember(products, businessTypeFilter, searchQuery) {
        products.filter { product ->
            val matchesType = when (businessTypeFilter) {
                "all" -> true
                BusinessType.OTHER.storedValue ->
                    BusinessType.fromStoredValue(product.businessType) == BusinessType.OTHER
                else -> product.businessType == businessTypeFilter
            }
            val matchesQuery = searchQuery.isBlank() ||
                product.name.contains(searchQuery, ignoreCase = true) ||
                product.businessName.contains(searchQuery, ignoreCase = true)
            matchesType && matchesQuery
        }
    }
    val hotReadyProducts = remember(products) { products.filter { it.status == "hot_ready" } }
    val discountedProducts = remember(products) { products.filter { it.discountPercent > 0 } }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 16.dp)
    ) {
        // Search
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                DxSearchField(
                    value = searchQuery,
                    onValueChange = onSearchChange,
                    placeholder = stringResource(R.string.search_hint)
                )

                // Category Chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = businessTypeFilter == "all",
                        onClick = { onFilterChange("all") },
                        label = { Text(stringResource(R.string.customer_filter_all)) }
                    )
                    BusinessType.ordered.forEach { type ->
                        FilterChip(
                            selected = businessTypeFilter == type.storedValue,
                            onClick = { onFilterChange(type.storedValue) },
                            label = { Text("${type.icon} ${stringResource(type.labelRes)}") }
                        )
                    }
                }
            }
        }

        // Error
        loadError?.let { error ->
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        }

        // Loading skeleton
        if (!productsLoaded && products.isEmpty()) {
            items(3) {
                SkeletonItem(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                )
            }
            return@LazyColumn
        }

        // Hot & Ready shelf
        if (hotReadyProducts.isNotEmpty() && searchQuery.isBlank() && businessTypeFilter == "all") {
            item {
                Column(modifier = Modifier.padding(top = 8.dp)) {
                    SectionHeader(
                        title = "● Hozir mavjud",
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(hotReadyProducts, key = { "hot_${it.id}" }) { product ->
                            Box(modifier = Modifier.width(260.dp)) {
                                ProductCard(
                                    product = product,
                                    onClick = { onProductClick(product) },
                                    onOrderClick = { onOrderClick(product) }
                                )
                            }
                        }
                    }
                }
            }
        }

        // Discounts shelf
        if (discountedProducts.isNotEmpty() && searchQuery.isBlank() && businessTypeFilter == "all") {
            item {
                Column(modifier = Modifier.padding(top = 8.dp)) {
                    SectionHeader(
                        title = "🏷️ Chegirmalar",
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(discountedProducts.take(10), key = { "disc_${it.id}" }) { product ->
                            Box(modifier = Modifier.width(260.dp)) {
                                ProductCard(
                                    product = product,
                                    onClick = { onProductClick(product) },
                                    onOrderClick = { onOrderClick(product) }
                                )
                            }
                        }
                    }
                }
            }
        }

        // All products
        item {
            SectionHeader(
                title = if (searchQuery.isBlank() && businessTypeFilter == "all")
                    stringResource(R.string.customer_products)
                else "Natijalar (${filteredProducts.size})",
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )
        }

        if (filteredProducts.isEmpty()) {
            item {
                EmptyState(
                    title = stringResource(R.string.customer_products_empty),
                    description = "Boshqa toifani tanlang yoki qidiruvni o'zgartiring."
                )
            }
        } else {
            items(filteredProducts, key = { it.id }) { product ->
                Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    ProductCard(
                        product = product,
                        onClick = { onProductClick(product) },
                        onOrderClick = { onOrderClick(product) }
                    )
                }
            }
        }
    }
}

// ─── SHOPS TAB ───────────────────────────────────────────────────────────────

@Composable
private fun CustomerShopsTab(
    businesses: List<Business>,
    products: List<Product>,
    businessesLoaded: Boolean,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    businessTypeFilter: String,
    onFilterChange: (String) -> Unit,
    onBusinessClick: (Business) -> Unit,
    onCallClick: (Business) -> Unit
) {
    val filteredBusinesses = remember(businesses, businessTypeFilter, searchQuery) {
        businesses.filter { b ->
            val matchesType = businessTypeFilter == "all" || b.type == businessTypeFilter
            val matchesQuery = searchQuery.isBlank() ||
                b.name.contains(searchQuery, ignoreCase = true) ||
                b.address.contains(searchQuery, ignoreCase = true)
            matchesType && matchesQuery
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 16.dp)
    ) {
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                DxSearchField(
                    value = searchQuery,
                    onValueChange = onSearchChange,
                    placeholder = "Do'kon yoki nonvoyxona qidirish..."
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = businessTypeFilter == "all",
                        onClick = { onFilterChange("all") },
                        label = { Text("Barchasi") }
                    )
                    BusinessType.ordered.forEach { type ->
                        FilterChip(
                            selected = businessTypeFilter == type.storedValue,
                            onClick = { onFilterChange(type.storedValue) },
                            label = { Text("${type.icon} ${stringResource(type.labelRes)}") }
                        )
                    }
                }
            }
        }

        item {
            SectionHeader(
                title = "Mahalliy do'konlar (${filteredBusinesses.size})",
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )
        }

        if (!businessesLoaded && businesses.isEmpty()) {
            items(4) {
                SkeletonItem(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp)
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                )
            }
        } else if (filteredBusinesses.isEmpty()) {
            item {
                EmptyState(
                    title = "Do'konlar topilmadi",
                    description = "Yunusobod hududidagi tasdiqlangan do'konlar ro'yxati bu yerda ko'rinadi."
                )
            }
        } else {
            items(filteredBusinesses, key = { it.id }) { business ->
                val shopProductCount = products.count { it.businessId == business.id }
                val hotReadyCount = products.count { it.businessId == business.id && it.status == "hot_ready" }
                Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    ShopCard(
                        business = business,
                        onClick = { onBusinessClick(business) },
                        onCallClick = if (business.phone.isNotBlank()) {
                            { onCallClick(business) }
                        } else null
                    )
                }
            }
        }
    }
}
