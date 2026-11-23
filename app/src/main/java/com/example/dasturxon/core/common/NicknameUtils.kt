package com.example.dasturxon.core.common

object NicknameUtils {
    private val NICKNAME_REGEX = Regex("^[a-z0-9_.]{3,20}$")

    fun normalize(nickname: String): String = nickname.trim().lowercase()

    fun isValid(nickname: String): Boolean = normalize(nickname).matches(NICKNAME_REGEX)
}
