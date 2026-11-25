package com.example.dasturxon.domain

import java.time.Instant
import java.time.YearMonth
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class OrderHistoryPagingTest {
    private data class TestOrder(val id: String, val createdAt: Instant?)

    @Test
    fun statusValuesMapToActiveAndHistoryGroups() {
        assertEquals(OrderStatusGroup.ACTIVE, OrderStatus.fromFirestore("new")?.group)
        assertEquals(OrderStatusGroup.ACTIVE, OrderStatus.fromFirestore("accepted")?.group)
        assertEquals(OrderStatusGroup.ACTIVE, OrderStatus.fromFirestore("ready")?.group)
        assertEquals(OrderStatusGroup.HISTORY, OrderStatus.fromFirestore("done")?.group)
        assertEquals(OrderStatusGroup.HISTORY, OrderStatus.fromFirestore("rejected")?.group)
        assertEquals(OrderStatusGroup.HISTORY, OrderStatus.fromFirestore("cancelled")?.group)
        assertNull(OrderStatus.fromFirestore("unexpected"))
    }

    @Test
    fun groupsHistoryByTashkentMonthInInputOrder() {
        val orders = listOf(
            TestOrder("boundary", Instant.parse("2026-10-31T20:30:00Z")),
            TestOrder("same-month", Instant.parse("2026-11-12T08:00:00Z")),
            TestOrder("next-month", Instant.parse("2026-12-01T00:00:00Z"))
        )

        val groups = groupOrdersByMonth(orders, TestOrder::createdAt, Locale.forLanguageTag("uz"))

        assertEquals(2, groups.size)
        assertEquals(YearMonth.of(2026, 11), groups[0].month)
        assertEquals(listOf("boundary", "same-month"), groups[0].orders.map(TestOrder::id))
        assertEquals(YearMonth.of(2026, 12), groups[1].month)
        assertEquals("Noyabr 2026", groups[0].title(Locale.forLanguageTag("uz")))
    }

    @Test
    fun paginationAppendDeduplicatesAndResetReplacesItems() {
        val first = listOf(TestOrder("one", null), TestOrder("two", null))
        val appended = appendHistoryPage(
            current = first,
            page = listOf(TestOrder("two", null), TestOrder("three", null)),
            reset = false,
            keyOf = TestOrder::id
        )
        assertEquals(listOf("one", "two", "three"), appended.map(TestOrder::id))

        val reset = appendHistoryPage(
            current = appended,
            page = listOf(TestOrder("fresh", null)),
            reset = true,
            keyOf = TestOrder::id
        )
        assertEquals(listOf("fresh"), reset.map(TestOrder::id))
    }

    @Test
    fun hasMoreOnlyWhenPageIsFull() {
        assertTrue(historyHasMore(PAGE_SIZE))
        assertFalse(historyHasMore(PAGE_SIZE - 1))
        assertFalse(historyHasMore(0))
    }
}
