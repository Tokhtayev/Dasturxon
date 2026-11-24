package com.example.dasturxon.ui.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.core.common.NicknameUtils
import com.example.dasturxon.data.repository.AuthRepository
import com.example.dasturxon.data.repository.PhoneVerificationState
import com.example.dasturxon.data.repository.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val isInitialLoading: Boolean = true,
    val userProfile: UserProfile? = null,
    val selectedEntryRole: String? = null,
    val errorMessage: String? = null,
    val statusMessage: String? = null,
    val isRegisterMode: Boolean = false,
    val phoneVerificationState: PhoneVerificationState = PhoneVerificationState.Idle,
    val inlineErrors: Map<String, String> = emptyMap()
)

sealed class AuthEvent {
    data class ShowMessage(val message: String) : AuthEvent()
    data class NavigateHome(val role: String) : AuthEvent()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _eventChannel = Channel<AuthEvent>(Channel.BUFFERED)
    val events = _eventChannel.receiveAsFlow()

    init {
        observeAuthState()
    }

    private fun observeAuthState() {
        viewModelScope.launch {
            authRepository.observeAuthState().collect { profile ->
                _uiState.update {
                    it.copy(
                        userProfile = profile,
                        isInitialLoading = false,
                        errorMessage = null
                    )
                }
            }
        }
    }

