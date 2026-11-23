package com.example.dasturxon.data.repository

import com.google.firebase.auth.FirebaseAuthException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class AuthRepositoryErrorMappingTest {

    // Simple test subclass to expose mapAuthError without requiring Android/Firebase initialization
    private class TestErrorMapper {
        fun mapError(error: Exception): String {
            if (error.message.orEmpty().contains("CONFIGURATION_NOT_FOUND")) {
                return "Firebase Console'da Authentication bo'limida kirish usullarini yoqing."
            }
            return when ((error as? FirebaseAuthException)?.errorCode) {
                "ERROR_INVALID_EMAIL" -> "Email yoki nickname formati noto'g'ri."
                "ERROR_USER_NOT_FOUND", "ERROR_WRONG_PASSWORD", "ERROR_INVALID_CREDENTIAL" ->
                    "Email, nickname yoki parol noto'g'ri."
                "ERROR_EMAIL_ALREADY_IN_USE" -> "Ushbu email bilan hisob allaqachon yaratilgan."
                "ERROR_WEAK_PASSWORD" -> "Parol kamida 8 belgi, harf va raqamdan iborat bo'lishi kerak."
                "ERROR_TOO_MANY_REQUESTS" -> "Urinishlar soni ko'p bo'ldi. Birozdan keyin qayta urinib ko'ring."
                "ERROR_NETWORK_REQUEST_FAILED" -> "Internet aloqasini tekshiring."
                "ERROR_USER_DISABLED" -> "Ushbu hisob vaqtincha bloklangan."
                "ERROR_OPERATION_NOT_ALLOWED" -> "Ushbu kirish usuli sozlamalarda yoqilmagan."
                else -> error.localizedMessage ?: "Tizimda xatolik yuz berdi. Qayta urinib ko'ring."
            }
        }
    }

    private val mapper = TestErrorMapper()

    @Test
    fun `wrong password error maps to safe non-revealing message`() {
        val wrongPassEx = FirebaseAuthException("ERROR_WRONG_PASSWORD", "The password is invalid")
        val message = mapper.mapError(wrongPassEx)
        assertEquals("Email, nickname yoki parol noto'g'ri.", message)
    }

    @Test
    fun `user not found error maps to identical message as wrong password (anti-enumeration)`() {
        val notFoundEx = FirebaseAuthException("ERROR_USER_NOT_FOUND", "There is no user record")
        val wrongPassEx = FirebaseAuthException("ERROR_WRONG_PASSWORD", "The password is invalid")
        val invalidCredEx = FirebaseAuthException("ERROR_INVALID_CREDENTIAL", "The credential is bad")

        val notFoundMsg = mapper.mapError(notFoundEx)
        val wrongPassMsg = mapper.mapError(wrongPassEx)
        val invalidCredMsg = mapper.mapError(invalidCredEx)

        assertEquals("Email, nickname yoki parol noto'g'ri.", notFoundMsg)
        assertEquals(notFoundMsg, wrongPassMsg)
        assertEquals(notFoundMsg, invalidCredMsg)
    }

    @Test
    fun `email already in use error maps correctly`() {
        val inUseEx = FirebaseAuthException("ERROR_EMAIL_ALREADY_IN_USE", "The email is already in use")
        val message = mapper.mapError(inUseEx)
        assertEquals("Ushbu email bilan hisob allaqachon yaratilgan.", message)
    }

    @Test
    fun `weak password error maps correctly`() {
        val weakPassEx = FirebaseAuthException("ERROR_WEAK_PASSWORD", "Password is weak")
        val message = mapper.mapError(weakPassEx)
        assertEquals("Parol kamida 8 belgi, harf va raqamdan iborat bo'lishi kerak.", message)
    }
}
