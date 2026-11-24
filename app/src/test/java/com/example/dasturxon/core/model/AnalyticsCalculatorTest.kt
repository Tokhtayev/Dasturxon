package com.example.dasturxon.core.model

import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.data.model.Expense
import com.example.dasturxon.data.model.Product
import com.google.firebase.Timestamp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant
import java.util.Date

class AnalyticsCalculatorTest {

    private val calculator = AnalyticsCalculator()

    @Test
    fun `empty orders returns zeroed report`() {
        val report = calculator.calculate(
            orders = emptyList<CustomerOrder>(),
            start = Instant.parse("2026-01-01T00:00:00Z"),
            end = Instant.parse("2026-01-31T23:59:59Z")
        )

        assertEquals(0L, report.totalRevenue)
        assertEquals(0, report.totalOrders)
        assertEquals(0L, report.averageTicket)
        assertEquals(0f, report.completionRate)
        assertEquals(0L, report.grossProfit)
        assertEquals(0L, report.netProfit)
        assertEquals(0L, report.totalExpenses)
    }

    @Test
    fun `calculate revenue uses completed orders only`() {
        val date = Date.from(Instant.parse("2026-01-15T12:00:00Z"))
        val timestamp = Timestamp(date)

        val orders = listOf(
            CustomerOrder(
                id = "o1", customerId = "c1", businessId = "b1", businessName = "Bakery",
                productName = "Non", quantity = 2, totalPrice = 10000L, status = "done",
                pickupTime = timestamp, createdAt = timestamp
            ),
            CustomerOrder(
                id = "o2", customerId = "c2", businessId = "b1", businessName = "Bakery",
                productName = "Somsa", quantity = 3, totalPrice = 24000L, status = "done",
                pickupTime = timestamp, createdAt = timestamp
            ),
            CustomerOrder(
                id = "o3", customerId = "c3", businessId = "b1", businessName = "Bakery",
                productName = "Patir", quantity = 1, totalPrice = 15000L, status = "new", // not completed
                pickupTime = timestamp, createdAt = timestamp
            ),
            CustomerOrder(
                id = "o4", customerId = "c4", businessId = "b1", businessName = "Bakery",
                productName = "Chuchvara", quantity = 2, totalPrice = 30000L, status = "cancelled", // cancelled
                pickupTime = timestamp, createdAt = timestamp
            )
        )

        val report = calculator.calculate(
            orders = orders,
            start = Instant.parse("2026-01-01T00:00:00Z"),
            end = Instant.parse("2026-01-31T23:59:59Z")
        )

        // Only o1 (10000) and o2 (24000) should be included in revenue = 34000
        assertEquals(34000L, report.totalRevenue)
        assertEquals(4, report.totalOrders)
        assertEquals(2, report.completedOrders)
        assertEquals(1, report.cancelledOrders)
        assertEquals(1, report.inProgressOrders)
        assertEquals(17000L, report.averageTicket) // 34000 / 2
        assertEquals(0.5f, report.completionRate, 0.001f) // 2 / 4
    }

