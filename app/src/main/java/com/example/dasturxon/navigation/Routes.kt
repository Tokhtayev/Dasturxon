package com.example.dasturxon.navigation

import kotlinx.serialization.Serializable

sealed interface Route {
    @Serializable
    data object Splash : Route
    @Serializable
    data object Onboarding : Route
    @Serializable
    data object Auth : Route
    @Serializable
    data object EmailVerification : Route

    // Customer Graph
    @Serializable
    data object CustomerHome : Route
    @Serializable
    data object CustomerShops : Route
    @Serializable
    data object CustomerOrders : Route
    @Serializable
    data object CustomerProfile : Route

    // Owner Graph
    @Serializable
    data object OwnerDashboard : Route
    @Serializable
    data object OwnerProducts : Route
    @Serializable
    data object OwnerOrders : Route
    @Serializable
    data object OwnerAnalytics : Route
    @Serializable
    data object OwnerProfile : Route

    // Admin Graph
    @Serializable
    data object AdminOverview : Route
    @Serializable
    data object AdminApprovals : Route
    @Serializable
    data object AdminBusinesses : Route
    @Serializable
    data object AdminProfile : Route
}

sealed class SessionState {
    data object Loading : SessionState()
    data object SignedOut : SessionState()
    data object NeedsEmailVerification : SessionState()
    data class SignedIn(
        val uid: String,
        val role: String,
        val businessStatus: String? = null
    ) : SessionState()
}
