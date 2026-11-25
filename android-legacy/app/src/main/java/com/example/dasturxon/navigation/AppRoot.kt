package com.example.dasturxon.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.dasturxon.core.designsystem.DxScaffold
import com.example.dasturxon.core.designsystem.DxTopBar

data class BottomNavItem(
    val route: Route,
    val label: String,
    val icon: String
)

val CustomerBottomNavItems = listOf(
    BottomNavItem(Route.CustomerHome, "Bosh sahifa", "🏠"),
    BottomNavItem(Route.CustomerShops, "Do'konlar", "🏪"),
    BottomNavItem(Route.CustomerOrders, "Buyurtmalar", "📋"),
    BottomNavItem(Route.CustomerProfile, "Siz", "👤")
)

val OwnerBottomNavItems = listOf(
    BottomNavItem(Route.OwnerDashboard, "Boshqaruv", "📊"),
    BottomNavItem(Route.OwnerProducts, "Mahsulotlar", "📦"),
    BottomNavItem(Route.OwnerOrders, "Buyurtmalar", "📋"),
    BottomNavItem(Route.OwnerAnalytics, "Analitika", "📈"),
    BottomNavItem(Route.OwnerProfile, "Profil", "👤")
)

val AdminBottomNavItems = listOf(
    BottomNavItem(Route.AdminOverview, "Umumiy", "📊"),
    BottomNavItem(Route.AdminApprovals, "Tasdiqlar", "✅"),
    BottomNavItem(Route.AdminBusinesses, "Bizneslar", "🏢"),
    BottomNavItem(Route.AdminProfile, "Profil", "👤")
)

@Composable
fun AppRoot(
    sessionState: SessionState,
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController()
) {
    when (sessionState) {
        is SessionState.Loading -> {
            // Splash / Loading
        }
        is SessionState.SignedOut, is SessionState.NeedsEmailVerification -> {
            AuthGraph(navController = navController, modifier = modifier)
        }
        is SessionState.SignedIn -> {
            when (sessionState.role) {
                "owner" -> OwnerGraph(navController = navController, modifier = modifier)
                "admin" -> AdminGraph(navController = navController, modifier = modifier)
                else -> CustomerGraph(navController = navController, modifier = modifier)
            }
        }
    }
}

@Composable
fun CustomerGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    DxScaffold(
        modifier = modifier,
        topBar = { DxTopBar(showLogo = true) },
        bottomBar = {
            NavigationBar {
                CustomerBottomNavItems.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute?.contains(item.route::class.simpleName.orEmpty()) == true,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Text(item.icon) },
                        label = { Text(item.label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Route.CustomerHome,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable<Route.CustomerHome> { Text("Bosh sahifa (Customer Home)") }
            composable<Route.CustomerShops> { Text("Do'konlar (Shops)") }
            composable<Route.CustomerOrders> { Text("Buyurtmalar (Orders)") }
            composable<Route.CustomerProfile> { Text("Siz (Profile)") }
        }
    }
}

@Composable
fun OwnerGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    DxScaffold(
        modifier = modifier,
        topBar = { DxTopBar(showLogo = true) },
        bottomBar = {
            NavigationBar {
                OwnerBottomNavItems.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute?.contains(item.route::class.simpleName.orEmpty()) == true,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Text(item.icon) },
                        label = { Text(item.label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Route.OwnerDashboard,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable<Route.OwnerDashboard> { Text("Boshqaruv (Owner Dashboard)") }
            composable<Route.OwnerProducts> { Text("Mahsulotlar (Owner Products)") }
            composable<Route.OwnerOrders> { Text("Buyurtmalar (Owner Orders)") }
            composable<Route.OwnerAnalytics> { Text("Analitika (Owner Analytics)") }
            composable<Route.OwnerProfile> { Text("Profil (Owner Profile)") }
        }
    }
}

@Composable
fun AdminGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    DxScaffold(
        modifier = modifier,
        topBar = { DxTopBar(showLogo = true) },
        bottomBar = {
            NavigationBar {
                AdminBottomNavItems.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute?.contains(item.route::class.simpleName.orEmpty()) == true,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Text(item.icon) },
                        label = { Text(item.label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Route.AdminOverview,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable<Route.AdminOverview> { Text("Umumiy (Admin Overview)") }
            composable<Route.AdminApprovals> { Text("Tasdiqlar (Admin Approvals)") }
            composable<Route.AdminBusinesses> { Text("Bizneslar (Admin Businesses)") }
            composable<Route.AdminProfile> { Text("Profil (Admin Profile)") }
        }
    }
}

@Composable
fun AuthGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Route.Auth,
        modifier = modifier
    ) {
        composable<Route.Auth> { Text("Kirish / Ro'yxatdan o'tish (Auth Screen)") }
        composable<Route.Onboarding> { Text("Onboarding Screen") }
        composable<Route.EmailVerification> { Text("Email Verification Screen") }
    }
}
