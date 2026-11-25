package com.example.dasturxon.data.model

import com.google.firebase.Timestamp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import java.util.Date

class ExpenseModelTest {

    @Test
    fun expenseModel_properties_assignedCorrectly() {
        val now = Timestamp.now()
        val expense = Expense(
            id = "exp-1",
            businessId = "biz-1",
            title = "Un xaridi",
            amount = 250000L,
            category = "Xomashyo",
            createdAt = now
        )

        assertEquals("exp-1", expense.id)
        assertEquals("biz-1", expense.businessId)
        assertEquals("Un xaridi", expense.title)
        assertEquals(250000L, expense.amount)
        assertEquals("Xomashyo", expense.category)
        assertEquals(now, expense.createdAt)
    }

    @Test
    fun expenseFromDocument_mapsFieldsCorrectly() {
        val date = Date(1700000000000L)
        val timestamp = Timestamp(date)
        val data = mapOf<String, Any?>(
            "businessId" to "biz-123",
            "title" to "Ijara to'lovi",
            "amount" to 1500000L,
            "category" to "Ijara",
            "createdAt" to timestamp
        )

        val expense = Expense.fromDocument("exp-123", data)

        assertEquals("exp-123", expense.id)
        assertEquals("biz-123", expense.businessId)
        assertEquals("Ijara to'lovi", expense.title)
        assertEquals(1500000L, expense.amount)
        assertEquals("Ijara", expense.category)
        assertEquals(timestamp, expense.createdAt)
    }

    @Test
    fun expenseFromDocument_handlesMissingFieldsGracefully() {
        val data = mapOf<String, Any?>(
            "title" to "Boshqa xarajat"
        )

        val expense = Expense.fromDocument("exp-default", data)

        assertEquals("exp-default", expense.id)
        assertEquals("", expense.businessId)
        assertEquals("Boshqa xarajat", expense.title)
        assertEquals(0L, expense.amount)
        assertEquals("Boshqa", expense.category)
        assertNotNull(expense.createdAt)
    }
}