    fun toggleRegisterMode(isRegister: Boolean) {
        _uiState.update {
            it.copy(
                isRegisterMode = isRegister,
                errorMessage = null,
                statusMessage = null,
                inlineErrors = emptyMap()
            )
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, statusMessage = null) }
    }

    fun signUpWithEmail(
        nickname: String,
        email: String,
        password: String,
        isOwner: Boolean
    ) {
        val cleanNickname = nickname.trim()
        val cleanEmail = email.trim()

        if (!validateSignUpInput(cleanNickname, cleanEmail, password)) return

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            val role = if (isOwner) "owner" else "customer"
            when (val result = authRepository.signUpWithEmail(cleanNickname, cleanEmail, password, role)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            userProfile = result.data,
                            statusMessage = "Ro'yxatdan muvaffaqiyatli o'tildi!"
                        )
                    }
                    _eventChannel.send(AuthEvent.NavigateHome(role))
                }
                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.exception.localizedMessage ?: "Ro'yxatdan o'tishda xatolik."
                        )
                    }
                }
            }
        }
    }

    fun signUpWithPhone(
        nickname: String,
        phone: String,
        password: String,
        isOwner: Boolean
    ) {
        val cleanNickname = nickname.trim()
        val cleanPhone = phone.trim()

        if (!validateSignUpInput(cleanNickname, cleanPhone, password)) return

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            val role = if (isOwner) "owner" else "customer"
            when (val result = authRepository.signUpWithPhone(cleanNickname, cleanPhone, password, role)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            userProfile = result.data,
                            statusMessage = "Ro'yxatdan muvaffaqiyatli o'tildi!"
                        )
                    }
                    _eventChannel.send(AuthEvent.NavigateHome(role))
                }
                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.exception.localizedMessage ?: "Ro'yxatdan o'tishda xatolik."
                        )
                    }
                }
            }
        }
    }

    fun setEntryRole(role: String) {
        _uiState.update { it.copy(selectedEntryRole = role) }
    }

    fun signInWithEmailOrNickname(
        identifier: String,
        password: String,
        targetRole: String? = null
    ) {
        val cleanId = identifier.trim()
        if (cleanId.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Nickname yoki Email manzilni kiriting.") }
            return
        }
        if (password.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Parolni kiriting.") }
            return
        }

        val roleToUse = targetRole ?: _uiState.value.selectedEntryRole
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = authRepository.signInWithEmailOrNickname(cleanId, password)) {
                is AppResult.Success -> {
                    val finalRole = roleToUse ?: result.data.role
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            userProfile = result.data,
                            selectedEntryRole = finalRole
                        )
                    }
                    _eventChannel.send(AuthEvent.NavigateHome(finalRole))
                }
                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.exception.localizedMessage ?: "Email, nickname yoki parol noto'g'ri."
                        )
                    }
                }
            }
        }
    }

    fun signInWithGoogleIdToken(idToken: String, isOwner: Boolean = false, targetRole: String? = null) {
        val role = targetRole ?: (if (isOwner) "owner" else "customer")
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = authRepository.signInWithGoogleCredential(idToken, role)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            userProfile = result.data,
                            selectedEntryRole = role
                        )
                    }
                    _eventChannel.send(AuthEvent.NavigateHome(role))
                }
                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.exception.localizedMessage ?: "Google orqali kirishda xatolik."
                        )
                    }
                }
            }
        }
    }

    fun startPhoneVerification(activity: Activity, phone: String) {
        val cleanPhone = phone.trim()
        if (cleanPhone.length < 9) {
            _uiState.update { it.copy(errorMessage = "To'g'ri telefon raqam kiriting (+998...).") }
            return
        }

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        authRepository.startPhoneVerification(activity, cleanPhone) { state ->
            _uiState.update {
                it.copy(
                    isLoading = state is PhoneVerificationState.Idle,
                    phoneVerificationState = state,
                    errorMessage = if (state is PhoneVerificationState.Error) state.message else null
                )
            }
        }
    }

    fun verifyPhoneOtpCode(verificationId: String, code: String, isOwner: Boolean = false, targetRole: String? = null) {
        val cleanCode = code.trim()
        if (cleanCode.length < 4) {
            _uiState.update { it.copy(errorMessage = "Tasdiqlash kodini kiriting.") }
            return
        }

        val role = targetRole ?: (if (isOwner) "owner" else "customer")
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = authRepository.verifyPhoneOtpCode(verificationId, cleanCode, role)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            userProfile = result.data,
                            selectedEntryRole = role,
                            phoneVerificationState = PhoneVerificationState.Verified(result.data.uid)
                        )
                    }
                    _eventChannel.send(AuthEvent.NavigateHome(role))
                }
                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.exception.localizedMessage ?: "SMS kodi noto'g'ri."
                        )
                    }
                }
            }
        }
    }

    fun sendPasswordResetEmail(email: String) {
        val cleanEmail = email.trim()
        if (cleanEmail.isBlank() || !cleanEmail.contains("@")) {
            _uiState.update { it.copy(errorMessage = "To'g'ri email manzil kiriting.") }
            return
        }

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = authRepository.sendPasswordResetEmail(cleanEmail)) {
                is AppResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            statusMessage = "✅ Parolni tiklash havolasi $cleanEmail manziliga yuborildi."
                        )
                    }
                }
                is AppResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.exception.localizedMessage ?: "Parolni tiklab bo'lmadi."
                        )
                    }
                }
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
            _uiState.update {
                AuthUiState(
                    isInitialLoading = false,
                    userProfile = null
                )
            }
        }
    }

    private fun validateSignUpInput(nickname: String, contact: String, pass: String): Boolean {
        val errors = mutableMapOf<String, String>()

        if (!NicknameUtils.isValid(nickname)) {
            errors["nickname"] = "Nickname 3-20 belgi, faqat (a-z, 0-9, _, .) bo'lishi kerak."
        }
        if (contact.isBlank()) {
            errors["contact"] = "Email yoki telefon manzilni kiriting."
        }
        if (pass.length < 8 || !pass.any(Char::isLetter) || !pass.any(Char::isDigit)) {
            errors["password"] = "Parol kamida 8 belgi, kamida 1 harf va 1 raqamdan iborat bo'lishi kerak."
        }

        if (errors.isNotEmpty()) {
            _uiState.update { it.copy(inlineErrors = errors) }
            return false
        }
        _uiState.update { it.copy(inlineErrors = emptyMap()) }
        return true
    }
}
