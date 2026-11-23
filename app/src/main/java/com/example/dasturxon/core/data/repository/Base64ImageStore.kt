package com.example.dasturxon.core.data.repository

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.LruCache
import com.example.dasturxon.core.common.AppResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class Base64ImageStore @Inject constructor() : ImageStore {

    private val cacheSize = (Runtime.getRuntime().maxMemory() / 1024 / 8).toInt()
    private val memoryCache = object : LruCache<String, Bitmap>(cacheSize) {
        override fun sizeOf(key: String, bitmap: Bitmap): Int {
            return bitmap.byteCount / 1024
        }
    }

    override suspend fun compressAndEncodeImage(bitmap: Bitmap): AppResult<String> = withContext(Dispatchers.IO) {
        try {
            val maxDimension = 600
            val scaledBitmap = if (bitmap.width > maxDimension || bitmap.height > maxDimension) {
                val ratio = bitmap.width.toFloat() / bitmap.height.toFloat()
                val targetWidth: Int
                val targetHeight: Int
                if (ratio > 1) {
                    targetWidth = maxDimension
                    targetHeight = (maxDimension / ratio).toInt()
                } else {
                    targetHeight = maxDimension
                    targetWidth = (maxDimension * ratio).toInt()
                }
                Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
            } else {
                bitmap
            }

            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
            val byteArray = outputStream.toByteArray()
            val encodedString = Base64.encodeToString(byteArray, Base64.DEFAULT)

            memoryCache.put(encodedString, scaledBitmap)

            AppResult.Success(encodedString)
        } catch (e: Exception) {
            AppResult.Error(e)
        }
    }

    override suspend fun decodeImage(base64String: String): AppResult<Bitmap> = withContext(Dispatchers.IO) {
        try {
            val cached = memoryCache.get(base64String)
            if (cached != null) {
                return@withContext AppResult.Success(cached)
            }

            val decodedBytes = Base64.decode(base64String, Base64.DEFAULT)
            val decodedBitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)

            if (decodedBitmap != null) {
                memoryCache.put(base64String, decodedBitmap)
                AppResult.Success(decodedBitmap)
            } else {
                AppResult.Error(IllegalArgumentException("Failed to decode image"))
            }
        } catch (e: Exception) {
            AppResult.Error(e)
        }
    }
}
