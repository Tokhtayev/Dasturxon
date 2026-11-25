package com.example.dasturxon.core.common

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.util.Base64
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.roundToInt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Helper for compressing gallery images to compact Base64 strings stored in Firestore
 * and decoding them into Compose [ImageBitmap] instances.
 */
object ProductImageHelper {

    private const val DEFAULT_MAX_DIMENSION_PX = 640
    private const val DEFAULT_TARGET_BYTES = 180 * 1024
    private const val HARD_MAX_BYTES = 450 * 1024

    fun calculateInSampleSize(width: Int, height: Int, maxDim: Int): Int {
        if (width <= 0 || height <= 0 || maxDim <= 0) return 1
        var inSampleSize = 1
        while (max(width / inSampleSize, height / inSampleSize) > maxDim * 2) {
            inSampleSize *= 2
        }
        return inSampleSize
    }

    fun calculateScaledDimensions(width: Int, height: Int, maxDim: Int): Pair<Int, Int> {
        if (width <= 0 || height <= 0 || maxDim <= 0) return 1 to 1
        val largest = max(width, height)
        if (largest <= maxDim) return width to height
        val scale = maxDim.toFloat() / largest.toFloat()
        val targetWidth = (width * scale).roundToInt().coerceAtLeast(1)
        val targetHeight = (height * scale).roundToInt().coerceAtLeast(1)
        return targetWidth to targetHeight
    }

    fun stripDataUriPrefix(raw: String): String {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return ""
        val marker = ";base64,"
        val idx = trimmed.indexOf(marker, ignoreCase = true)
        return if (trimmed.startsWith("data:", ignoreCase = true) && idx != -1) {
            trimmed.substring(idx + marker.length)
        } else {
            trimmed
        }
    }

    fun decodeBase64ToImageBitmap(raw: String): ImageBitmap? {
        val clean = stripDataUriPrefix(raw)
        if (clean.isBlank()) return null
        return try {
            val bytes = Base64.decode(clean, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
        } catch (_: Exception) {
            null
        }
    }

    suspend fun encodeUriToBase64(
        context: Context,
        uri: Uri,
        maxDimensionPx: Int = DEFAULT_MAX_DIMENSION_PX,
        targetBytes: Int = DEFAULT_TARGET_BYTES
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val bitmap = decodeScaledBitmap(context, uri, maxDimensionPx)
                ?: return@withContext Result.failure(IllegalStateException("Tanlangan rasmni ochib bo'lmadi."))

            try {
                val compressedBytes = compressToTargetSize(bitmap, targetBytes)
                if (compressedBytes.size > HARD_MAX_BYTES) {
                    return@withContext Result.failure(
                        IllegalArgumentException("Rasm hajmi juda katta. Kichikroq rasm tanlang.")
                    )
                }
                val base64 = Base64.encodeToString(compressedBytes, Base64.NO_WRAP)
                Result.success(base64)
            } finally {
                if (!bitmap.isRecycled) bitmap.recycle()
            }
        } catch (e: Exception) {
            Result.failure(Exception("Rasmni qayta ishlashda xatolik: ${e.localizedMessage ?: "noma'lum"}", e))
        }
    }

    private fun decodeScaledBitmap(context: Context, uri: Uri, maxDim: Int): Bitmap? {
        val resolver = context.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { stream ->
            BitmapFactory.decodeStream(stream, null, bounds)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && bounds.outWidth > 0 && bounds.outHeight > 0) {
            val (targetW, targetH) = calculateScaledDimensions(bounds.outWidth, bounds.outHeight, maxDim)
            val source = ImageDecoder.createSource(resolver, uri)
            return ImageDecoder.decodeBitmap(source) { decoder, _, _ ->
                decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                decoder.setTargetSize(targetW, targetH)
            }
        }

        val sampleSize = calculateInSampleSize(bounds.outWidth, bounds.outHeight, maxDim)
        val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sampleSize }
        val rawBitmap = resolver.openInputStream(uri)?.use { stream ->
            BitmapFactory.decodeStream(stream, null, decodeOpts)
        } ?: return null

        val (targetW, targetH) = calculateScaledDimensions(rawBitmap.width, rawBitmap.height, maxDim)
        if (targetW == rawBitmap.width && targetH == rawBitmap.height) return rawBitmap

        val scaled = Bitmap.createScaledBitmap(rawBitmap, targetW, targetH, true)
        if (scaled !== rawBitmap && !rawBitmap.isRecycled) {
            rawBitmap.recycle()
        }
        return scaled
    }

    private fun compressToTargetSize(bitmap: Bitmap, targetBytes: Int): ByteArray {
        val out = ByteArrayOutputStream()
        var quality = 82
        while (quality >= 35) {
            out.reset()
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
            if (out.size() <= targetBytes) break
            quality -= 10
        }
        return out.toByteArray()
    }
}
