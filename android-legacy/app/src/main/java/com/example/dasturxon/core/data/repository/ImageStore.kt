package com.example.dasturxon.core.data.repository

import android.net.Uri
import com.example.dasturxon.core.common.AppResult

interface ImageStore {
    suspend fun uploadProductImage(productId: String, imageUri: Uri): AppResult<String>
}
