package com.example.dasturxon.data.repository

import android.net.Uri
import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.core.data.repository.ImageStore
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseImageStore @Inject constructor() : ImageStore {
    override suspend fun uploadProductImage(productId: String, imageUri: Uri): AppResult<String> {
        // Free Firebase Spark tier does not support Firebase Storage uploads without cloud billing.
        // As defined in PRD AMENDMENTS: Write upload behind repository interface and mark it BLOCKED.
        return AppResult.Error(
            UnsupportedOperationException("Firebase Storage is BLOCKED on Spark plan")
        )
    }
}
