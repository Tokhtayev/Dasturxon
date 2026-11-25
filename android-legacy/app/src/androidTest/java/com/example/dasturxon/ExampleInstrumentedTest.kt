package com.example.dasturxon

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.google.firebase.auth.FirebaseAuth
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ExampleInstrumentedTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun registrationScreenCanBeOpenedFromSignIn() {
        FirebaseAuth.getInstance().signOut()
        composeRule.activityRule.scenario.recreate()
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Mahalla Bozori").assertIsDisplayed()
        composeRule.onNodeWithText("Hisobingiz yo'qmi? Ro'yxatdan o'tish").performClick()
        composeRule.onNodeWithText("Hisob yaratish").assertIsDisplayed()
        composeRule.onNodeWithText("Parolni takrorlang").assertIsDisplayed()
    }
}
