package com.example.dasturxon.core.data.repository

import android.graphics.Bitmap
import com.example.dasturxon.core.common.AppResult

interface ImageStore {
    suspend fun compressAndEncodeImage(bitmap: Bitmap): AppResult<String>
    suspend fun decodeImage(base64String: String): AppResult<Bitmap>
}
