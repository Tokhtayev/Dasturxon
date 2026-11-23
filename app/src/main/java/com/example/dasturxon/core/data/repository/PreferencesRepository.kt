package com.example.dasturxon.core.data.repository

import kotlinx.coroutines.flow.Flow

interface PreferencesRepository {
    val isOnboardingCompleted: Flow<Boolean>
    suspend fun setOnboardingCompleted(completed: Boolean)

    val selectedLanguage: Flow<String>
    suspend fun setSelectedLanguage(languageCode: String)

    val selectedTheme: Flow<String>
    suspend fun setSelectedTheme(theme: String)
}
