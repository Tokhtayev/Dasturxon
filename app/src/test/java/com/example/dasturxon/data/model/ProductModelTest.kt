package com.example.dasturxon.data.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ProductModelTest {

    @Test
    fun productModel_costPriceAndSellingPrice_defaultAndMappedCorrectly() {
        val product = Product(
            id = "p1",
            businessId = "b1",
            businessName = "Baraka",
            businessType = "bakery",
            businessAddress = "Chilonzor",
            businessPhone = "+998901234567",
            name = "Non",
            description = "Issiq non",
            price = 5000L,
            status = "available",
            stock = 10L,
            discountPercent = 0L,
            discountEndsAt = null,
            costPrice = 3000L,
            image = "base64data"
        )

        assertEquals(5000L, product.price)
        assertEquals(5000L, product.sellingPrice)
        assertEquals(3000L, product.costPrice)
        assertEquals("base64data", product.image)
        assertEquals("base64data", product.imageUrl)
    }

    @Test
    fun productFromDocument_mapsAllFieldsCorrectlyWithFallbacks() {
        val docData = mapOf<String, Any?>(
            "businessId" to "b1",
            "businessName" to "Baraka",
            "businessType" to "bakery",
            "businessAddress" to "Chilonzor",
            "businessPhone" to "+998901234567",
            "name" to "Patir non",
            "description" to "Sariyog'li",
            "price" to 12000L,
            "costPrice" to 7000L,
            "image" to "img_sample_base64",
            "status" to "hot_ready",
            "stock" to 15L,
            "discountPercent" to 10L
        )

        val product = Product.fromDocument("prod_123", docData)

        assertEquals("prod_123", product.id)
        assertEquals("b1", product.businessId)
        assertEquals("Patir non", product.name)
        assertEquals(12000L, product.price)
        assertEquals(12000L, product.sellingPrice)
        assertEquals(7000L, product.costPrice)
        assertEquals("img_sample_base64", product.image)
        assertEquals("hot_ready", product.status)
        assertEquals(15L, product.stock)
        assertEquals(10L, product.discountPercent)
        assertNull(product.discountEndsAt)
    }

    @Test
    fun productFromDocument_missingCostPriceAndImage_defaultsSafely() {
        val docData = mapOf<String, Any?>(
            "name" to "Oddiy non",
            "sellingPrice" to 4000L
        )

        val product = Product.fromDocument("prod_456", docData)

        assertEquals("Oddiy non", product.name)
        assertEquals(4000L, product.price)
        assertEquals(4000L, product.sellingPrice)
        assertEquals(0L, product.costPrice)
        assertEquals("", product.image)
        assertEquals("", product.imageUrl)
        assertEquals("available", product.status)
    }
}
