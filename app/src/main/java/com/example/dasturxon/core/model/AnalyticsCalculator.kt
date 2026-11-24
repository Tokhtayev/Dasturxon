package com.example.dasturxon.core.model

import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.data.model.Expense
import com.example.dasturxon.data.model.Product
import java.time.Clock
import java.time.Instant
import java.time.ZoneId

data class ProductAnalytics(
    val productId: String,
    val productName: String,
    val quantitySold: Long,
    val revenue: Long,
    val cogs: Long,
    val profit: Long,
    val costPrice: Long,
    val sellingPrice: Long
)

data class AnalyticsReport(
    val totalRevenue: Long = 0L,
    val totalOrders: Int = 0,
    val completedOrders: Int = 0,
    val cancelledOrders: Int = 0,
    val inProgressOrders: Int = 0,
    val averageTicket: Long = 0L,
    val completionRate: Float = 0f,
    val totalExpenses: Long = 0L,
    val cogs: Long = 0L,
    val grossProfit: Long = 0L,
    val netProfit: Long = 0L,
    val productStats: List<ProductAnalytics> = emptyList(),
    val bestSellers: List<ProductAnalytics> = emptyList(),
    val mostProfitable: List<ProductAnalytics> = emptyList(),
    val lossMakers: List<ProductAnalytics> = emptyList(),
    val trendPoints: List<Float> = listOf(0f)
)

class AnalyticsCalculator(
    private val clock: Clock = Clock.system(ZoneId.of("Asia/Tashkent")),
    private val zoneId: ZoneId = ZoneId.of("Asia/Tashkent")
) {

    @Suppress("UNCHECKED_CAST")
    fun calculate(
        orders: List<*>,
        start: Instant = Instant.MIN,
        end: Instant = Instant.MAX
    ): AnalyticsReport {
        val typedOrders = orders.filterIsInstance<CustomerOrder>()
        return calculate(
            orders = typedOrders,
            expenses = emptyList(),
            products = emptyList(),
            start = start,
            end = end
        )
    }

    fun calculate(
        orders: List<CustomerOrder>,
        expenses: List<Expense> = emptyList(),
        products: List<Product> = emptyList(),
        start: Instant = Instant.MIN,
        end: Instant = Instant.MAX
    ): AnalyticsReport {
        // Filter orders in period
        val periodOrders = orders.filter { order ->
            val orderInstant = order.createdAt?.toDate()?.toInstant()
                ?: order.pickupTime?.toDate()?.toInstant()
            if (orderInstant == null) true
            else orderInstant in start..end
        }

        // Filter expenses in period
        val periodExpenses = expenses.filter { expense ->
            val expInstant = expense.createdAt.toDate().toInstant()
            expInstant in start..end
        }

        val totalOrders = periodOrders.size
        val completedList = periodOrders.filter { it.status == "done" }
        val cancelledList = periodOrders.filter { it.status in listOf("cancelled", "rejected") }
        val inProgressList = periodOrders.filter { it.status in listOf("new", "accepted", "preparing", "ready") }

        val completedCount = completedList.size
        val cancelledCount = cancelledList.size
        val inProgressCount = inProgressList.size

        val totalRevenue = completedList.sumOf { it.totalPrice }
        val averageTicket = if (completedCount > 0) totalRevenue / completedCount else 0L
        val completionRate = if (totalOrders > 0) completedCount.toFloat() / totalOrders else 0f

        val totalExpenses = periodExpenses.sumOf { it.amount }

        // Map product cost prices and prices
        val productCostMap = products.associateBy({ it.id }, { it.costPrice })
        val productPriceMap = products.associateBy({ it.id }, { it.price })

        // Product stats based on completed orders
        val productOrderGroups = completedList.groupBy { it.productId.ifBlank { it.productName } }
        val productStats = productOrderGroups.map { (key, pOrders) ->
            val pName = pOrders.firstOrNull()?.productName ?: key
            val pId = pOrders.firstOrNull()?.productId ?: key
            val qty = pOrders.sumOf { it.quantity }
            val rev = pOrders.sumOf { it.totalPrice }
            val costPerUnit = productCostMap[pId] ?: 0L
            val sellingPerUnit = productPriceMap[pId] ?: (if (qty > 0) rev / qty else 0L)
            val pCogs = costPerUnit * qty
            val pProfit = rev - pCogs

            ProductAnalytics(
                productId = pId,
                productName = pName,
                quantitySold = qty,
                revenue = rev,
                cogs = pCogs,
                profit = pProfit,
                costPrice = costPerUnit,
                sellingPrice = sellingPerUnit
            )
        }

        val cogs = productStats.sumOf { it.cogs }
        val grossProfit = totalRevenue - cogs
        val netProfit = grossProfit - totalExpenses

        val bestSellers = productStats.sortedByDescending { it.quantitySold }
        val mostProfitable = productStats.filter { it.profit > 0 }.sortedByDescending { it.profit }
        val lossMakers = productStats.filter { it.profit < 0 || (it.costPrice > it.sellingPrice && it.costPrice > 0) }

        // Trend points for LineChart
        val trendPoints = if (completedList.isNotEmpty()) {
            val sorted = completedList.sortedBy { it.createdAt?.toDate()?.time ?: 0L }
            sorted.map { (it.totalPrice / 1000f).coerceAtLeast(1f) }
        } else {
            listOf(0f, 0f)
        }

        return AnalyticsReport(
            totalRevenue = totalRevenue,
            totalOrders = totalOrders,
            completedOrders = completedCount,
            cancelledOrders = cancelledCount,
            inProgressOrders = inProgressCount,
            averageTicket = averageTicket,
            completionRate = completionRate,
            totalExpenses = totalExpenses,
            cogs = cogs,
            grossProfit = grossProfit,
            netProfit = netProfit,
            productStats = productStats,
            bestSellers = bestSellers,
            mostProfitable = mostProfitable,
            lossMakers = lossMakers,
            trendPoints = trendPoints
        )
    }
}
