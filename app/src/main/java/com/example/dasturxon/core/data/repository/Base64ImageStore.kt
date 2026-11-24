package com.example.dasturxon.core.data.repository

import android.net.Uri
import com.example.dasturxon.core.common.AppResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class Base64ImageStore @Inject constructor() : ImageStore {
    override suspend fun uploadProductImage(productId: String, imageUri: Uri): AppResult<String> {
        return AppResult.Error(UnsupportedOperationException("Firebase Storage is BLOCKED on Spark plan"))
    }
}
