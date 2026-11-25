package com.example.dasturxon.core.data.repository

import android.content.Context
import android.net.Uri
import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.core.common.ProductImageHelper
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class Base64ImageStore @Inject constructor(
    @param:ApplicationContext private val context: Context
) : ImageStore {
    override suspend fun uploadProductImage(productId: String, imageUri: Uri): AppResult<String> {
        return ProductImageHelper.encodeUriToBase64(context, imageUri).fold(
            onSuccess = { base64 -> AppResult.Success(base64) },
            onFailure = { error -> AppResult.Error(error as? Exception ?: Exception(error)) }
        )
    }
}
