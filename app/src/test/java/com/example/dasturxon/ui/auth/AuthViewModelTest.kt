package com.example.dasturxon.ui.auth

import android.app.Activity
import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.data.repository.AuthRepository
import com.example.dasturxon.data.repository.PhoneVerificationState
import com.example.dasturxon.data.repository.UserProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeRepository: FakeAuthRepository
    private lateinit var viewModel: AuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeRepository = FakeAuthRepository()
        viewModel = AuthViewModel(fakeRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `signUp with duplicate nickname sets error message and does not navigate`() = runTest {
        advanceUntilIdle()

        fakeRepository.existingNicknames.add("alisher_b")

        viewModel.signUpWithEmail(
            nickname = "alisher_b",
            email = "newuser@example.com",
            password = "SecurePassword123",
            isOwner = false
        )
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNull(state.userProfile)
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage!!.contains("allaqachon band"))
    }

    @Test
    fun `signUp rolls back and shows error when profile write fails`() = runTest {
        advanceUntilIdle()

        fakeRepository.failProfileWrite = true

        viewModel.signUpWithEmail(
            nickname = "valid_nick",
            email = "valid@example.com",
            password = "SecurePassword123",
            isOwner = false
        )
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNull(state.userProfile)
        assertNotNull(state.errorMessage)
        assertTrue(fakeRepository.rollbackInvoked)
        assertEquals("Firestore yozishda xatolik yuz berdi. Auth hisobi bekor qilindi.", state.errorMessage)
    }

    @Test
    fun `signIn with wrong password displays generic wrong password error`() = runTest {
        advanceUntilIdle()

        viewModel.signInWithEmailOrNickname("registered@example.com", "WrongPass123")
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNull(state.userProfile)
        assertEquals("Email, nickname yoki parol noto'g'ri.", state.errorMessage)
    }

    @Test
    fun `signIn with nonexistent user returns identical error as wrong password (no email enumeration)`() = runTest {
        advanceUntilIdle()

        // 1. Attempt login with non-existent email
        viewModel.signInWithEmailOrNickname("nonexistent@example.com", "AnyPassword123")
        advanceUntilIdle()
        val notFoundMessage = viewModel.uiState.value.errorMessage

        // 2. Attempt login with existing user but wrong password
        viewModel.signInWithEmailOrNickname("existing_user@example.com", "WrongPassword123")
        advanceUntilIdle()
        val wrongPassMessage = viewModel.uiState.value.errorMessage

        // Messages MUST be identical to prevent user/email enumeration
        assertNotNull(notFoundMessage)
        assertNotNull(wrongPassMessage)
        assertEquals(wrongPassMessage, notFoundMessage)
        assertEquals("Email, nickname yoki parol noto'g'ri.", notFoundMessage)
    }

    @Test
    fun `sendPasswordResetEmail does not reveal if email is registered (no email enumeration)`() = runTest {
        advanceUntilIdle()

        // When requesting password reset for an unregistered email, the user still sees positive confirmation
        viewModel.sendPasswordResetEmail("unknown_user@example.com")
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNull(state.errorMessage)
        assertNotNull(state.statusMessage)
        assertTrue(state.statusMessage!!.contains("yuborildi"))
    }

    @Test
    fun `signUp with invalid nickname format sets inline error without calling repository`() = runTest {
        advanceUntilIdle()

        // Nickname containing invalid characters (uppercase / spaces)
        viewModel.signUpWithEmail(
            nickname = "Bad Nick!!",
            email = "test@example.com",
            password = "Password123",
            isOwner = false
        )
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.inlineErrors.containsKey("nickname"))
        assertEquals(0, fakeRepository.signUpCallCount)
    }

    @Test
    fun `signUp with weak password sets inline error`() = runTest {
        advanceUntilIdle()

        // Weak password (only letters, no digits, < 8 chars)
        viewModel.signUpWithEmail(
            nickname = "good_nick",
            email = "test@example.com",
            password = "short",
            isOwner = false
        )
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state.inlineErrors.containsKey("password"))
        assertEquals(0, fakeRepository.signUpCallCount)
    }

    @Test
    fun `successful signUp updates userProfile and navigates home`() = runTest {
        advanceUntilIdle()

        viewModel.signUpWithEmail(
            nickname = "fresh_user",
            email = "fresh@example.com",
            password = "StrongPassword123",
            isOwner = true
        )
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNotNull(state.userProfile)
        assertEquals("owner", state.userProfile?.role)
        assertEquals("fresh_user", state.userProfile?.fullName)
        assertNotNull(state.statusMessage)
    }
}

