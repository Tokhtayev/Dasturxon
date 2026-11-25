package com.example.dasturxon.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DomainValidationTest {
    @Test fun zeroDiscountKeepsPrice() {
        assertEquals(10_000L, DiscountCalculator.priceAfterDiscount(10_000L, 0))
    }

    @Test fun ninetyPercentDiscountIsAllowed() {
        assertEquals(1_000L, DiscountCalculator.priceAfterDiscount(10_000L, 90))
    }

    @Test(expected = IllegalArgumentException::class)
    fun discountAboveNinetyIsRejected() {
        DiscountCalculator.priceAfterDiscount(10_000L, 91)
    }

    @Test(expected = IllegalArgumentException::class)
    fun negativeDiscountIsRejected() {
        DiscountCalculator.priceAfterDiscount(10_000L, -1)
    }

    @Test fun zeroQuantityIsRejected() {
        assertTrue(OrderValidator.validate(0, null, ProductStatus.AVAILABLE) is ValidationResult.Error)
    }

    @Test fun soldOutProductIsRejected() {
        assertEquals(
            ValidationResult.Error("Mahsulot tugagan"),
            OrderValidator.validate(1, 10, ProductStatus.SOLD_OUT)
        )
    }

    @Test fun quantityAboveStockIsRejected() {
        assertEquals(
            ValidationResult.Error("Zaxira yetarli emas"),
            OrderValidator.validate(4, 3, ProductStatus.AVAILABLE)
        )
    }

    @Test fun quantityEqualToStockIsAllowed() {
        assertEquals(ValidationResult.Ok, OrderValidator.validate(3, 3, ProductStatus.AVAILABLE))
    }

    @Test fun invalidEmailsAreRejected() {
        listOf("plain", "a@", "@site.com", "a@site", "a b@site.com").forEach {
            assertFalse(Validators.isValidEmail(it))
        }
    }

    @Test fun passwordRequiresEightCharactersLetterAndDigit() {
        assertFalse(Validators.isStrongPassword("abc1234"))
        assertFalse(Validators.isStrongPassword("abcdefgh"))
        assertTrue(Validators.isStrongPassword("abc12345"))
    }
}
