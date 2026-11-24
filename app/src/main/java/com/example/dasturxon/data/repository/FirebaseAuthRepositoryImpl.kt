package com.example.dasturxon.data.repository

import android.app.Activity
import com.example.dasturxon.core.common.AppResult
import com.example.dasturxon.core.common.NicknameUtils
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseAuthRepositoryImpl @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) : AuthRepository {

    override fun observeSessionState(): Flow<AuthSessionState> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            val firebaseUser = firebaseAuth.currentUser
            if (firebaseUser == null) {
                trySend(AuthSessionState.SignedOut)
            } else {
                firestore.collection("users").document(firebaseUser.uid).get()
                    .addOnSuccessListener { doc ->
                        if (doc.exists()) {
                            trySend(AuthSessionState.Ready(mapDocumentToProfile(firebaseUser.uid, doc.data.orEmpty())))
                        } else {
                            trySend(AuthSessionState.ProfileMissing(firebaseUser.uid, firebaseUser.email.orEmpty()))
                        }
                    }
                    .addOnFailureListener { error ->
                        // Crucial: A Firestore read failure or offline state must never be interpreted as a successful sign-out!
                        trySend(AuthSessionState.Error(mapAuthError(error)))
                    }
            }
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    override fun observeAuthState(): Flow<UserProfile?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            val firebaseUser = firebaseAuth.currentUser
            if (firebaseUser == null) {
                trySend(null)
            } else {
                firestore.collection("users").document(firebaseUser.uid).get()
                    .addOnSuccessListener { doc ->
                        if (doc.exists()) {
                            trySend(mapDocumentToProfile(firebaseUser.uid, doc.data.orEmpty()))
                        }
                    }
                    .addOnFailureListener {
                        // Crucial: Do not emit null on read failure/offline to prevent unintended sign-out
                    }
            }
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    override suspend fun getProfile(uid: String): AppResult<UserProfile?> {
        return try {
            val snapshot = firestore.collection("users").document(uid).get().await()
            if (snapshot.exists()) {
                AppResult.Success(mapDocumentToProfile(uid, snapshot.data.orEmpty()))
            } else {
                AppResult.Success(null)
            }
        } catch (e: Exception) {
            AppResult.Error(e)
        }
    }

    override suspend fun signUpWithEmail(
        nickname: String,
        email: String,
        password: String,
        role: String
    ): AppResult<UserProfile> {
        val normalized = NicknameUtils.normalize(nickname)
        if (!NicknameUtils.isValid(nickname)) {
            return AppResult.Error(IllegalArgumentException("Nickname 3-20 belgi, faqat kichik harflar (a-z), raqamlar, '_' va '.' dan iborat bo'lishi kerak."))
        }

        return try {
            // 1. Check atomic nickname uniqueness in usernames collection
            val usernameSnap = firestore.collection("usernames").document(normalized).get().await()
            if (usernameSnap.exists()) {
                return AppResult.Error(IllegalArgumentException("Ushbu nickname allaqachon band. Boshqa nom tanlang."))
            }

            // 2. Create Auth User
            val authResult = auth.createUserWithEmailAndPassword(email, password).await()
            val newUser = authResult.user ?: throw IllegalStateException("Foydalanuvchi hisobi yaratilmadi.")
            val uid = newUser.uid

            // 3. Atomic WriteBatch to usernames/{normalized} and users/{uid}
            val batch = firestore.batch()
            val usernameRef = firestore.collection("usernames").document(normalized)
            val userRef = firestore.collection("users").document(uid)

            val profileMap = mapOf(
                "fullName" to nickname,
                "normalizedNickname" to normalized,
                "email" to email,
                "phone" to "",
                "role" to role,
                "createdAt" to FieldValue.serverTimestamp()
            )

            batch.set(usernameRef, mapOf("uid" to uid, "createdAt" to FieldValue.serverTimestamp()))
            batch.set(userRef, profileMap)

            try {
                batch.commit().await()
            } catch (firestoreError: Exception) {
                // Rollback Auth user if profile write fails
                try { newUser.delete().await() } catch (_: Exception) {}
                throw firestoreError
            }

            val profile = UserProfile(
                uid = uid,
                fullName = nickname,
                normalizedNickname = normalized,
                email = email,
                phone = "",
                role = role
            )
            AppResult.Success(profile)
        } catch (e: Exception) {
            AppResult.Error(Exception(mapAuthError(e)))
        }
    }

    override suspend fun signUpWithPhone(
        nickname: String,
        phone: String,
        password: String,
        role: String
    ): AppResult<UserProfile> {
        val normalized = NicknameUtils.normalize(nickname)
        if (!NicknameUtils.isValid(nickname)) {
            return AppResult.Error(IllegalArgumentException("Nickname 3-20 belgi, faqat kichik harflar (a-z), raqamlar, '_' va '.' dan iborat bo'lishi kerak."))
        }

        val cleanPhone = phone.replace(Regex("[^0-9+]"), "")
        val syntheticEmail = "$cleanPhone@dasturxon.uz"

        return try {
            val usernameSnap = firestore.collection("usernames").document(normalized).get().await()
            if (usernameSnap.exists()) {
                return AppResult.Error(IllegalArgumentException("Ushbu nickname allaqachon band. Boshqa nom tanlang."))
            }

            val authResult = auth.createUserWithEmailAndPassword(syntheticEmail, password).await()
            val newUser = authResult.user ?: throw IllegalStateException("Hisob yaratilmadi.")
            val uid = newUser.uid

            val batch = firestore.batch()
            val usernameRef = firestore.collection("usernames").document(normalized)
            val userRef = firestore.collection("users").document(uid)

            val profileMap = mapOf(
                "fullName" to nickname,
                "normalizedNickname" to normalized,
                "email" to syntheticEmail,
                "phone" to cleanPhone,
                "role" to role,
                "createdAt" to FieldValue.serverTimestamp()
            )

            batch.set(usernameRef, mapOf("uid" to uid, "createdAt" to FieldValue.serverTimestamp()))
            batch.set(userRef, profileMap)

            try {
                batch.commit().await()
            } catch (firestoreError: Exception) {
                try { newUser.delete().await() } catch (_: Exception) {}
                throw firestoreError
            }

            val profile = UserProfile(
                uid = uid,
                fullName = nickname,
                normalizedNickname = normalized,
                email = syntheticEmail,
                phone = cleanPhone,
                role = role
            )
            AppResult.Success(profile)
        } catch (e: Exception) {
            AppResult.Error(Exception(mapAuthError(e)))
        }
    }

    override suspend fun signInWithEmail(
        email: String,
        password: String
    ): AppResult<UserProfile> {
        val cleanEmail = email.trim()
        if (cleanEmail.isBlank()) {
            return AppResult.Error(IllegalArgumentException("Email manzilni kiriting."))
        }
        if (!cleanEmail.contains("@")) {
            return AppResult.Error(IllegalArgumentException("Email formati noto'g'ri."))
        }

        return try {
            val authResult = auth.signInWithEmailAndPassword(cleanEmail, password).await()
            val uid = authResult.user?.uid ?: throw IllegalStateException("Kirish amalga oshmadi.")
            val profileSnap = firestore.collection("users").document(uid).get().await()

            if (!profileSnap.exists()) {
                throw IllegalStateException("Foydalanuvchi profili topilmadi.")
            }

            AppResult.Success(mapDocumentToProfile(uid, profileSnap.data.orEmpty()))
        } catch (e: Exception) {
            AppResult.Error(Exception(mapAuthError(e)))
        }
    }

    override suspend fun signInWithEmailOrNickname(
        identifier: String,
        password: String
    ): AppResult<UserProfile> {
        val cleanId = identifier.trim()
        if (!cleanId.contains("@")) {
            return AppResult.Error(
                IllegalArgumentException("Iltimos, haqiqiy email manzilingizni kiriting (masalan: foydalanuvchi@gmail.com). Nickname faqat profilingiz uchun nom hisoblanadi.")
            )
        }
        return signInWithEmail(cleanId, password)
    }

    override suspend fun signInWithGoogleCredential(
        idToken: String,
        selectedRole: String
    ): AppResult<UserProfile> {
        return try {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val authResult = auth.signInWithCredential(credential).await()
            val firebaseUser = authResult.user ?: throw IllegalStateException("Google autentifikatsiyasi amalga oshmadi.")
            val uid = firebaseUser.uid

            val userDocRef = firestore.collection("users").document(uid)
            val docSnap = userDocRef.get().await()

            val profile = if (docSnap.exists()) {
                mapDocumentToProfile(uid, docSnap.data.orEmpty())
            } else {
                val displayName = firebaseUser.displayName ?: "Google User"
                val email = firebaseUser.email ?: "$uid@google.com"
                val normalized = NicknameUtils.normalize(displayName.replace(" ", "_"))

                val profileMap = mapOf(
                    "fullName" to displayName,
                    "normalizedNickname" to normalized,
                    "email" to email,
                    "phone" to (firebaseUser.phoneNumber ?: ""),
                    "role" to selectedRole,
                    "createdAt" to FieldValue.serverTimestamp()
                )

                userDocRef.set(profileMap).await()

                UserProfile(
                    uid = uid,
                    fullName = displayName,
                    normalizedNickname = normalized,
                    email = email,
                    phone = firebaseUser.phoneNumber ?: "",
                    role = selectedRole
                )
            }

            AppResult.Success(profile)
        } catch (e: Exception) {
            AppResult.Error(Exception(mapAuthError(e)))
        }
    }

    override fun startPhoneVerification(
        activity: Activity,
        phoneNumber: String,
        onStateChanged: (PhoneVerificationState) -> Unit
    ) {
        val cleanPhone = phoneNumber.replace(Regex("[^0-9+]"), "")
        val options = PhoneAuthOptions.newBuilder(auth)
            .setPhoneNumber(cleanPhone)
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                    auth.signInWithCredential(credential)
                        .addOnSuccessListener { result ->
                            val uid = result.user?.uid.orEmpty()
                            onStateChanged(PhoneVerificationState.Verified(uid))
                        }
                        .addOnFailureListener { error ->
                            onStateChanged(PhoneVerificationState.Error(mapAuthError(error)))
                        }
                }

                override fun onVerificationFailed(e: FirebaseException) {
                    onStateChanged(PhoneVerificationState.Error(mapAuthError(e)))
                }

                override fun onCodeSent(
                    verificationId: String,
                    token: PhoneAuthProvider.ForceResendingToken
                ) {
                    onStateChanged(PhoneVerificationState.CodeSentDetails(verificationId, token))
                }
            })
            .build()

        PhoneAuthProvider.verifyPhoneNumber(options)
    }

    override suspend fun verifyPhoneOtpCode(
        verificationId: String,
        code: String,
        selectedRole: String
    ): AppResult<UserProfile> {
        return try {
            val credential = PhoneAuthProvider.getCredential(verificationId, code)
            val authResult = auth.signInWithCredential(credential).await()
            val firebaseUser = authResult.user ?: throw IllegalStateException("SMS kodi tasdiqlanmadi.")
            val uid = firebaseUser.uid

            val userDocRef = firestore.collection("users").document(uid)
            val docSnap = userDocRef.get().await()

            val profile = if (docSnap.exists()) {
                mapDocumentToProfile(uid, docSnap.data.orEmpty())
            } else {
                val phone = firebaseUser.phoneNumber ?: ""
                val normalized = NicknameUtils.normalize(phone.replace("+", "user_"))

                val profileMap = mapOf(
                    "fullName" to phone,
                    "normalizedNickname" to normalized,
                    "email" to "$phone@dasturxon.uz",
                    "phone" to phone,
                    "role" to selectedRole,
                    "createdAt" to FieldValue.serverTimestamp()
                )

                userDocRef.set(profileMap).await()

                UserProfile(
                    uid = uid,
                    fullName = phone,
                    normalizedNickname = normalized,
                    email = "$phone@dasturxon.uz",
                    phone = phone,
                    role = selectedRole
                )
            }

            AppResult.Success(profile)
        } catch (e: Exception) {
            AppResult.Error(Exception(mapAuthError(e)))
        }
    }

    override suspend fun sendPasswordResetEmail(email: String): AppResult<Unit> {
        return try {
            auth.sendPasswordResetEmail(email).await()
            AppResult.Success(Unit)
        } catch (e: Exception) {
            val errorCode = (e as? FirebaseAuthException)?.errorCode
            if (errorCode == "ERROR_USER_NOT_FOUND") {
                // Prevent email enumeration: return success even if user not found
                AppResult.Success(Unit)
            } else {
                AppResult.Error(Exception(mapAuthError(e)))
            }
        }
    }

    override suspend fun signOut() {
        auth.signOut()
    }

    private fun mapDocumentToProfile(uid: String, data: Map<String, Any>): UserProfile {
        return UserProfile(
            uid = uid,
            fullName = data["fullName"] as? String ?: "",
            normalizedNickname = data["normalizedNickname"] as? String ?: "",
            email = data["email"] as? String ?: "",
            phone = data["phone"] as? String ?: "",
            role = data["role"] as? String ?: "customer"
        )
    }

    internal fun mapAuthError(error: Exception): String {
        if (error.message.orEmpty().contains("CONFIGURATION_NOT_FOUND")) {
            return "Firebase Console'da Authentication bo'limida kirish usullarini yoqing."
        }
        if (error is com.google.firebase.firestore.FirebaseFirestoreException) {
            return when (error.code) {
                com.google.firebase.firestore.FirebaseFirestoreException.Code.PERMISSION_DENIED ->
                    "Ruxsat cheklangan yoki hisob ma'lumotlariga kirish taqiqlangan."
                com.google.firebase.firestore.FirebaseFirestoreException.Code.UNAVAILABLE ->
                    "Internet aloqasi mavjud emas yoki server bilan aloqa uzildi."
                else -> "Ma'lumotlar bazasida xatolik yuz berdi."
            }
        }
        return when ((error as? FirebaseAuthException)?.errorCode) {
            "ERROR_INVALID_EMAIL" -> "Email manzili formati noto'g'ri."
            "ERROR_USER_NOT_FOUND", "ERROR_WRONG_PASSWORD", "ERROR_INVALID_CREDENTIAL" ->
                "Email yoki parol noto'g'ri."
            "ERROR_EMAIL_ALREADY_IN_USE" -> "Ushbu email bilan hisob allaqachon mavjud."
            "ERROR_WEAK_PASSWORD" -> "Parol kamida 8 belgi, harf va raqamdan iborat bo'lishi kerak."
            "ERROR_TOO_MANY_REQUESTS" -> "Urinishlar soni ko'p bo'ldi. Birozdan keyin qayta urinib ko'ring."
            "ERROR_NETWORK_REQUEST_FAILED" -> "Internet aloqasini tekshiring."
            "ERROR_USER_DISABLED" -> "Ushbu hisob vaqtincha bloklangan."
            "ERROR_OPERATION_NOT_ALLOWED" -> "Ushbu kirish usuli sozlamalarda yoqilmagan."
            else -> error.localizedMessage ?: "Tizimda xatolik yuz berdi. Qayta urinib ko'ring."
        }
    }
}