class FakeAuthRepository : AuthRepository {
    val existingNicknames = mutableSetOf<String>()
    var failProfileWrite = false
    var rollbackInvoked = false
    var signUpCallCount = 0

    private val authStateFlow = MutableStateFlow<UserProfile?>(null)

    override fun observeAuthState(): Flow<UserProfile?> = authStateFlow

    override suspend fun getProfile(uid: String): AppResult<UserProfile?> {
        return AppResult.Success(null)
    }

    override suspend fun signUpWithEmail(
        nickname: String,
        email: String,
        password: String,
        role: String
    ): AppResult<UserProfile> {
        signUpCallCount++
        if (existingNicknames.contains(nickname.lowercase())) {
            return AppResult.Error(IllegalArgumentException("Ushbu nickname allaqachon band. Boshqa nom tanlang."))
        }

        if (failProfileWrite) {
            // Simulate rollback of created auth user
            rollbackInvoked = true
            return AppResult.Error(Exception("Firestore yozishda xatolik yuz berdi. Auth hisobi bekor qilindi."))
        }

        val profile = UserProfile(
            uid = "uid_$nickname",
            fullName = nickname,
            normalizedNickname = nickname.lowercase(),
            email = email,
            phone = "",
            role = role
        )
        authStateFlow.value = profile
        return AppResult.Success(profile)
    }

    override suspend fun signUpWithPhone(
        nickname: String,
        phone: String,
        password: String,
        role: String
    ): AppResult<UserProfile> {
        return signUpWithEmail(nickname, "$phone@dasturxon.uz", password, role)
    }

    override suspend fun signInWithEmailOrNickname(
        identifier: String,
        password: String
    ): AppResult<UserProfile> {
        // Enforce anti-enumeration: both non-existent user and wrong password return identical message
        if (identifier == "nonexistent@example.com" || password == "WrongPass123" || password == "WrongPassword123") {
            return AppResult.Error(Exception("Email, nickname yoki parol noto'g'ri."))
        }
        val profile = UserProfile(
            uid = "uid_existing",
            fullName = "Existing",
            normalizedNickname = "existing",
            email = identifier,
            phone = "",
            role = "customer"
        )
        authStateFlow.value = profile
        return AppResult.Success(profile)
    }

    override suspend fun signInWithGoogleCredential(
        idToken: String,
        selectedRole: String
    ): AppResult<UserProfile> {
        return AppResult.Success(UserProfile("g_uid", "Google", "google", "g@example.com", "", selectedRole))
    }

    override fun startPhoneVerification(
        activity: Activity,
        phoneNumber: String,
        onStateChanged: (PhoneVerificationState) -> Unit
    ) {}

    override suspend fun verifyPhoneOtpCode(
        verificationId: String,
        code: String,
        selectedRole: String
    ): AppResult<UserProfile> {
        return AppResult.Success(UserProfile("p_uid", "Phone", "phone", "p@example.com", "", selectedRole))
    }

    override suspend fun sendPasswordResetEmail(email: String): AppResult<Unit> {
        // Anti-enumeration: always report success
        return AppResult.Success(Unit)
    }

    override suspend fun signOut() {
        authStateFlow.value = null
    }
}
