package com.example.dasturxon.domain

enum class ProductStatus { AVAILABLE, SOLD_OUT, HOT_READY }

sealed interface ValidationResult {
    data object Ok : ValidationResult
    data class Error(val message: String) : ValidationResult
}

object OrderValidator {
    fun validate(quantity: Int, stock: Int?, status: ProductStatus): ValidationResult {
        if (quantity <= 0) return ValidationResult.Error("Son 1 dan kam bo'lmasin")
        if (status == ProductStatus.SOLD_OUT) return ValidationResult.Error("Mahsulot tugagan")
        if (stock != null && quantity > stock) return ValidationResult.Error("Zaxira yetarli emas")
        return ValidationResult.Ok
    }
}
