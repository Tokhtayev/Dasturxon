package com.example.dasturxon.domain

import androidx.annotation.StringRes
import com.example.dasturxon.R

enum class BusinessType(
    val storedValue: String,
    @field:StringRes val labelRes: Int,
    val icon: String,
    val sortOrder: Int
) {
    BAKERY("bakery", R.string.business_type_bakery, "🥖", 0),
    CONFECTIONERY("confectionery", R.string.business_type_confectionery, "🍬", 1),
    PASTRY("pastry", R.string.business_type_pastry, "🍰", 2),
    TEAHOUSE("teahouse", R.string.business_type_teahouse, "🍵", 3),
    KITCHEN("kitchen", R.string.business_type_kitchen, "🍲", 4),
    CAFE("cafe", R.string.business_type_cafe, "☕", 5),
    OTHER("other", R.string.business_type_other, "🍽️", 6);

    companion object {
        val ordered: List<BusinessType> = entries.sortedBy(BusinessType::sortOrder)

        fun fromStoredValue(value: String?): BusinessType =
            entries.firstOrNull { it.storedValue == value } ?: OTHER
    }
}
