package com.example.dasturxon.domain

import java.time.Instant
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

const val PAGE_SIZE = 20
private val ORDER_HISTORY_ZONE: ZoneId = ZoneId.of("Asia/Tashkent")

data class OrderHistoryMonthGroup<T>(
    val month: YearMonth?,
    val orders: List<T>
) {
    fun title(locale: Locale): String {
        val value = month ?: return ""
        return value.format(DateTimeFormatter.ofPattern("LLLL yyyy", locale))
            .replaceFirstChar { char -> if (char.isLowerCase()) char.titlecase(locale) else char.toString() }
    }
}

fun <T> groupOrdersByMonth(
    orders: List<T>,
    createdAt: (T) -> Instant?,
    locale: Locale
): List<OrderHistoryMonthGroup<T>> {
    val grouped = linkedMapOf<YearMonth?, MutableList<T>>()
    orders.forEach { order ->
        val month = createdAt(order)
            ?.atZone(ORDER_HISTORY_ZONE)
            ?.let(YearMonth::from)
        grouped.getOrPut(month) { mutableListOf() }.add(order)
    }
    return grouped.map { (month, values) -> OrderHistoryMonthGroup(month, values) }
}

fun <T, K> appendHistoryPage(
    current: List<T>,
    page: List<T>,
    reset: Boolean,
    keyOf: (T) -> K
): List<T> {
    if (reset) return page.distinctBy(keyOf)
    val seen = current.mapTo(mutableSetOf(), keyOf)
    return current + page.filter { seen.add(keyOf(it)) }
}

fun historyHasMore(pageSize: Int): Boolean = pageSize == PAGE_SIZE
