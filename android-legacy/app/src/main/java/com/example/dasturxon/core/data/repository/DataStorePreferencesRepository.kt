package com.example.dasturxon.core.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

@Singleton
class DataStorePreferencesRepository @Inject constructor(
    @param:ApplicationContext private val context: Context
) : PreferencesRepository {

    private object Keys {
        val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
        val LANGUAGE = stringPreferencesKey("language")
        val THEME = stringPreferencesKey("theme")
    }

    override val isOnboardingCompleted: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[Keys.ONBOARDING_COMPLETED] ?: false
    }

    override suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[Keys.ONBOARDING_COMPLETED] = completed
        }
    }

    override val selectedLanguage: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[Keys.LANGUAGE] ?: "uz"
    }

    override suspend fun setSelectedLanguage(languageCode: String) {
        context.dataStore.edit { preferences ->
            preferences[Keys.LANGUAGE] = languageCode
        }
    }

    override val selectedTheme: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[Keys.THEME] ?: "system"
    }

    override suspend fun setSelectedTheme(theme: String) {
        context.dataStore.edit { preferences ->
            preferences[Keys.THEME] = theme
        }
    }
}
