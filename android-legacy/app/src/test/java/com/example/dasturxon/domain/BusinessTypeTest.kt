package com.example.dasturxon.domain

import org.junit.Assert.assertEquals
import org.junit.Test

class BusinessTypeTest {
    @Test
    fun knownStoredValuesMapToTheirTypesAndBack() {
        BusinessType.entries.forEach { type ->
            assertEquals(type, BusinessType.fromStoredValue(type.storedValue))
            assertEquals(type.storedValue, BusinessType.fromStoredValue(type.storedValue).storedValue)
        }
    }

    @Test
    fun legacyTypesKeepTheirExistingStoredValues() {
        assertEquals("bakery", BusinessType.BAKERY.storedValue)
        assertEquals("pastry", BusinessType.PASTRY.storedValue)
        assertEquals("teahouse", BusinessType.TEAHOUSE.storedValue)
    }

    @Test
    fun unknownStoredValuesDisplayAsOther() {
        assertEquals(BusinessType.OTHER, BusinessType.fromStoredValue("legacy_food_shop"))
        assertEquals(BusinessType.OTHER, BusinessType.fromStoredValue(null))
    }

    @Test
    fun displayOrderMatchesFoodBusinessOrder() {
        assertEquals(
            listOf(
                BusinessType.BAKERY,
                BusinessType.CONFECTIONERY,
                BusinessType.PASTRY,
                BusinessType.TEAHOUSE,
                BusinessType.KITCHEN,
                BusinessType.CAFE,
                BusinessType.OTHER
            ),
            BusinessType.ordered
        )
    }
}
