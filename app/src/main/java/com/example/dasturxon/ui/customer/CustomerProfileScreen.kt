package com.example.dasturxon.ui.customer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.lazy.LazyColumn
import kotlinx.coroutines.launch

@Composable
fun CustomerProfileScreen(
    email: String,
    fullName: String,
    onSignOut: () -> Unit,
    onOrdersClick: () -> Unit,
    onUpdateFullName: (suspend (String) -> Unit)? = null,
    onSwitchToOwner: (() -> Unit)? = null
) {
    var currentFullName by remember(fullName) { mutableStateOf(fullName) }
    var showEditProfileDialog by remember { mutableStateOf(false) }
    var newNameInput by rememberSaveable { mutableStateOf("") }
    var isSavingProfile by remember { mutableStateOf(false) }
    var editProfileError by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    var showSignOutDialog by remember { mutableStateOf(false) }
    var showAboutDialog by remember { mutableStateOf(false) }
    var showLanguageDialog by remember { mutableStateOf(false) }
    var showThemeDialog by remember { mutableStateOf(false) }
    var showNotificationDialog by remember { mutableStateOf(false) }
    var showFavoritesDialog by remember { mutableStateOf(false) }

    var selectedLanguage by remember { mutableStateOf("uz") }
    var selectedTheme by remember { mutableStateOf("system") }
    var notificationsEnabled by remember { mutableStateOf(true) }

    // Sign out confirmation dialog
    if (showSignOutDialog) {
        AlertDialog(
            onDismissRequest = { showSignOutDialog = false },
            title = { Text("Chiqish", fontWeight = FontWeight.Bold) },
            text = { Text("Hisobdan chiqmoqchimisiz?") },
            confirmButton = {
                Button(
                    onClick = { showSignOutDialog = false; onSignOut() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) { Text("Chiqish") }
            },
            dismissButton = {
                TextButton(onClick = { showSignOutDialog = false }) { Text("Bekor qilish") }
            }
        )
    }

    // About dialog
    if (showAboutDialog) {
        AlertDialog(
            onDismissRequest = { showAboutDialog = false },
            title = { Text("Dasturxon haqida", fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "Dasturxon v2.0\n\nYunusobod mahallasidagi nonvoyxona, qandolatxona va oshxonalardan yangi mahsulotlarni tanlang va qulay vaqtda olib keting.\n\n📞 Tel: +998 90 123 45 67\n✉️ Email: hello@dasturxon.uz"
                )
            },
            confirmButton = {
                TextButton(onClick = { showAboutDialog = false }) { Text("Yopish") }
            }
        )
    }

    // Language Dialog
    if (showLanguageDialog) {
        AlertDialog(
            onDismissRequest = { showLanguageDialog = false },
            title = { Text("Tilni tanlang", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(
                        onClick = { selectedLanguage = "uz"; showLanguageDialog = false },
                        shape = RoundedCornerShape(12.dp),
                        color = if (selectedLanguage == "uz") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            "🇺🇿  O'zbekcha" + if (selectedLanguage == "uz") " ✓" else "",
                            modifier = Modifier.padding(14.dp),
                            fontWeight = if (selectedLanguage == "uz") FontWeight.Bold else FontWeight.Normal
                        )
                    }
                    Surface(
                        onClick = { selectedLanguage = "ru"; showLanguageDialog = false },
                        shape = RoundedCornerShape(12.dp),
                        color = if (selectedLanguage == "ru") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            "🇷🇺  Русский" + if (selectedLanguage == "ru") " ✓" else "",
                            modifier = Modifier.padding(14.dp),
                            fontWeight = if (selectedLanguage == "ru") FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showLanguageDialog = false }) { Text("Yopish") }
            }
        )
    }

    // Theme Dialog
    if (showThemeDialog) {
        AlertDialog(
            onDismissRequest = { showThemeDialog = false },
            title = { Text("Mavzu", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        "system" to "📱 Tizim sozlamasi bo'yicha",
                        "light" to "☀️ Yorug' mavzu",
                        "dark" to "🌙 Qorong'u mavzu"
                    ).forEach { (id, label) ->
                        Surface(
                            onClick = { selectedTheme = id; showThemeDialog = false },
                            shape = RoundedCornerShape(12.dp),
                            color = if (selectedTheme == id) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                label + if (selectedTheme == id) " ✓" else "",
                                modifier = Modifier.padding(14.dp),
                                fontWeight = if (selectedTheme == id) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showThemeDialog = false }) { Text("Yopish") }
            }
        )
    }

    // Notification Dialog
    if (showNotificationDialog) {
        AlertDialog(
            onDismissRequest = { showNotificationDialog = false },
            title = { Text("Bildirishnomalar", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Buyurtma holati", fontWeight = FontWeight.SemiBold)
                            Text("Buyurtma qabul qilinganda va tayyor bo'lganda", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(
                            checked = notificationsEnabled,
                            onCheckedChange = { notificationsEnabled = it }
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showNotificationDialog = false }) { Text("Saqlash") }
            }
        )
    }

    // Favorites Dialog
    if (showFavoritesDialog) {
        AlertDialog(
            onDismissRequest = { showFavoritesDialog = false },
            title = { Text("Sevimlilar", fontWeight = FontWeight.Bold) },
            text = {
                Text("Hozircha sevimlilar ro'yxati bo'sh. Mahsulot va do'konlarni keyingi yangilanishda saqlab qo'yishingiz mumkin bo'ladi.")
            },
            confirmButton = {
                TextButton(onClick = { showFavoritesDialog = false }) { Text("Tushundim") }
            }
        )
    }

    // Edit Profile Dialog
    if (showEditProfileDialog) {
        AlertDialog(
            onDismissRequest = {
                if (!isSavingProfile) showEditProfileDialog = false
            },
            title = { Text("Profil ma'lumotlari", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "To'liq ism yoki taxallusingizni kiriting:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    OutlinedTextField(
                        value = newNameInput,
                        onValueChange = {
                            newNameInput = it
                            if (editProfileError != null) editProfileError = null
                        },
                        label = { Text("To'liq ism") },
                        placeholder = { Text("Masalan: Asadbek") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        isError = editProfileError != null,
                        enabled = !isSavingProfile
                    )
                    if (editProfileError != null) {
                        Text(
                            text = editProfileError ?: "",
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val trimmed = newNameInput.trim()
                        if (trimmed.length < 2) {
                            editProfileError = "Ism kamida 2 ta belgidan iborat bo'lishi kerak"
                            return@Button
                        }
                        isSavingProfile = true
                        editProfileError = null
                        coroutineScope.launch {
                            try {
                                onUpdateFullName?.invoke(trimmed)
                                currentFullName = trimmed
                                showEditProfileDialog = false
                            } catch (e: Exception) {
                                editProfileError = e.localizedMessage ?: "Saqlashda xatolik yuz berdi"
                            } finally {
                                isSavingProfile = false
                            }
                        }
                    },
                    enabled = !isSavingProfile
                ) {
                    if (isSavingProfile) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Saqlash")
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showEditProfileDialog = false },
                    enabled = !isSavingProfile
                ) {
                    Text("Bekor qilish")
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Profile header card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Avatar with initials
                    Surface(
                        modifier = Modifier.size(80.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = (currentFullName.ifBlank { email }).firstOrNull()?.uppercase() ?: "U",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                    Text(
                        text = currentFullName.ifBlank { email },
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    if (currentFullName.isNotBlank()) {
                        Text(
                            text = email,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    // Role badge & switch to owner
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                text = "🛒  Xaridor",
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                            )
                        }
                        if (onSwitchToOwner != null) {
                            Surface(
                                onClick = onSwitchToOwner,
                                color = MaterialTheme.colorScheme.secondaryContainer,
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Text(
                                    text = "🏢  Biznesga o'tish →",
                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Quick actions
        item {
            Text(
                text = "Tezkor harakatlar",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 4.dp)
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                if (onSwitchToOwner != null) {
                    ProfileMenuItem(
                        icon = { Text("🏢", fontSize = 20.sp) },
                        title = "Biznes boshqaruvi",
                        subtitle = "Biznes egasi paneliga o'tish",
                        onClick = onSwitchToOwner
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                }
                ProfileMenuItem(
                    icon = { Text("🛍️", fontSize = 20.sp) },
                    title = "Buyurtmalarim",
                    subtitle = "Faol va o'tgan buyurtmalar",
                    onClick = onOrdersClick
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ProfileMenuItem(
                    icon = { Text("❤️", fontSize = 20.sp) },
                    title = "Sevimlilar",
                    subtitle = "Saqlangan mahsulotlar va do'konlar",
                    onClick = { showFavoritesDialog = true }
                )
            }
        }

        // Settings section
        item {
            Text(
                text = "Sozlamalar",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 4.dp)
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                ProfileMenuItem(
                    icon = { Text("👤", fontSize = 20.sp) },
                    title = "Profil ma'lumotlari",
                    subtitle = "Ism: ${currentFullName.ifBlank { "Ko'rsatilmagan" }}",
                    onClick = {
                        newNameInput = currentFullName
                        editProfileError = null
                        showEditProfileDialog = true
                    }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ProfileMenuItem(
                    icon = { Text("🔔", fontSize = 20.sp) },
                    title = "Bildirishnomalar",
                    subtitle = if (notificationsEnabled) "Yoqilgan" else "O'chirilgan",
                    onClick = { showNotificationDialog = true }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ProfileMenuItem(
                    icon = { Text("🌐", fontSize = 20.sp) },
                    title = "Til",
                    subtitle = if (selectedLanguage == "uz") "O'zbekcha" else "Русский",
                    onClick = { showLanguageDialog = true }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ProfileMenuItem(
                    icon = { Text("🌙", fontSize = 20.sp) },
                    title = "Mavzu",
                    subtitle = when (selectedTheme) {
                        "light" -> "Yorug'"
                        "dark" -> "Qorong'u"
                        else -> "Tizim sozlamasi"
                    },
                    onClick = { showThemeDialog = true }
                )
            }
        }

        // About & Support
        item {
            Text(
                text = "Qo'llab-quvvatlash",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 4.dp)
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                ProfileMenuItem(
                    icon = { Icon(Icons.Default.Info, contentDescription = null, tint = MaterialTheme.colorScheme.tertiary) },
                    title = "Ilova haqida",
                    subtitle = "Dasturxon v2.0",
                    onClick = { showAboutDialog = true }
                )
            }
        }

        // Sign out
        item {
            Spacer(Modifier.height(4.dp))
            Button(
                onClick = { showSignOutDialog = true },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer,
                    contentColor = MaterialTheme.colorScheme.onErrorContainer
                )
            ) {
                Text("🚪  Chiqish", fontWeight = FontWeight.SemiBold)
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
fun ProfileMenuItem(
    icon: @Composable () -> Unit,
    title: String,
    subtitle: String? = null,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(42.dp),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant
            ) {
                Box(contentAlignment = Alignment.Center) { icon() }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Text(
                text = "›",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
