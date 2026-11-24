package com.example.dasturxon.data.repository

import android.app.Activity
import com.example.dasturxon.core.common.AppResult
import com.google.firebase.auth.PhoneAuthProvider
import kotlinx.coroutines.flow.Flow

data class UserProfile(
    val uid: String,
    val fullName: String,
    val normalizedNickname: String,
    val email: String,
    val phone: String,
    val role: String,
    val createdAt: Long = System.currentTimeMillis()
)

sealed class AuthSessionState {
    data object Loading : AuthSessionState()
    data object SignedOut : AuthSessionState()
    data class Ready(val profile: UserProfile) : AuthSessionState()
    data class ProfileMissing(val uid: String, val email: String) : AuthSessionState()
    data class Error(val message: String) : AuthSessionState()
}

sealed class PhoneVerificationState {
    data object Idle : PhoneVerificationState()
    data object CodeSent : PhoneVerificationState()
    data class CodeSentDetails(val verificationId: String, val resendToken: PhoneAuthProvider.ForceResendingToken?) : PhoneVerificationState()
    data class Verified(val uid: String) : PhoneVerificationState()
    data class Error(val message: String) : PhoneVerificationState()
}

interface AuthRepository {
    fun observeAuthState(): Flow<UserProfile?>
    fun observeSessionState(): Flow<AuthSessionState>
    suspend fun getProfile(uid: String): AppResult<UserProfile?>
    suspend fun signUpWithEmail(
        nickname: String,
        email: String,
        password: String,
        role: String
    ): AppResult<UserProfile>

    suspend fun signInWithEmail(
        email: String,
        password: String
    ): AppResult<UserProfile>

    suspend fun signInWithEmailOrNickname(
        identifier: String,
        password: String
    ): AppResult<UserProfile>

    suspend fun signInWithGoogleCredential(
        idToken: String,
        selectedRole: String = "customer"
    ): AppResult<UserProfile>

    @Deprecated("Phone sign up is deprecated in favor of email and Google sign-in")
    suspend fun signUpWithPhone(
        nickname: String,
        phone: String,
        password: String,
        role: String
    ): AppResult<UserProfile>

    @Deprecated("Phone verification is deprecated in favor of email and Google sign-in")
    fun startPhoneVerification(
        activity: Activity,
        phoneNumber: String,
        onStateChanged: (PhoneVerificationState) -> Unit
    )

    @Deprecated("Phone verification is deprecated in favor of email and Google sign-in")
    suspend fun verifyPhoneOtpCode(
        verificationId: String,
        code: String,
        selectedRole: String = "customer"
    ): AppResult<UserProfile>

    suspend fun sendPasswordResetEmail(email: String): AppResult<Unit>
    suspend fun signOut()
    suspend fun deleteCurrentAccount(): AppResult<Unit>
}
