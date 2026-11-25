package com.example.dasturxon.domain

object Validators {
    private val emailPattern = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

    fun isValidEmail(value: String): Boolean = emailPattern.matches(value.trim())

    fun isStrongPassword(value: String): Boolean =
        value.length >= 8 && value.any(Char::isLetter) && value.any(Char::isDigit)
}
