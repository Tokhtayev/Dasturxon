package com.example.dasturxon.ui.customer

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.dasturxon.core.designsystem.ShopAvatar
import com.example.dasturxon.data.model.Business

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShopDetailScreen(
    business: Business,
    productCount: Int,
    hotReadyCount: Int,
    onBack: () -> Unit,
    onSeeProductsClick: () -> Unit,
    onCallClick: () -> Unit,
    onMapClick: () -> Unit
) {
    BackHandler(onBack = onBack)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(business.name) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Orqaga")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Header Card (Avatar, Title, Type, Stats)
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ShopAvatar(name = business.name, size = 72)
                        Text(
                            text = business.name,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        // Type chip
                        Surface(
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                text = businessTypeLabel(business.type),
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }

                        // Stats Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            StatItem(value = productCount.toString(), label = "Mahsulot")
                            VerticalDivider(modifier = Modifier.height(32.dp))
                            StatItem(
                                value = if (hotReadyCount > 0) hotReadyCount.toString() else "0",
                                label = "Hozir mavjud",
                                valueColor = if (hotReadyCount > 0) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            VerticalDivider(modifier = Modifier.height(32.dp))
                            StatItem(value = "✓", label = "Tasdiqlangan", valueColor = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }

            // 2. Action Buttons (See products & Call)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onSeeProductsClick,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Mahsulotlarni ko'rish")
                    }
                    if (business.phone.isNotBlank()) {
                        OutlinedButton(
                            onClick = onCallClick,
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text("📞")
                        }
                    }
                }
            }

            // 3. Phone Card
            if (business.phone.isNotBlank()) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "📞  Telefon",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = business.phone,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            FilledTonalButton(
                                onClick = onCallClick,
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Qo'ng'iroq")
                            }
                        }
                    }
                }
            }

            // 4. About Note Card
            if (!business.typeNote.isNullOrBlank()) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Haqida",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = business.typeNote,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // 5. OLX-Style Map & Address Card (Placed at the very bottom)
            if (business.address.isNotBlank()) {
                item {
                    Card(
                        onClick = onMapClick,
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Text(
                                text = "Joylashuv",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("📍", fontSize = 18.sp)
                                Text(
                                    text = business.address,
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }

                            // OLX Style Map Preview Box
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFFDDE6D8))
                                    .clickable { onMapClick() },
                                contentAlignment = Alignment.Center
                            ) {
                                // Draw Map Canvas graphics (streets + park + river + OLX location radius circle)
                                Canvas(modifier = Modifier.fillMaxSize()) {
                                    val w = size.width
                                    val h = size.height

                                    // Terrain background
                                    drawRect(color = Color(0xFFDDE6D8))

                                    // Green Park block
                                    drawRoundRect(
                                        color = Color(0xFFCCE0C6),
                                        topLeft = Offset(w * 0.1f, h * 0.15f),
                                        size = Size(w * 0.35f, h * 0.45f),
                                        cornerRadius = CornerRadius(12.dp.toPx())
                                    )

                                    // Water/River curve
                                    val riverPath = Path().apply {
                                        moveTo(0f, h * 0.85f)
                                        cubicTo(w * 0.3f, h * 0.9f, w * 0.6f, h * 0.7f, w, h * 0.75f)
                                    }
                                    drawPath(
                                        path = riverPath,
                                        color = Color(0xFFB5D5E6),
                                        style = Stroke(width = 14.dp.toPx())
                                    )

                                    // Main Streets & Roads
                                    drawRect(color = Color(0xFFF7FAF4), topLeft = Offset(0f, h * 0.35f), size = Size(w, 20.dp.toPx()))
                                    drawRect(color = Color(0xFFFFFFFF), topLeft = Offset(w * 0.52f, 0f), size = Size(32.dp.toPx(), h))
                                    drawRect(color = Color(0xFFFFFFFF), topLeft = Offset(0f, h * 0.62f), size = Size(w, 28.dp.toPx()))

                                    // OLX Location Radius Circle overlay
                                    drawCircle(
                                        color = Color(0x33B7500A),
                                        radius = 42.dp.toPx(),
                                        center = Offset(w * 0.52f, h * 0.48f)
                                    )
                                    drawCircle(
                                        color = Color(0xFFB7500A),
                                        radius = 6.dp.toPx(),
                                        center = Offset(w * 0.52f, h * 0.48f)
                                    )
                                }

                                // Location Pin Callout Badge
                                Surface(
                                    modifier = Modifier.padding(bottom = 24.dp),
                                    color = MaterialTheme.colorScheme.primary,
                                    shape = RoundedCornerShape(20.dp),
                                    shadowElevation = 6.dp
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Text("📍", fontSize = 14.sp)
                                        Text(
                                            text = business.name,
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onPrimary
                                        )
                                    }
                                }
                            }

                            // OLX Full Width "Xaritada ko'rsatish" Action Button
                            Button(
                                onClick = onMapClick,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primary
                                )
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text("🗺️", fontSize = 18.sp)
                                    Text("Xaritada ko'rsatish", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatItem(
    value: String,
    label: String,
    valueColor: Color = Color.Unspecified
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = if (valueColor == Color.Unspecified) MaterialTheme.colorScheme.onSurface else valueColor
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun businessTypeLabel(type: String): String = when (type) {
    "bakery" -> "🥖 Nonvoyxona"
    "confectionery" -> "🍬 Qandolatxona"
    "pastry" -> "🍰 Pishiriq"
    "teahouse" -> "🍵 Choyxona"
    "kitchen" -> "🍲 Oshxona"
    "cafe" -> "☕ Kafe"
    else -> "🍽️ Boshqa"
}
