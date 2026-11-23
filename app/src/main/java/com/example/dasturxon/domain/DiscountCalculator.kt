package com.example.dasturxon.domain

object DiscountCalculator {
    fun priceAfterDiscount(price: Long, percent: Int): Long {
        require(percent in 0..90) { "Chegirma 0 dan 90 foizgacha bo'lishi kerak." }
        require(price >= 0L) { "Narx manfiy bo'lmasligi kerak." }
        return price - (price * percent / 100L)
    }
}
