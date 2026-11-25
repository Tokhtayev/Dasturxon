package com.example.dasturxon.data.model

import com.google.firebase.Timestamp
import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Date

class CustomerOrderModelTest {

    @Test
    fun customerOrderModel_deliveryFields_mappedCorrectly() {
        val now = Timestamp.now()
        val order = CustomerOrder(
            id = "ord-1",
            customerId = "cust-1",
            businessId = "biz-1",
            businessName = "Baraka novvoyxonasi",
            productName = "Tandir non",
            quantity = 5,
            totalPrice = 25000L,
            status = "pending",
            pickupTime = now,
            fulfillmentType = "delivery",
            deliveryAddress = "Chilonzor 12-mavze 4-uy",
            customerPhone = "+998901234567",
            customerName = "Ali Valiyev",
            paymentStatus = "paid",
            paidAt = now
        )

        assertEquals("delivery", order.fulfillmentType)
        assertEquals("Chilonzor 12-mavze 4-uy", order.deliveryAddress)
        assertEquals("+998901234567", order.customerPhone)
        assertEquals("Ali Valiyev", order.customerName)
        assertEquals("paid", order.paymentStatus)
        assertEquals(now, order.paidAt)
        assertEquals("pending", order.status)
    }

    @Test
    fun customerOrderFromDocument_mapsFulfillmentAndDefaultsToPickup() {
        val docData = mapOf<String, Any?>(
            "customerId" to "c-100",
            "businessId" to "b-200",
            "businessName" to "Bodomzor",
            "productName" to "Somsa",
            "quantity" to 4L,
            "totalPrice" to 32000L,
            "status" to "accepted"
        )

        val order = CustomerOrder.fromDocument("doc-99", docData)

        assertEquals("pickup", order.fulfillmentType)
        assertEquals("", order.deliveryAddress)
        assertEquals("", order.customerPhone)
        assertEquals("", order.customerName)
        assertEquals("unpaid", order.paymentStatus)
        assertEquals(null, order.paidAt)
    }

    @Test
    fun customerOrderFromDocument_explicitDeliveryData_parsedCorrectly() {
        val docData = mapOf<String, Any?>(
            "customerId" to "c-100",
            "businessId" to "b-200",
            "businessName" to "Bodomzor",
            "productName" to "Somsa",
            "quantity" to 2L,
            "totalPrice" to 16000L,
            "status" to "new",
            "fulfillmentType" to "delivery",
            "deliveryAddress" to "Yunusobod 7-mavze",
            "customerPhone" to "+998935001122",
            "customerName" to "Madina Karimova"
        )

        val order = CustomerOrder.fromDocument("doc-100", docData)

        assertEquals("delivery", order.fulfillmentType)
        assertEquals("Yunusobod 7-mavze", order.deliveryAddress)
        assertEquals("+998935001122", order.customerPhone)
        assertEquals("Madina Karimova", order.customerName)
    }
}
