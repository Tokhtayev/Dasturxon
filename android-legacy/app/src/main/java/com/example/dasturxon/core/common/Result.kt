package com.example.dasturxon.core.common

sealed class AppResult<out T> {
    data class Success<T>(val data: T) : AppResult<T>()
    data class Error(val exception: Exception) : AppResult<Nothing>()
}

inline fun <T, R> AppResult<T>.fold(
    onSuccess: (T) -> R,
    onError: (Exception) -> R
): R = when (this) {
    is AppResult.Success -> onSuccess(data)
    is AppResult.Error -> onError(exception)
}
