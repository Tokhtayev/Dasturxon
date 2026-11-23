package com.example.dasturxon.core.model

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant

class AnalyticsCalculatorTest {
    @Test
    fun `empty orders returns zeroed report`() {
        val calculator = AnalyticsCalculator()
        val report = calculator.calculate(
            orders = emptyList(),
            start = Instant.parse("2026-01-01T00:00:00Z"),
            end = Instant.parse("2026-01-31T23:59:59Z")
        )

        assertEquals(0L, report.totalRevenue)
        assertEquals(0, report.totalOrders)
        assertEquals(0L, report.averageTicket)
        assertEquals(0f, report.completionRate)
    }
}
