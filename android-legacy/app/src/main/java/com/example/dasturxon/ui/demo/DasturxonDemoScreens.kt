package com.example.dasturxon.ui.demo

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.dasturxon.ui.theme.DasturxonTheme

// --- Dizayn ranglari ---
private val PrimaryOrange = Color(0xFFC05621)
private val LightCreamBg = Color(0xFFFDFBF7)
private val CardBg = Color(0xFFFFFFFF)
private val DarkText = Color(0xFF1C1917)
private val MutedText = Color(0xFF78716C)
private val TealAccent = Color(0xFF0E7490)
private val LightTeal = Color(0xFFE0F2FE)
private val SuccessGreen = Color(0xFF2E7D32)
private val BorderColor = Color(0xFFE7E5E4)

// ════════════════════════════════════════════════════════════════════════════
// 01 - XUSH KELIBSIZ (ONBOARDING)
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun WelcomeScreen(
    onStartClick: () -> Unit = {},
    onLoginClick: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightCreamBg)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Spacer(modifier = Modifier.height(20.dp))

        // Rasm kartasi
        Card(
            shape = RoundedCornerShape(28.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF5EBE1)),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "🥖 🥯 🍞", fontSize = 64.sp)
                    Spacer(Modifier.height(12.dp))
                    Surface(
                        color = Color(0xFF2B2118).copy(alpha = 0.75f),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Text(
                            text = "Har kuni yangi non",
                            color = Color.White,
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }

        // Matnlar
        Column(
            horizontalAlignment = Alignment.Start,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "Dasturxon",
                color = PrimaryOrange,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Mahallangiz ta'mi,\nbir ilovada.",
                fontSize = 28.sp,
                lineHeight = 34.sp,
                fontWeight = FontWeight.ExtraBold,
                color = DarkText
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = "Yangi novvoyxona va oshxonalardan yangi mahsulotlarni toping, narxlarni solishtiring.",
                fontSize = 15.sp,
                color = MutedText,
                lineHeight = 22.sp
            )
        }

        // Tugmalar
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onStartClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryOrange)
            ) {
                Text(
                    text = "Boshlash",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Allaqachon hisobingiz bormi? ",
                    color = MutedText,
                    fontSize = 14.sp
                )
                Text(
                    text = "Kirish",
                    color = PrimaryOrange,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    modifier = Modifier.clickable { onLoginClick() }
                )
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 02 - KIRISH (LOGIN)
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun LoginScreen(
    onLoginClick: () -> Unit = {},
    onRegisterClick: () -> Unit = {},
    onOwnerLoginClick: () -> Unit = {}
) {
    var phone by remember { mutableStateOf("+998 90 123 45 67") }
    var password by remember { mutableStateOf("••••••••") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightCreamBg)
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Spacer(modifier = Modifier.height(20.dp))
            Text(
                text = "Dasturxon",
                color = PrimaryOrange,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Xush kelibsiz!",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = DarkText
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Yangi taomlar sizni kutmoqda.\nHisobingizga kiring.",
                fontSize = 14.sp,
                color = MutedText
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Telefon raqami
            Text("Telefon raqami", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = DarkText)
            Spacer(Modifier.height(6.dp))
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryOrange,
                    unfocusedBorderColor = BorderColor,
                    focusedContainerColor = CardBg,
                    unfocusedContainerColor = CardBg
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Parol
            Text("Parol", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = DarkText)
            Spacer(Modifier.height(6.dp))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = { Icon(Icons.Outlined.Info, contentDescription = null, tint = MutedText) },
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryOrange,
                    unfocusedBorderColor = BorderColor,
                    focusedContainerColor = CardBg,
                    unfocusedContainerColor = CardBg
                )
            )

            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                Text(
                    text = "Parolni unutdingizmi?",
                    color = PrimaryOrange,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            Button(
                onClick = onLoginClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryOrange)
            ) {
                Text("Kirish", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Hisobingiz yo'qmi? ", color = MutedText, fontSize = 14.sp)
                Text(
                    text = "Ro'yxatdan o'ting",
                    color = PrimaryOrange,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    modifier = Modifier.clickable { onRegisterClick() }
                )
            }
        }

        // Do'kon egasi card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
                .clickable { onOwnerLoginClick() },
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = LightTeal)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Do'kon egasimisiz?", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TealAccent)
                    Text("Do'kon egasi sifatida kiring", fontSize = 12.sp, color = MutedText)
                }
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = TealAccent)
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 03 - RO'YXATDAN O'TISH (REGISTER)
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun RegisterScreen(
    onRegisterClick: () -> Unit = {},
    onLoginClick: () -> Unit = {}
) {
    var selectedRole by remember { mutableStateOf("customer") }
    var name by remember { mutableStateOf("Azizbek") }
    var phone by remember { mutableStateOf("+998 90 123 45 67") }
    var password by remember { mutableStateOf("••••••••") }
    var agreed by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightCreamBg)
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "Hisob yaratish", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = DarkText)
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = "Dasturxon oilasiga qo'shiling", fontSize = 14.sp, color = MutedText)

        Spacer(modifier = Modifier.height(24.dp))

        // Rol tanlash (Mijoz / Do'kon egasi)
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = Color(0xFFF3EBE1),
            modifier = Modifier.fillMaxWidth().height(48.dp)
        ) {
            Row(modifier = Modifier.padding(4.dp)) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (selectedRole == "customer") CardBg else Color.Transparent)
                        .clickable { selectedRole = "customer" },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "Mijoz",
                        fontWeight = if (selectedRole == "customer") FontWeight.Bold else FontWeight.Normal,
                        color = if (selectedRole == "customer") PrimaryOrange else MutedText,
                        fontSize = 14.sp
                    )
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (selectedRole == "owner") CardBg else Color.Transparent)
                        .clickable { selectedRole = "owner" },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "Do'kon egasi",
                        fontWeight = if (selectedRole == "owner") FontWeight.Bold else FontWeight.Normal,
                        color = if (selectedRole == "owner") PrimaryOrange else MutedText,
                        fontSize = 14.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text("Ismingiz", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = DarkText)
        Spacer(Modifier.height(6.dp))
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PrimaryOrange,
                unfocusedBorderColor = BorderColor,
                focusedContainerColor = CardBg,
                unfocusedContainerColor = CardBg
            )
        )

        Spacer(modifier = Modifier.height(14.dp))

        Text("Telefon raqami", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = DarkText)
        Spacer(Modifier.height(6.dp))
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PrimaryOrange,
                unfocusedBorderColor = BorderColor,
                focusedContainerColor = CardBg,
                unfocusedContainerColor = CardBg
            )
        )

        Spacer(modifier = Modifier.height(14.dp))

        Text("Parol", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = DarkText)
        Spacer(Modifier.height(6.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PrimaryOrange,
                unfocusedBorderColor = BorderColor,
                focusedContainerColor = CardBg,
                unfocusedContainerColor = CardBg
            )
        )
        Text("Kamida 8 ta belgi", fontSize = 11.sp, color = MutedText, modifier = Modifier.padding(top = 4.dp))

        Spacer(modifier = Modifier.height(16.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(
                checked = agreed,
                onCheckedChange = { agreed = it },
                colors = CheckboxDefaults.colors(checkedColor = PrimaryOrange)
            )
            Text(
                "Foydalanish shartlari va maxfiylik siyosatiga roziman",
                fontSize = 12.sp,
                color = DarkText
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onRegisterClick,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryOrange)
        ) {
            Text("Ro'yxatdan o'tish", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Hisobingiz bormi? ", color = MutedText, fontSize = 14.sp)
            Text(
                text = "Kirish",
                color = PrimaryOrange,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                modifier = Modifier.clickable { onLoginClick() }
            )
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 04 - BOSH SAHIFA (HOME)
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun HomeScreen(
    onProductClick: (String) -> Unit = {},
    onCartClick: () -> Unit = {},
    onOrdersClick: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(0) }
    val categories = listOf("Hammasi", "Tandir non", "Somsa", "Shirinliklar", "Osh")

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = CardBg) {
                NavigationBarItem(
                    selected = true,
                    onClick = {},
                    icon = { Icon(Icons.Default.Home, contentDescription = null, tint = PrimaryOrange) },
                    label = { Text("Bosh sahifa", color = PrimaryOrange, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onCartClick,
                    icon = { Icon(Icons.Outlined.ShoppingCart, contentDescription = null, tint = MutedText) },
                    label = { Text("Savat", color = MutedText, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onOrdersClick,
                    icon = { Icon(Icons.Outlined.List, contentDescription = null, tint = MutedText) },
                    label = { Text("Buyurtmalar", color = MutedText, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = {},
                    icon = { Icon(Icons.Outlined.Person, contentDescription = null, tint = MutedText) },
                    label = { Text("Profil", color = MutedText, fontSize = 11.sp) }
                )
            }
        },
        containerColor = LightCreamBg
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Manzil va bildirishnoma
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Yetkazib berish manzili:", fontSize = 11.sp, color = MutedText)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Yunusobod, 4-mavze", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Icon(Icons.Default.KeyboardArrowDown, contentDescription = null, tint = DarkText, modifier = Modifier.size(18.dp))
                    }
                }
                Surface(shape = CircleShape, color = CardBg, shadowElevation = 1.dp) {
                    IconButton(onClick = {}) {
                        Icon(Icons.Outlined.Notifications, contentDescription = null, tint = DarkText)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Qidiruv
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Non, somsa yoki do'kon qidirish...", fontSize = 14.sp, color = MutedText) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MutedText) },
                trailingIcon = { Icon(Icons.Default.Menu, contentDescription = null, tint = PrimaryOrange) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryOrange,
                    unfocusedBorderColor = BorderColor,
                    focusedContainerColor = CardBg,
                    unfocusedContainerColor = CardBg
                )
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Bugun nimani tanlaysiz?
            Text("Bugun nimani tanlaysiz?", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DarkText)
            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEachIndexed { index, cat ->
                    val isSelected = selectedCategory == index
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = if (isSelected) PrimaryOrange else CardBg,
                        border = if (!isSelected) androidx.compose.foundation.BorderStroke(1.dp, BorderColor) else null,
                        modifier = Modifier.clickable { selectedCategory = index }
                    ) {
                        Text(
                            text = cat,
                            color = if (isSelected) Color.White else DarkText,
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Yaqin atrofda
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Yaqin atrofda", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DarkText)
                Text("Barchasi", fontSize = 12.sp, color = PrimaryOrange, fontWeight = FontWeight.SemiBold)
            }
            Spacer(modifier = Modifier.height(10.dp))

            // Baraka novvoyxonasi kartasi
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                elevation = CardDefaults.cardElevation(2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(70.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFF6EADB)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🏪", fontSize = 32.sp)
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Baraka novvoyxonasi", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("⭐ 4.8", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                            Text(" · Ochiq · 20-30 daqiqa", fontSize = 12.sp, color = MutedText)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Yangi va mazali
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Yangi va mazali", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DarkText)
                Text("Barchasi", fontSize = 12.sp, color = PrimaryOrange, fontWeight = FontWeight.SemiBold)
            }
            Spacer(modifier = Modifier.height(12.dp))

            // Mahsulotlar qatori
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // 1. Tandir non
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onProductClick("demo_prod_tandir_non") },
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFFBEFE3)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("🥖", fontSize = 48.sp)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text("Tandir non", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Text("Baraka novvoyxonasi", fontSize = 11.sp, color = MutedText)
                        Spacer(Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("5 000 so'm", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = PrimaryOrange)
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = PrimaryOrange,
                                modifier = Modifier.size(28.dp).clickable { onCartClick() }
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }

                // 2. Go'shtli somsa
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onProductClick("demo_prod_goshtli_somsa") },
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFFBEFE3)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("🥟", fontSize = 48.sp)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text("Go'shtli somsa", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Text("Baraka novvoyxonasi", fontSize = 11.sp, color = MutedText)
                        Spacer(Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("8 000 so'm", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = PrimaryOrange)
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = PrimaryOrange,
                                modifier = Modifier.size(28.dp).clickable { onCartClick() }
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 05 - MAHSULOT (PRODUCT DETAILS + NARX SOLISHTIRISH)
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun ProductDetailDemoScreen(
    onBack: () -> Unit = {},
    onAddToCart: () -> Unit = {}
) {
    var quantity by remember { mutableIntStateOf(1) }

    Scaffold(
        bottomBar = {
            Surface(shadowElevation = 8.dp, color = CardBg) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = onAddToCart,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryOrange)
                    ) {
                        Text(
                            text = "Savatga qo'shish · ${quantity * 5000} so'm",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        },
        containerColor = LightCreamBg
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ) {
            // Rasm va tepa tugmalar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .background(Color(0xFFF7ECE0))
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("🥖", fontSize = 90.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("Tandir obi non", fontSize = 14.sp, color = MutedText)
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Surface(shape = CircleShape, color = CardBg.copy(alpha = 0.9f)) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = DarkText)
                        }
                    }
                    Surface(shape = CircleShape, color = CardBg.copy(alpha = 0.9f)) {
                        IconButton(onClick = {}) {
                            Icon(Icons.Outlined.FavoriteBorder, contentDescription = null, tint = PrimaryOrange)
                        }
                    }
                }
            }

            Column(modifier = Modifier.padding(20.dp)) {
                Text("Tandir non", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = DarkText)
                Spacer(Modifier.height(4.dp))
                Text("Baraka novvoyxonasidan", fontSize = 13.sp, color = TealAccent, fontWeight = FontWeight.Medium)

                Spacer(Modifier.height(14.dp))
                Text("5 000 so'm / dona · 350 g", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = PrimaryOrange)

                Spacer(Modifier.height(16.dp))
                Text(
                    text = "Tandirda pishirilgan, issiq va qarsildoq, tabiiy un mahsulotlaridan tayyorlangan.",
                    fontSize = 14.sp,
                    color = MutedText,
                    lineHeight = 20.sp
                )

                Spacer(Modifier.height(24.dp))

                // Narxlarni solishtirish
                Text("Narxlarni solishtiring", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DarkText)
                Spacer(Modifier.height(10.dp))

                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    elevation = CardDefaults.cardElevation(1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Baraka (12 ta mavjud)", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = DarkText)
                            Text("5 000 so'm", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PrimaryOrange)
                        }
                        HorizontalDivider(color = BorderColor)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Nonvoy (Yunusobod 11)", fontSize = 14.sp, color = MutedText)
                            Text("5 500 so'm", fontSize = 14.sp, color = MutedText)
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))

                // Miqdor
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Miqdor", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = DarkText)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = CircleShape,
                            color = CardBg,
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                            modifier = Modifier.size(36.dp).clickable { if (quantity > 1) quantity-- }
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("-", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = DarkText)
                            }
                        }
                        Text("$quantity", fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp))
                        Surface(
                            shape = CircleShape,
                            color = CardBg,
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                            modifier = Modifier.size(36.dp).clickable { quantity++ }
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("+", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = DarkText)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 06 - SAVAT (CART)
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun CartDemoScreen(
    onBack: () -> Unit = {},
    onCheckoutClick: () -> Unit = {}
) {
    var promoCode by remember { mutableStateOf("") }

    Scaffold(
        bottomBar = {
            Surface(shadowElevation = 8.dp, color = CardBg) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Button(
                        onClick = onCheckoutClick,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryOrange)
                    ) {
                        Text("Buyurtma berishga o'tish", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        },
        containerColor = LightCreamBg
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Tepa bar
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = DarkText)
                }
                Text("Savat", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = DarkText)
                Spacer(Modifier.width(8.dp))
                Surface(color = LightTeal, shape = RoundedCornerShape(10.dp)) {
                    Text("2 ta mahsulot", fontSize = 12.sp, color = TealAccent, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }

            Spacer(Modifier.height(16.dp))

            // Do'kon sarlavhasi
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🏪", fontSize = 16.sp)
                Spacer(Modifier.width(6.dp))
                Text("Baraka novvoyxonasidan", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
            }

            Spacer(Modifier.height(12.dp))

            // Mahsulot 1: Tandir non (2 dona)
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                elevation = CardDefaults.cardElevation(1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(54.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFFBEFE3)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🥖", fontSize = 26.sp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Tandir non", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Text("10 000 so'm", fontSize = 13.sp, color = PrimaryOrange, fontWeight = FontWeight.SemiBold)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("-", fontSize = 16.sp, color = MutedText, modifier = Modifier.padding(horizontal = 8.dp))
                        Text("2", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("+", fontSize = 16.sp, color = MutedText, modifier = Modifier.padding(horizontal = 8.dp))
                    }
                }
            }

            Spacer(Modifier.height(10.dp))

            // Mahsulot 2: Go'shtli somsa (2 dona)
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                elevation = CardDefaults.cardElevation(1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(54.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFFBEFE3)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🥟", fontSize = 26.sp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Go'shtli somsa", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Text("16 000 so'm", fontSize = 13.sp, color = PrimaryOrange, fontWeight = FontWeight.SemiBold)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("-", fontSize = 16.sp, color = MutedText, modifier = Modifier.padding(horizontal = 8.dp))
                        Text("2", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("+", fontSize = 16.sp, color = MutedText, modifier = Modifier.padding(horizontal = 8.dp))
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // Promokod
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = promoCode,
                    onValueChange = { promoCode = it },
                    placeholder = { Text("Promokod kiritish", fontSize = 13.sp, color = MutedText) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryOrange,
                        unfocusedBorderColor = BorderColor,
                        focusedContainerColor = CardBg,
                        unfocusedContainerColor = CardBg
                    )
                )
                Spacer(Modifier.width(8.dp))
                Button(
                    onClick = {},
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryOrange)
                ) {
                    Text("Qo'llash", fontSize = 13.sp, color = Color.White)
                }
            }

            Spacer(Modifier.height(24.dp))

            // Narx hisob-kitobi
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                elevation = CardDefaults.cardElevation(1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Mahsulotlar:", fontSize = 14.sp, color = MutedText)
                        Text("26 000 so'm", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = DarkText)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Yetkazib berish:", fontSize = 14.sp, color = MutedText)
                        Text("10 000 so'm", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = DarkText)
                    }
                    HorizontalDivider(color = BorderColor)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Jami:", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Text("36 000 so'm", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PrimaryOrange)
                    }
                }
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 07 - BUYURTMA BERISH (CHECKOUT)
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun CheckoutDemoScreen(
    onBack: () -> Unit = {},
    onConfirmClick: () -> Unit = {}
) {
    var deliveryType by remember { mutableStateOf("delivery") }
    var paymentMethod by remember { mutableStateOf("cash") }

    Scaffold(
        bottomBar = {
            Surface(shadowElevation = 8.dp, color = CardBg) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Button(
                        onClick = onConfirmClick,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryOrange)
                    ) {
                        Text("Buyurtmani tasdiqlash", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        },
        containerColor = LightCreamBg
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = DarkText)
                }
                Text("Buyurtma berish", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = DarkText)
            }

            Spacer(Modifier.height(16.dp))

            // Yetkazib berish / Olib ketish
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = Color(0xFFF3EBE1),
                modifier = Modifier.fillMaxWidth().height(46.dp)
            ) {
                Row(modifier = Modifier.padding(4.dp)) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (deliveryType == "delivery") CardBg else Color.Transparent)
                            .clickable { deliveryType = "delivery" },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Yetkazib berish", fontWeight = FontWeight.Bold, color = PrimaryOrange, fontSize = 13.sp)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (deliveryType == "pickup") CardBg else Color.Transparent)
                            .clickable { deliveryType = "pickup" },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Olib ketish", fontWeight = FontWeight.Normal, color = MutedText, fontSize = 13.sp)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Manzil kartasi
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("📍", fontSize = 20.sp)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Uy - Yunusobod, 4-mavze", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                            Text("Yetkazib berish manzili", fontSize = 12.sp, color = MutedText)
                        }
                    }
                    Icon(Icons.Default.KeyboardArrowRight, contentDescription = null, tint = MutedText)
                }
            }

            Spacer(Modifier.height(10.dp))

            // Qabul qiluvchi
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("👤", fontSize = 20.sp)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Azizbek Karimov", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                            Text("+998 90 123 45 67", fontSize = 12.sp, color = MutedText)
                        }
                    }
                    Icon(Icons.Default.KeyboardArrowRight, contentDescription = null, tint = MutedText)
                }
            }

            Spacer(Modifier.height(10.dp))

            // Yetkazish vaqti
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("⏰", fontSize = 20.sp)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Eng yaqin vaqtda", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Text("20-30 daqiqa ichida", fontSize = 12.sp, color = TealAccent)
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            Text("To'lov usuli", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = DarkText)
            Spacer(Modifier.height(10.dp))

            // To'lov kartasi
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("💵", fontSize = 20.sp)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Naqd pul", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                            Text("Mahsulotni olganda to'lanadi", fontSize = 12.sp, color = MutedText)
                        }
                    }
                    RadioButton(
                        selected = paymentMethod == "cash",
                        onClick = { paymentMethod = "cash" },
                        colors = RadioButtonDefaults.colors(selectedColor = PrimaryOrange)
                    )
                }
            }

            Spacer(Modifier.height(20.dp))

            // Jami
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("2 xil mahsulot · 4 dona", fontSize = 13.sp, color = MutedText)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Mahsulotlar narxi:", fontSize = 13.sp, color = MutedText)
                        Text("26 000 so'm", fontSize = 13.sp, color = DarkText)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Yetkazib berish:", fontSize = 13.sp, color = MutedText)
                        Text("10 000 so'm", fontSize = 13.sp, color = DarkText)
                    }
                    HorizontalDivider(color = BorderColor)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Jami:", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Text("36 000 so'm", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PrimaryOrange)
                    }
                }
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 08 - BUYURTMALAR (ORDERS)
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun OrdersDemoScreen(
    onBack: () -> Unit = {}
) {
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        containerColor = LightCreamBg
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            Text("Buyurtmalarim", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DarkText)
            Spacer(Modifier.height(14.dp))

            // Tablar [Faol (1)] / [Tugallangan]
            Row(modifier = Modifier.fillMaxWidth()) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (selectedTab == 0) PrimaryOrange else Color.Transparent,
                    modifier = Modifier.clickable { selectedTab = 0 }
                ) {
                    Text(
                        "Faol (1)",
                        color = if (selectedTab == 0) Color.White else MutedText,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
                Spacer(Modifier.width(8.dp))
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (selectedTab == 1) PrimaryOrange else Color.Transparent,
                    modifier = Modifier.clickable { selectedTab = 1 }
                ) {
                    Text(
                        "Tugallangan",
                        color = if (selectedTab == 1) Color.White else MutedText,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // 1. FAOL BUYURTMA №2715
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                elevation = CardDefaults.cardElevation(2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Buyurtma №2715", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Surface(color = Color(0xFFFEF3C7), shape = RoundedCornerShape(8.dp)) {
                            Text("Tayyorlanmoqda", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFFB45309), modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(modifier = Modifier.size(44.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFFBEFE3)), contentAlignment = Alignment.Center) {
                                Text("🥖", fontSize = 22.sp)
                            }
                            Box(modifier = Modifier.size(44.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFFBEFE3)), contentAlignment = Alignment.Center) {
                                Text("🥟", fontSize = 22.sp)
                            }
                        }
                        Text("36 000 so'm", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = PrimaryOrange)
                    }

                    Spacer(Modifier.height(16.dp))

                    // Stepper status
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        StatusStepItem("Qabul qilindi", isCompleted = true, isActive = false)
                        StepDivider(isCompleted = true)
                        StatusStepItem("Tayyorlanmoqda", isCompleted = false, isActive = true)
                        StepDivider(isCompleted = false)
                        StatusStepItem("Yetkazilmoqda", isCompleted = false, isActive = false)
                        StepDivider(isCompleted = false)
                        StatusStepItem("Yetkazildi", isCompleted = false, isActive = false)
                    }

                    Spacer(Modifier.height(16.dp))
                    Text("Yetkazish: Bugun, 12:30 - 13:00 oralig'ida", fontSize = 12.sp, color = MutedText)

                    Spacer(Modifier.height(14.dp))
                    OutlinedButton(
                        onClick = {},
                        modifier = Modifier.fillMaxWidth().height(44.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryOrange)
                    ) {
                        Text("Buyurtmani kuzatish", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // 2. SO'NGGI BUYURTMA №2698
            Text("So'nggi buyurtma", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DarkText)
            Spacer(Modifier.height(10.dp))

            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = CardBg),
                elevation = CardDefaults.cardElevation(1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Buyurtma №2698", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                        Text("Yetkazildi", fontSize = 12.sp, color = SuccessGreen, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(38.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFFBEFE3)), contentAlignment = Alignment.Center) {
                                Text("🥖", fontSize = 18.sp)
                            }
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text("Tandir non · 2 dona", fontSize = 13.sp, fontWeight = FontWeight.Medium, color = DarkText)
                                Text("Baraka novvoyxonasidan", fontSize = 11.sp, color = MutedText)
                            }
                        }
                        Text("25 000 so'm", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DarkText)
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        Text("Qayta buyurtma", fontSize = 12.sp, color = PrimaryOrange, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { })
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusStepItem(title: String, isCompleted: Boolean, isActive: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(16.dp)
                .clip(CircleShape)
                .background(
                    when {
                        isCompleted -> PrimaryOrange
                        isActive -> PrimaryOrange
                        else -> Color(0xFFD6D3D1)
                    }
                )
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = title,
            fontSize = 9.sp,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
            color = if (isActive || isCompleted) DarkText else MutedText,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun StepDivider(isCompleted: Boolean) {
    Box(
        modifier = Modifier
            .width(28.dp)
            .height(2.dp)
            .background(if (isCompleted) PrimaryOrange else Color(0xFFE7E5E4))
    )
}

// ════════════════════════════════════════════════════════════════════════════
// BARCHA OYNALARNI KO'RISH UCHUN ASOSIY DEMO FLOW
// ════════════════════════════════════════════════════════════════════════════
@Composable
fun DasturxonFullDemoApp(onCloseDemo: () -> Unit = {}) {
    var currentScreenIndex by remember { mutableIntStateOf(0) }

    Column(modifier = Modifier.fillMaxSize()) {
        // Yuqori Demo boshqaruv paneli (Android Studio orqali tekshirish uchun o'ta qulay!)
        Surface(
            color = Color(0xFF292524),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📱 Dizayndagi 8 ta UI oyna:",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Chiqish ✖",
                        color = Color(0xFFFCA5A5),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable { onCloseDemo() }
                    )
                }
                Spacer(Modifier.height(4.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    val screens = listOf(
                        "01.Xush kelibsiz",
                        "02.Kirish",
                        "03.Ro'yxatdan",
                        "04.Bosh sahifa",
                        "05.Mahsulot",
                        "06.Savat",
                        "07.Buyurtma",
                        "08.Buyurtmalarim"
                    )
                    screens.forEachIndexed { idx, name ->
                        val isSelected = currentScreenIndex == idx
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = if (isSelected) PrimaryOrange else Color(0xFF44403C),
                            modifier = Modifier.clickable { currentScreenIndex = idx }
                        ) {
                            Text(
                                text = name,
                                fontSize = 10.sp,
                                color = Color.White,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                            )
                        }
                    }
                }
            }
        }

        // Oynani ko'rsatish
        Box(modifier = Modifier.weight(1f)) {
            when (currentScreenIndex) {
                0 -> WelcomeScreen(
                    onStartClick = { currentScreenIndex = 3 },
                    onLoginClick = { currentScreenIndex = 1 }
                )
                1 -> LoginScreen(
                    onLoginClick = { currentScreenIndex = 3 },
                    onRegisterClick = { currentScreenIndex = 2 },
                    onOwnerLoginClick = { currentScreenIndex = 3 }
                )
                2 -> RegisterScreen(
                    onRegisterClick = { currentScreenIndex = 3 },
                    onLoginClick = { currentScreenIndex = 1 }
                )
                3 -> HomeScreen(
                    onProductClick = { currentScreenIndex = 4 },
                    onCartClick = { currentScreenIndex = 5 },
                    onOrdersClick = { currentScreenIndex = 7 }
                )
                4 -> ProductDetailDemoScreen(
                    onBack = { currentScreenIndex = 3 },
                    onAddToCart = { currentScreenIndex = 5 }
                )
                5 -> CartDemoScreen(
                    onBack = { currentScreenIndex = 3 },
                    onCheckoutClick = { currentScreenIndex = 6 }
                )
                6 -> CheckoutDemoScreen(
                    onBack = { currentScreenIndex = 5 },
                    onConfirmClick = { currentScreenIndex = 7 }
                )
                7 -> OrdersDemoScreen(
                    onBack = { currentScreenIndex = 3 }
                )
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// ANDROID STUDIO COMPOSE PREVIEWS (Android Studioda darhol ko'rish uchun)
// ════════════════════════════════════════════════════════════════════════════

@Preview(showBackground = true, name = "01 - Xush kelibsiz")
@Composable
fun PreviewWelcomeScreen() {
    DasturxonTheme { WelcomeScreen() }
}

@Preview(showBackground = true, name = "02 - Kirish")
@Composable
fun PreviewLoginScreen() {
    DasturxonTheme { LoginScreen() }
}

@Preview(showBackground = true, name = "03 - Ro'yxatdan o'tish")
@Composable
fun PreviewRegisterScreen() {
    DasturxonTheme { RegisterScreen() }
}

@Preview(showBackground = true, name = "04 - Bosh sahifa")
@Composable
fun PreviewHomeScreen() {
    DasturxonTheme { HomeScreen() }
}

@Preview(showBackground = true, name = "05 - Mahsulot")
@Composable
fun PreviewProductScreen() {
    DasturxonTheme { ProductDetailDemoScreen() }
}

@Preview(showBackground = true, name = "06 - Savat")
@Composable
fun PreviewCartScreen() {
    DasturxonTheme { CartDemoScreen() }
}

@Preview(showBackground = true, name = "07 - Buyurtma berish")
@Composable
fun PreviewCheckoutScreen() {
    DasturxonTheme { CheckoutDemoScreen() }
}

@Preview(showBackground = true, name = "08 - Buyurtmalarim")
@Composable
fun PreviewOrdersScreen() {
    DasturxonTheme { OrdersDemoScreen() }
}
