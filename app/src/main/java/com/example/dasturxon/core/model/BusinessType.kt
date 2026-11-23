package com.example.dasturxon.core.model

enum class BusinessType(val storedValue: String) {
    BAKERY("bakery"),
    CONFECTIONERY("confectionery"),
    PASTRY("pastry"),
    TEAHOUSE("teahouse"),
    KITCHEN("kitchen"),
    CAFE("cafe"),
    OTHER("other");

    companion object {
        fun fromStoredValue(value: String?): BusinessType {
            return entries.firstOrNull { it.storedValue == value } ?: OTHER
        }
    }
}
