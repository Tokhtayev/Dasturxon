package com.example.dasturxon.core.model

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class OrderStatusTest {
    @Test
    fun `pending can transition to accepted rejected or cancelled`() {
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.ACCEPTED))
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.REJECTED))
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.CANCELLED))
        assertFalse(OrderStatus.PENDING.canTransitionTo(OrderStatus.READY))
        assertFalse(OrderStatus.PENDING.canTransitionTo(OrderStatus.COMPLETED))
    }

    @Test
    fun `accepted can transition to ready or cancelled`() {
        assertTrue(OrderStatus.ACCEPTED.canTransitionTo(OrderStatus.READY))
        assertTrue(OrderStatus.ACCEPTED.canTransitionTo(OrderStatus.CANCELLED))
        assertFalse(OrderStatus.ACCEPTED.canTransitionTo(OrderStatus.COMPLETED))
    }

    @Test
    fun `ready can transition to completed`() {
        assertTrue(OrderStatus.READY.canTransitionTo(OrderStatus.COMPLETED))
        assertFalse(OrderStatus.READY.canTransitionTo(OrderStatus.CANCELLED))
    }
}