    @Test
    fun `calculate gross profit and net profit with product costs and expenses`() {
        val date = Date.from(Instant.parse("2026-01-15T12:00:00Z"))
        val timestamp = Timestamp(date)

        val products = listOf(
            Product(
                id = "p-non", businessId = "b1", businessName = "Bakery", businessType = "bakery",
                businessAddress = "", businessPhone = "", name = "Non", description = "",
                price = 5000L, status = "available", stock = 10L, discountPercent = 0L, discountEndsAt = null,
                costPrice = 3000L // cost = 3000, margin = 2000
            ),
            Product(
                id = "p-somsa", businessId = "b1", businessName = "Bakery", businessType = "bakery",
                businessAddress = "", businessPhone = "", name = "Somsa", description = "",
                price = 8000L, status = "available", stock = 20L, discountPercent = 0L, discountEndsAt = null,
                costPrice = 5000L // cost = 5000, margin = 3000
            )
        )

        val orders = listOf(
            // 4 non: revenue = 20000, cost = 12000, profit = 8000
            CustomerOrder(
                id = "o1", customerId = "c1", businessId = "b1", businessName = "Bakery",
                productId = "p-non", productName = "Non", quantity = 4, totalPrice = 20000L, status = "done",
                pickupTime = timestamp, createdAt = timestamp
            ),
            // 2 somsa: revenue = 16000, cost = 10000, profit = 6000
            CustomerOrder(
                id = "o2", customerId = "c2", businessId = "b1", businessName = "Bakery",
                productId = "p-somsa", productName = "Somsa", quantity = 2, totalPrice = 16000L, status = "done",
                pickupTime = timestamp, createdAt = timestamp
            )
        )

        val expenses = listOf(
            Expense(
                id = "e1", businessId = "b1", title = "Elektr energiyasi", amount = 5000L,
                category = "Kommunal", createdAt = timestamp
            )
        )

        val report = calculator.calculate(
            orders = orders,
            expenses = expenses,
            products = products,
            start = Instant.parse("2026-01-01T00:00:00Z"),
            end = Instant.parse("2026-01-31T23:59:59Z")
        )

        // Revenue = 20000 + 16000 = 36000
        assertEquals(36000L, report.totalRevenue)
        // COGS = 12000 + 10000 = 22000
        assertEquals(22000L, report.cogs)
        // Gross Profit = 36000 - 22000 = 14000
        assertEquals(14000L, report.grossProfit)
        // Total Expenses = 5000
        assertEquals(5000L, report.totalExpenses)
        // Net Profit = Gross Profit - Expenses = 14000 - 5000 = 9000
        assertEquals(9000L, report.netProfit)
    }

    @Test
    fun `identify best sellers most profitable and loss making products`() {
        val date = Date.from(Instant.parse("2026-01-15T12:00:00Z"))
        val timestamp = Timestamp(date)

        val products = listOf(
            Product(
                id = "p-profitable", businessId = "b1", businessName = "Bakery", businessType = "bakery",
                businessAddress = "", businessPhone = "", name = "Shirinlik", description = "",
                price = 20000L, status = "available", stock = 10L, discountPercent = 0L, discountEndsAt = null,
                costPrice = 8000L // profit = 12000 per item
            ),
            Product(
                id = "p-bestseller", businessId = "b1", businessName = "Bakery", businessType = "bakery",
                businessAddress = "", businessPhone = "", name = "Non", description = "",
                price = 4000L, status = "available", stock = 100L, discountPercent = 0L, discountEndsAt = null,
                costPrice = 2500L
            ),
            Product(
                id = "p-lossmaker", businessId = "b1", businessName = "Bakery", businessType = "bakery",
                businessAddress = "", businessPhone = "", name = "Eksperiment Mahsulot", description = "",
                price = 5000L, status = "available", stock = 5L, discountPercent = 0L, discountEndsAt = null,
                costPrice = 7000L // selling 5000, cost 7000 -> LOSS OF 2000
            )
        )

        val orders = listOf(
            // 20 Non sold
            CustomerOrder(
                id = "o1", customerId = "c1", businessId = "b1", businessName = "Bakery",
                productId = "p-bestseller", productName = "Non", quantity = 20, totalPrice = 80000L, status = "done",
                pickupTime = timestamp, createdAt = timestamp
            ),
            // 3 Shirinlik sold
            CustomerOrder(
                id = "o2", customerId = "c2", businessId = "b1", businessName = "Bakery",
                productId = "p-profitable", productName = "Shirinlik", quantity = 3, totalPrice = 60000L, status = "done",
                pickupTime = timestamp, createdAt = timestamp
            ),
            // 2 Lossmaker sold
            CustomerOrder(
                id = "o3", customerId = "c3", businessId = "b1", businessName = "Bakery",
                productId = "p-lossmaker", productName = "Eksperiment Mahsulot", quantity = 2, totalPrice = 10000L, status = "done",
                pickupTime = timestamp, createdAt = timestamp
            )
        )

        val report = calculator.calculate(
            orders = orders,
            products = products,
            start = Instant.parse("2026-01-01T00:00:00Z"),
            end = Instant.parse("2026-01-31T23:59:59Z")
        )

        // Best seller should be "Non" (20 items)
        assertEquals("p-bestseller", report.bestSellers.first().productId)
        assertEquals(20L, report.bestSellers.first().quantitySold)

        // Most profitable should be "Shirinlik" (profit = 60000 - 24000 = 36000) vs Non (profit = 80000 - 50000 = 30000)
        assertEquals("p-profitable", report.mostProfitable.first().productId)
        assertEquals(36000L, report.mostProfitable.first().profit)

        // Loss maker should identify "Eksperiment Mahsulot" (cost 14000, revenue 10000, profit = -4000)
        assertEquals(1, report.lossMakers.size)
        assertEquals("p-lossmaker", report.lossMakers.first().productId)
        assertEquals(-4000L, report.lossMakers.first().profit)
    }

