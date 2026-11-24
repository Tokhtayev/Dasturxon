package com.example.dasturxon.core.model

enum class OrderStatus(val storedValue: String) {
    PENDING("pending"),
    ACCEPTED("accepted"),
    READY("ready"),
    COMPLETED("completed"),
    REJECTED("rejected"),
    CANCELLED("cancelled");

    fun canTransitionTo(newStatus: OrderStatus): Boolean {
        return when (this) {
            PENDING -> newStatus == ACCEPTED || newStatus == REJECTED || newStatus == CANCELLED
            ACCEPTED -> newStatus == READY || newStatus == CANCELLED
            READY -> newStatus == COMPLETED
            COMPLETED, REJECTED, CANCELLED -> false
        }
    }

    val isActive: Boolean
        get() = this == PENDING || this == ACCEPTED || this == READY

    companion object {
        fun fromStoredValue(value: String?): OrderStatus = when (value) {
            "new" -> PENDING
            "done" -> COMPLETED
            else -> entries.firstOrNull { it.storedValue == value } ?: PENDING
        }
    }
}
