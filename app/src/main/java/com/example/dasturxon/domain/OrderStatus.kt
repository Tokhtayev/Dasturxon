package com.example.dasturxon.domain

import androidx.annotation.StringRes
import com.example.dasturxon.R

enum class OrderStatusGroup {
    ACTIVE,
    HISTORY
}

enum class OrderStatus(
    val firestoreValue: String,
    val group: OrderStatusGroup,
    @field:StringRes val labelRes: Int,
    val icon: String
) {
    PENDING("new", OrderStatusGroup.ACTIVE, R.string.order_status_pending, "◷"),
    ACCEPTED("accepted", OrderStatusGroup.ACTIVE, R.string.order_status_accepted, "✓"),
    READY("ready", OrderStatusGroup.ACTIVE, R.string.order_status_ready, "✓✓"),
    COMPLETED("done", OrderStatusGroup.HISTORY, R.string.order_status_completed, "✓"),
    REJECTED("rejected", OrderStatusGroup.HISTORY, R.string.order_status_rejected, "!"),
    CANCELLED("cancelled", OrderStatusGroup.HISTORY, R.string.order_status_cancelled, "×");

    companion object {
        fun fromFirestore(value: String): OrderStatus? =
            entries.firstOrNull { it.firestoreValue == value }

        fun firestoreValues(group: OrderStatusGroup): List<String> =
            entries.filter { it.group == group }.map(OrderStatus::firestoreValue)

        val timeline: List<OrderStatus>
            get() = listOf(PENDING, ACCEPTED, READY, COMPLETED)
    }
}
