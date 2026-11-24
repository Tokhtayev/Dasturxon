package com.example.dasturxon

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.dasturxon.ui.auth.AuthViewModel
import com.example.dasturxon.ui.auth.SignInScreen
import com.example.dasturxon.ui.auth.SignUpScreen
import com.example.dasturxon.ui.home.RoleHome
import com.example.dasturxon.ui.theme.DasturxonTheme
import com.google.firebase.firestore.FirebaseFirestore
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var firestore: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            DasturxonTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Surface(modifier = Modifier.padding(innerPadding)) {
                        AuthRootContainer(firestore = firestore)
                    }
                }
            }
        }
    }
}

@Composable
private fun AuthRootContainer(
    firestore: FirebaseFirestore,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when {
        uiState.isInitialLoading -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator()
                Spacer(Modifier.height(16.dp))
                Text("Yuklanmoqda...")
            }
        }
        uiState.userProfile != null -> {
            val profile = uiState.userProfile!!
            RoleHome(
                uid = profile.uid,
                email = profile.email,
                fullName = profile.fullName,
                role = uiState.selectedEntryRole ?: profile.role,
                firestore = firestore,
                onSignOut = { viewModel.signOut() }
            )
        }
        uiState.isRegisterMode -> {
            SignUpScreen(
                uiState = uiState,
                onRegisterEmail = { nickname, email, pass, isOwner ->
                    viewModel.signUpWithEmail(nickname, email, pass, isOwner)
                },
                onRegisterPhone = { nickname, phone, pass, isOwner ->
                    viewModel.signUpWithPhone(nickname, phone, pass, isOwner)
                },
                onGoogleSignInClick = { idToken ->
                    viewModel.signInWithGoogleIdToken(idToken)
                },
                onPhoneOtpStart = { activity, phone ->
                    viewModel.startPhoneVerification(activity, phone)
                },
                onPhoneOtpVerify = { verificationId, code ->
                    viewModel.verifyPhoneOtpCode(verificationId, code)
                },
                onGoToSignIn = { viewModel.toggleRegisterMode(false) }
            )
        }
        else -> {
            SignInScreen(
                uiState = uiState,
                onSignIn = { identifier, password, role ->
                    viewModel.signInWithEmailOrNickname(identifier, password, role)
                },
                onGoogleSignInClick = { idToken, role ->
                    viewModel.signInWithGoogleIdToken(idToken, isOwner = role == "owner", targetRole = role)
                },
                onPhoneOtpStart = { activity, phone ->
                    viewModel.startPhoneVerification(activity, phone)
                },
                onPhoneOtpVerify = { verificationId, code, role ->
                    viewModel.verifyPhoneOtpCode(verificationId, code, isOwner = role == "owner", targetRole = role)
                },
                onGoToRegister = { viewModel.toggleRegisterMode(true) },
                onForgotPassword = { email ->
                    viewModel.sendPasswordResetEmail(email)
                }
            )
        }
    }
}