    @Test
    fun `date filtering isolates orders inside selected range`() {
        val janDate = Date.from(Instant.parse("2026-01-10T10:00:00Z"))
        val febDate = Date.from(Instant.parse("2026-02-10T10:00:00Z"))

        val orders = listOf(
            CustomerOrder(
                id = "o-jan", customerId = "c1", businessId = "b1", businessName = "Bakery",
                productName = "Non", quantity = 1, totalPrice = 5000L, status = "done",
                pickupTime = Timestamp(janDate), createdAt = Timestamp(janDate)
            ),
            CustomerOrder(
                id = "o-feb", customerId = "c2", businessId = "b1", businessName = "Bakery",
                productName = "Non", quantity = 1, totalPrice = 5000L, status = "done",
                pickupTime = Timestamp(febDate), createdAt = Timestamp(febDate)
            )
        )

        val janReport = calculator.calculate(
            orders = orders,
            start = Instant.parse("2026-01-01T00:00:00Z"),
            end = Instant.parse("2026-01-31T23:59:59Z")
        )

        assertEquals(1, janReport.totalOrders)
        assertEquals(5000L, janReport.totalRevenue)
    }

    @Test
    fun `revenue calculation strictly requires paymentStatus paid for completed orders dated by paidAt`() {
        val paidDate = Date.from(Instant.parse("2026-01-20T10:00:00Z"))
        val unpaidDate = Date.from(Instant.parse("2026-01-20T10:00:00Z"))

        val orders = listOf(
            // Completed and paid -> counted in revenue
            CustomerOrder(
                id = "o-paid", customerId = "c1", businessId = "b1", businessName = "Bakery",
                productName = "Non", quantity = 2, totalPrice = 10000L, status = "completed",
                paymentStatus = "paid", paidAt = Timestamp(paidDate),
                pickupTime = Timestamp(paidDate), createdAt = Timestamp(paidDate)
            ),
            // Completed but unpaid -> NOT counted in revenue
            CustomerOrder(
                id = "o-unpaid", customerId = "c2", businessId = "b1", businessName = "Bakery",
                productName = "Somsa", quantity = 1, totalPrice = 8000L, status = "completed",
                paymentStatus = "unpaid", paidAt = null,
                pickupTime = Timestamp(unpaidDate), createdAt = Timestamp(unpaidDate)
            )
        )

        val report = calculator.calculate(
            orders = orders,
            start = Instant.parse("2026-01-01T00:00:00Z"),
            end = Instant.parse("2026-01-31T23:59:59Z")
        )

        assertEquals(10000L, report.totalRevenue)
        assertEquals(1, report.completedOrders)
    }

    @Test
    fun `startOfWeek returns Monday in Asia Tashkent timezone`() {
        // 2026-01-21 is a Wednesday
        val wednesday = Instant.parse("2026-01-21T14:30:00Z")
        val mondayStart = calculator.startOfWeek(wednesday)

        // Monday is 2026-01-19. In Asia/Tashkent (UTC+5), 2026-01-19 00:00:00 is 2026-01-18 19:00:00 UTC
        val expectedMondayUtc = Instant.parse("2026-01-18T19:00:00Z")
        assertEquals(expectedMondayUtc, mondayStart)
    }
}
