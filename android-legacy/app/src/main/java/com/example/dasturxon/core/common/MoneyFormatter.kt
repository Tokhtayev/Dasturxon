package com.example.dasturxon.core.common

object MoneyFormatter {
    fun formatSoM(amount: Long): String {
        val stringAmount = amount.toString()
        val builder = java.lang.StringBuilder()

        var count = 0
        for (i in stringAmount.length - 1 downTo 0) {
            builder.append(stringAmount[i])
            count++
            if (count % 3 == 0 && i != 0) {
                builder.append(" ")
            }
        }

        return "${builder.reverse()} so'm"
    }
}
