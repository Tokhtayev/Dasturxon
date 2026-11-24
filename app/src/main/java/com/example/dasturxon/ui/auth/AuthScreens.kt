package com.example.dasturxon.ui.auth

import android.app.Activity
import android.util.Log
import android.util.Patterns
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.example.dasturxon.core.common.NicknameUtils
import com.example.dasturxon.core.designsystem.DxLogo
import com.example.dasturxon.core.designsystem.DxTextField
import com.example.dasturxon.data.repository.PhoneVerificationState
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch

// --- Sign In Screen ---
@Composable
fun SignInScreen(
    uiState: AuthUiState,
    onSignIn: (identifier: String, password: String) -> Unit,
    onGoogleSignInClick: (idToken: String) -> Unit,
    onPhoneOtpStart: (activity: Activity, phone: String) -> Unit,
    onPhoneOtpVerify: (verificationId: String, code: String) -> Unit,
    onGoToRegister: () -> Unit,
    onForgotPassword: (email: String) -> Unit
) {
    var identifier by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var showForgotSheet by remember { mutableStateOf(false) }
    var showPhoneOtpSheet by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    if (showForgotSheet) {
        ForgotPasswordSheet(
            onDismiss = { showForgotSheet = false },
            onSend = { resetEmail ->
                showForgotSheet = false
                onForgotPassword(resetEmail)
            }
        )
    }

    if (showPhoneOtpSheet) {
        PhoneOtpSheet(
            phoneVerificationState = uiState.phoneVerificationState,
            isLoading = uiState.isLoading,
            onDismiss = { showPhoneOtpSheet = false },
            onSendOtp = { phone ->
                val activity = context as? Activity
                if (activity != null) {
                    onPhoneOtpStart(activity, phone)
                }
            },
            onVerifyOtp = { verificationId, code ->
                onPhoneOtpVerify(verificationId, code)
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        Spacer(Modifier.height(40.dp))

        // Hero section
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.primaryContainer,
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                DxLogo(size = 50.dp, showWordmark = false)
            }
            Spacer(Modifier.height(12.dp))
            Text(
                text = "Dasturxon",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "Mahalliy yangi mahsulotlar hamjamiyati",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }

        Spacer(Modifier.height(28.dp))

        // Form Card
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "Xush kelibsiz!",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                DxTextField(
                    value = identifier,
                    onValueChange = { identifier = it },
                    label = "Nickname yoki Email manzil",
                    keyboardType = KeyboardType.Email,
                    enabled = !uiState.isLoading
                )

                DxTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Parol",
                    isPassword = true,
                    keyboardType = KeyboardType.Password,
                    enabled = !uiState.isLoading
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = { showForgotSheet = true },
                        enabled = !uiState.isLoading,
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text(
                            "Parolni unutdingizmi?",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                }

                uiState.errorMessage?.let { msg ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = msg,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }

                Button(
                    onClick = { onSignIn(identifier.trim(), password) },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    enabled = !uiState.isLoading && identifier.isNotBlank() && password.isNotBlank(),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Kirish", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Divider
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            HorizontalDivider(modifier = Modifier.weight(1f))
            Text(
                "yoki boshqa usul bilan kirish",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            HorizontalDivider(modifier = Modifier.weight(1f))
        }

        Spacer(Modifier.height(14.dp))

        // Social / OTP Buttons
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Google Button
            OutlinedButton(
                onClick = {
                    coroutineScope.launch {
                        performGoogleCredentialManagerSignIn(context) { idToken ->
                            onGoogleSignInClick(idToken)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                enabled = !uiState.isLoading,
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("🌐  Google orqali davom etish", fontWeight = FontWeight.SemiBold)
            }

            // Phone / Telegram SMS OTP Button
            OutlinedButton(
                onClick = { showPhoneOtpSheet = true },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                enabled = !uiState.isLoading,
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("📱  SMS / Telegram raqamga kod bilan kirish", fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(20.dp))

        // Switch to register
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Hisobingiz yo'qmi? ",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "Ro'yxatdan o'tish",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.clickable(enabled = !uiState.isLoading) { onGoToRegister() }
            )
        }

        Spacer(Modifier.height(32.dp))
    }
}

// --- Registration Screen ---
@Composable
fun SignUpScreen(
    uiState: AuthUiState,
    onRegisterEmail: (nickname: String, email: String, password: String, isOwner: Boolean) -> Unit,
    onRegisterPhone: (nickname: String, phone: String, password: String, isOwner: Boolean) -> Unit,
    onGoogleSignInClick: (idToken: String) -> Unit,
    onPhoneOtpStart: (activity: Activity, phone: String) -> Unit,
    onPhoneOtpVerify: (verificationId: String, code: String) -> Unit,
    onGoToSignIn: () -> Unit
) {
    var nickname by rememberSaveable { mutableStateOf("") }
    var useEmailOption by rememberSaveable { mutableStateOf(true) }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("+998 ") }
    var password by rememberSaveable { mutableStateOf("") }
    var confirmPassword by rememberSaveable { mutableStateOf("") }
    var isOwner by rememberSaveable { mutableStateOf(false) }
    var showPhoneOtpSheet by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    if (showPhoneOtpSheet) {
        PhoneOtpSheet(
            phoneVerificationState = uiState.phoneVerificationState,
            isLoading = uiState.isLoading,
            onDismiss = { showPhoneOtpSheet = false },
            onSendOtp = { ph ->
                val activity = context as? Activity
                if (activity != null) {
                    onPhoneOtpStart(activity, ph)
                }
            },
            onVerifyOtp = { verificationId, code ->
                onPhoneOtpVerify(verificationId, code)
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        Spacer(Modifier.height(32.dp))

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            DxLogo(size = 36.dp, showWordmark = false)
            Text(
                text = "Ro'yxatdan o'tish",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(Modifier.height(20.dp))

        // Role selector
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Hisob turi", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    RoleCard(
                        emoji = "🛒",
                        title = "Xaridor",
                        subtitle = "Mahsulot sotib oling",
                        isSelected = !isOwner,
                        onClick = { isOwner = false },
                        modifier = Modifier.weight(1f)
                    )
                    RoleCard(
                        emoji = "🏪",
                        title = "Biznes egasi",
                        subtitle = "Mahsulot soting",
                        isSelected = isOwner,
                        onClick = { isOwner = true },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        // Form
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(4.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                DxTextField(
                    value = nickname,
                    onValueChange = { nickname = it },
                    label = "Nickname (a-z, 0-9, _, .)",
                    enabled = !uiState.isLoading,
                    errorMessage = uiState.inlineErrors["nickname"]
                )

                // Tab choice between Email or Phone
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    SegmentedButton(
                        selected = useEmailOption,
                        onClick = { useEmailOption = true },
                        shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                    ) {
                        Text("Email")
                    }
                    SegmentedButton(
                        selected = !useEmailOption,
                        onClick = { useEmailOption = false },
                        shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                    ) {
                        Text("Telefon")
                    }
                }

                if (useEmailOption) {
                    DxTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = "Email manzil",
                        keyboardType = KeyboardType.Email,
                        enabled = !uiState.isLoading,
                        errorMessage = uiState.inlineErrors["contact"]
                    )
                } else {
                    DxTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = "Telefon raqam (+998)",
                        keyboardType = KeyboardType.Phone,
                        enabled = !uiState.isLoading,
                        errorMessage = uiState.inlineErrors["contact"]
                    )
                }

                DxTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Parol (kamida 8 belgi, harf va raqam)",
                    isPassword = true,
                    keyboardType = KeyboardType.Password,
                    enabled = !uiState.isLoading,
                    errorMessage = uiState.inlineErrors["password"]
                )
                DxTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = "Parolni takrorlang",
                    isPassword = true,
                    keyboardType = KeyboardType.Password,
                    enabled = !uiState.isLoading,
                    errorMessage = if (confirmPassword.isNotBlank() && password != confirmPassword) "Parollar mos emas" else null
                )

                uiState.errorMessage?.let { msg ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = msg,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }

                val isFormValid = nickname.isNotBlank() && password.isNotBlank() && password == confirmPassword &&
                    ((useEmailOption && email.isNotBlank()) || (!useEmailOption && phone.length >= 9))

                Button(
                    onClick = {
                        if (useEmailOption) {
                            onRegisterEmail(nickname.trim(), email.trim(), password, isOwner)
                        } else {
                            onRegisterPhone(nickname.trim(), phone.trim(), password, isOwner)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    enabled = !uiState.isLoading && isFormValid,
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text("Ro'yxatdan o'tish", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        // Divider
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            HorizontalDivider(modifier = Modifier.weight(1f))
            Text(
                "yoki",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            HorizontalDivider(modifier = Modifier.weight(1f))
        }

        Spacer(Modifier.height(12.dp))

        // Social / OTP Buttons
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedButton(
                onClick = {
                    coroutineScope.launch {
                        performGoogleCredentialManagerSignIn(context) { idToken ->
                            onGoogleSignInClick(idToken)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                enabled = !uiState.isLoading,
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("🌐  Google orqali ro'yxatdan o'tish", fontWeight = FontWeight.SemiBold)
            }

            OutlinedButton(
                onClick = { showPhoneOtpSheet = true },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                enabled = !uiState.isLoading,
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("📱  SMS / Telegram raqamga kod yuborish", fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Hisobingiz bormi? ",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "Kirish",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.clickable(enabled = !uiState.isLoading) { onGoToSignIn() }
            )
        }

        Spacer(Modifier.height(32.dp))
    }
}

// --- Phone / Telegram OTP Sheet ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhoneOtpSheet(
    phoneVerificationState: PhoneVerificationState,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSendOtp: (phone: String) -> Unit,
    onVerifyOtp: (verificationId: String, code: String) -> Unit
) {
    var phone by remember { mutableStateOf("+998 ") }
    var code by remember { mutableStateOf("") }

    val isCodeSent = phoneVerificationState is PhoneVerificationState.CodeSentDetails

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
                .navigationBarsPadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = if (!isCodeSent) "SMS / Telegram orqali kirish" else "SMS kodni kiriting",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = if (!isCodeSent)
                    "Telefon raqamingizni kiriting. SMS yoki Telegram orqali bir martalik tasdiqlash kodi yuboriladi."
                else
                    "$phone raqamiga 6 xonali tasdiqlash kodi yuborildi.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (!isCodeSent) {
                DxTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = "Telefon raqamingiz (+998...)",
                    keyboardType = KeyboardType.Phone,
                    enabled = !isLoading
                )

                Button(
                    onClick = {
                        if (phone.length >= 9) {
                            onSendOtp(phone.trim())
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    enabled = !isLoading && phone.length >= 9,
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("SMS / Telegram kod yuborish", fontWeight = FontWeight.Bold)
                    }
                }
            } else {
                val details = phoneVerificationState as PhoneVerificationState.CodeSentDetails

                DxTextField(
                    value = code,
                    onValueChange = { if (it.length <= 6) code = it },
                    label = "6 xonali tasdiqlash kodi",
                    keyboardType = KeyboardType.Number,
                    enabled = !isLoading
                )

                Button(
                    onClick = {
                        if (code.length >= 4) {
                            onVerifyOtp(details.verificationId, code.trim())
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    enabled = !isLoading && code.length >= 4,
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text("Tasdiqlash va kirish →", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }

            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text("Bekor qilish")
            }
        }
    }
}

// --- Role Card ---
@Composable
private fun RoleCard(
    emoji: String,
    title: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val borderColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
    val bgColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant

    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = bgColor,
        border = androidx.compose.foundation.BorderStroke(
            width = if (isSelected) 2.dp else 1.dp,
            color = borderColor
        )
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(emoji, fontSize = 28.sp)
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f) else MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

// --- Forgot Password Sheet ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ForgotPasswordSheet(
    onDismiss: () -> Unit,
    onSend: (email: String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    val isValid = Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
                .navigationBarsPadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                "Parolni tiklash",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Email manzilingizni kiriting. Parolni tiklash havolasini yuboramiz.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            DxTextField(
                value = email,
                onValueChange = { email = it },
                label = "Email manzil",
                keyboardType = KeyboardType.Email
            )
            Button(
                onClick = { if (isValid) onSend(email.trim()) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = isValid,
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("Havola yuborish", fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text("Bekor qilish")
            }
        }
    }
}

// --- Email Verification Screen ---
@Composable
fun EmailVerificationScreen(
    email: String,
    isResending: Boolean,
    onResend: () -> Unit,
    onRefresh: () -> Unit,
    onSignOut: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("📧", fontSize = 72.sp)
        Spacer(Modifier.height(24.dp))
        Text(
            text = "Emailni tasdiqlang",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = "Tasdiqlash havolasi yuborildi:\n$email",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(32.dp))
        Button(
            onClick = onRefresh,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp)
        ) {
            Text("Tasdiqladim →", fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(12.dp))
        OutlinedButton(
            onClick = onResend,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            enabled = !isResending,
            shape = RoundedCornerShape(14.dp)
        ) {
            if (isResending) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            }
            Text("Xatni qayta yuborish")
        }
        Spacer(Modifier.height(16.dp))
        TextButton(onClick = onSignOut) {
            Text("Boshqa hisob bilan kirish", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

private suspend fun performGoogleCredentialManagerSignIn(
    context: android.content.Context,
    onIdTokenReceived: (String) -> Unit
) {
    try {
        val credentialManager = CredentialManager.create(context)
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId("437798898747-default.apps.googleusercontent.com")
            .setAutoSelectEnabled(false)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        val result = credentialManager.getCredential(context, request)
        val credential = result.credential

        if (credential is GoogleIdTokenCredential) {
            onIdTokenReceived(credential.idToken)
        }
    } catch (e: GetCredentialException) {
        Log.w("AuthScreens", "Google credential retrieval cancelled or failed")
    } catch (e: Exception) {
        Log.w("AuthScreens", "Google sign in request could not be completed")
    }
}
