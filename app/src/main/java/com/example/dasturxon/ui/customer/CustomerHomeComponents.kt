package com.example.dasturxon.ui.customer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import kotlin.math.cos
import kotlin.math.sin

// ─── PROMO BANNER DATA MODEL ──────────────────────────────────────────────────

enum class BannerKind {
    BREAD,
    SOMSA,
    CAKE,
    PLOV
}

data class PromoBanner(
    val id: String,
    val tag: String,
    val title: String,
    val subtitle: String,
    val badge: String,
    val businessName: String,
    val kind: BannerKind,
    val bgGradient: List<Color>,
    val buttonText: String = "Buyurtma berish"
)

val demoPromoBanners = listOf(
    PromoBanner(
        id = "promo_patir",
        tag = "AKSIYA -15%",
        title = "Issiq Tandir Nonlar",
        subtitle = "Baraka novvoyxonasida barcha patirlarga maxsus chegirma",
        badge = "● Hozir issiq",
        businessName = "Baraka novvoyxonasi",
        kind = BannerKind.BREAD,
        bgGradient = listOf(Color(0xFF8B4513), Color(0xFFD2691E), Color(0xFFF4A460))
    ),
    PromoBanner(
        id = "promo_somsa",
        tag = "ENG SARA",
        title = "Qarsildoq Tandir Somsa",
        subtitle = "Bodomzor Somsa: mayin mol go'shti va qatlama xamirdan",
        badge = "⏱ 15 daqiqada",
        businessName = "Bodomzor Somsa & Tandir",
        kind = BannerKind.SOMSA,
        bgGradient = listOf(Color(0xFF7A3803), Color(0xFFB85D19), Color(0xFFE08E45))
    ),
    PromoBanner(
        id = "promo_cake",
        tag = "YANGI ASSORTIMENT",
        title = "Safia Shirinliklari",
        subtitle = "Bayramona medovik, yangi mevali tortlar va desertlar",
        badge = "⭐ 4.9 Reyting",
        businessName = "Safia Qandolatxonasi",
        kind = BannerKind.CAKE,
        bgGradient = listOf(Color(0xFF6B1736), Color(0xFF9E2A54), Color(0xFFCC5A84))
    ),
    PromoBanner(
        id = "promo_plov",
        tag = "MAXSUS TAYYORLANGAN",
        title = "Chilonzor To'y Oshi",
        subtitle = "Har kuni soat 12:00 da damlangan issiq to'y oshi va qazi",
        badge = "🔥 Issiq damlangan",
        businessName = "Chilonzor Osh Markazi",
        kind = BannerKind.PLOV,
        bgGradient = listOf(Color(0xFF1E3A2F), Color(0xFF2E5E4C), Color(0xFF4A8C73))
    )
)

// ─── PROMO BANNER CAROUSEL ────────────────────────────────────────────────────

@Composable
fun PromoBannersCarousel(
    banners: List<PromoBanner> = demoPromoBanners,
    onBannerClick: (PromoBanner) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text("🔥", fontSize = 18.sp)
                Text(
                    text = "Aksiyalar va Yangiliklar",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Reklama",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            items(banners, key = { it.id }) { banner ->
                PromoBannerCard(
                    banner = banner,
                    onClick = { onBannerClick(banner) }
                )
            }
        }
    }
}

@Composable
fun PromoBannerCard(
    banner: PromoBanner,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(320.dp)
            .height(175.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(22.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.horizontalGradient(banner.bgGradient))
        ) {
            // Subtle geometric background art
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                drawCircle(
                    color = Color.White.copy(alpha = 0.06f),
                    radius = h * 0.9f,
                    center = Offset(w * 0.9f, h * 0.5f)
                )
                drawCircle(
                    color = Color.White.copy(alpha = 0.04f),
                    radius = h * 1.3f,
                    center = Offset(w * 0.9f, h * 0.5f)
                )
            }

            // Left side: Text & Call to action
            Column(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(190.dp)
                    .padding(16.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Surface(
                        color = Color.White.copy(alpha = 0.25f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = banner.tag,
                            color = Color.White,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }

                    Text(
                        text = banner.title,
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        lineHeight = 20.sp
                    )

                    Text(
                        text = banner.subtitle,
                        color = Color.White.copy(alpha = 0.85f),
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.White,
                    shadowElevation = 2.dp
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = banner.buttonText,
                            color = Color(0xFF332014),
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text("→", color = Color(0xFF332014), fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Right side: Realistic food illustration artwork
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 10.dp)
                    .size(115.dp)
            ) {
                when (banner.kind) {
                    BannerKind.BREAD -> RealisticNonArt(modifier = Modifier.fillMaxSize())
                    BannerKind.SOMSA -> RealisticSomsaArt(modifier = Modifier.fillMaxSize())
                    BannerKind.CAKE -> RealisticCakeArt(modifier = Modifier.fillMaxSize())
                    BannerKind.PLOV -> RealisticPlovArt(modifier = Modifier.fillMaxSize())
                }
            }

            // Top right badge
            Surface(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(10.dp),
                color = Color.Black.copy(alpha = 0.35f),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(
                    text = banner.badge,
                    color = Color.White,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }
        }
    }
}

// ─── REALISTIC FOOD ARTWORK COMPONENTS ────────────────────────────────────────

@Composable
fun ProductVisualArt(
    productName: String,
    businessType: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFFFFF9F3),
                        Color(0xFFF7ECDF)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        val lower = productName.lowercase()
        when {
            lower.contains("non") || lower.contains("patir") || lower.contains("kulcha") -> {
                RealisticNonArt(modifier = Modifier.size(95.dp))
            }
            lower.contains("somsa") || lower.contains("qatlama") -> {
                RealisticSomsaArt(modifier = Modifier.size(95.dp))
            }
            lower.contains("osh") || lower.contains("palov") -> {
                RealisticPlovArt(modifier = Modifier.size(95.dp))
            }
            lower.contains("tort") || lower.contains("pishiriq") || lower.contains("medovik") || lower.contains("shirin") -> {
                RealisticCakeArt(modifier = Modifier.size(95.dp))
            }
            lower.contains("choy") || lower.contains("sharbat") || lower.contains("suv") -> {
                RealisticTeapotArt(modifier = Modifier.size(95.dp))
            }
            else -> {
                Text(
                    text = when (businessType) {
                        "bakery" -> "🥖"
                        "pastry" -> "🥟"
                        "confectionery" -> "🍰"
                        "kitchen" -> "🍲"
                        else -> "🍽️"
                    },
                    fontSize = 48.sp
                )
            }
        }
    }
}

/**
 * Realistic Uzbek Patir Non illustration:
 * Golden crust with concentric circles, chekich center stamps, and sesame seeds.
 */
@Composable
fun RealisticNonArt(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val cy = h / 2f
        val radius = (w.coerceAtMost(h) / 2f) * 0.9f

        // Soft drop shadow
        drawCircle(
            color = Color(0x33000000),
            radius = radius * 1.02f,
            center = Offset(cx, cy + 4f)
        )

        // Outer rim (thick puffed bread crust)
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFF7C880), Color(0xFFD68B34), Color(0xFF9E5212)),
                center = Offset(cx, cy),
                radius = radius
            ),
            radius = radius,
            center = Offset(cx, cy)
        )

        // Highlight shine on crust
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0x55FFF2CC), Color(0x00FFF2CC)),
                center = Offset(cx - radius * 0.35f, cy - radius * 0.35f),
                radius = radius * 0.6f
            ),
            radius = radius * 0.85f,
            center = Offset(cx, cy)
        )

        // Pressed inner circle (non markazi)
        val innerRadius = radius * 0.68f
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFE5B569), Color(0xFFBC7628)),
                center = Offset(cx, cy),
                radius = innerRadius
            ),
            radius = innerRadius,
            center = Offset(cx, cy)
        )

        // Chekich ring 1
        drawCircle(
            color = Color(0xFF7A3907),
            radius = innerRadius * 0.8f,
            center = Offset(cx, cy),
            style = Stroke(width = 2.5f)
        )

        // Chekich dots pattern
        val dotRadius = 3f
        val dotColor = Color(0xFF5A2703)
        // Center dot
        drawCircle(color = dotColor, radius = dotRadius * 1.2f, center = Offset(cx, cy))
        // Ring of 8 dots
        for (i in 0 until 8) {
            val angle = (i * Math.PI / 4).toFloat()
            val dx = cx + (innerRadius * 0.35f) * cos(angle)
            val dy = cy + (innerRadius * 0.35f) * sin(angle)
            drawCircle(color = dotColor, radius = dotRadius, center = Offset(dx, dy))
        }
        // Ring of 16 dots
        for (i in 0 until 16) {
            val angle = (i * Math.PI / 8).toFloat()
            val dx = cx + (innerRadius * 0.62f) * cos(angle)
            val dy = cy + (innerRadius * 0.62f) * sin(angle)
            drawCircle(color = dotColor, radius = dotRadius, center = Offset(dx, dy))
        }

        // White sesame (kunjut) seeds
        val sesamePositions = listOf(
            Offset(cx + radius * 0.72f, cy - radius * 0.15f),
            Offset(cx - radius * 0.7f, cy + radius * 0.2f),
            Offset(cx + radius * 0.45f, cy + radius * 0.65f),
            Offset(cx - radius * 0.3f, cy - radius * 0.7f),
            Offset(cx + radius * 0.2f, cy - radius * 0.75f),
            Offset(cx - radius * 0.65f, cy - radius * 0.35f)
        )
        sesamePositions.forEach { pos ->
            drawCircle(color = Color(0xFFFFFDF5), radius = 3.5f, center = pos)
            drawCircle(color = Color(0xFF1E1711), radius = 2f, center = Offset(pos.x + 5f, pos.y + 4f))
        }
    }
}

/**
 * Realistic Tandir Somsa illustration:
 * Flaky triangular baked pastry with golden glaze and black cumin (sedana).
 */
@Composable
fun RealisticSomsaArt(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val cy = h / 2f

        // Triangular somsa path
        val top = Offset(cx, cy - h * 0.42f)
        val left = Offset(cx - w * 0.42f, cy + h * 0.36f)
        val right = Offset(cx + w * 0.42f, cy + h * 0.36f)

        val somsaPath = Path().apply {
            moveTo(top.x, top.y)
            quadraticTo(cx + w * 0.25f, cy - h * 0.1f, right.x, right.y)
            quadraticTo(cx, cy + h * 0.42f, left.x, left.y)
            quadraticTo(cx - w * 0.25f, cy - h * 0.1f, top.x, top.y)
            close()
        }

        // Shadow
        drawPath(
            path = somsaPath,
            color = Color(0x33000000)
        )

        // Baked golden body
        drawPath(
            path = somsaPath,
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFCD692), Color(0xFFD6882E), Color(0xFF9E4E08)),
                center = Offset(cx, cy)
            )
        )

        // Flaky pastry layers
        val layerPath = Path().apply {
            moveTo(cx - w * 0.2f, cy - h * 0.15f)
            quadraticTo(cx, cy + h * 0.1f, cx + w * 0.22f, cy - h * 0.12f)
        }
        drawPath(path = layerPath, color = Color(0xFF7A3600), style = Stroke(width = 3f))

        // Black cumin (sedana) seeds
        val seeds = listOf(
            Offset(cx, cy - h * 0.1f),
            Offset(cx - 15f, cy + 10f),
            Offset(cx + 18f, cy + 12f),
            Offset(cx - 8f, cy - 20f),
            Offset(cx + 10f, cy - 5f),
            Offset(cx + 25f, cy - 18f),
            Offset(cx - 24f, cy + 5f)
        )
        seeds.forEach { pt ->
            drawCircle(color = Color(0xFF1A1410), radius = 3f, center = pt)
        }
    }
}

/**
 * Realistic Confectionery Cake illustration:
 * Layered chocolate/honey cake slice with glaze and berry.
 */
@Composable
fun RealisticCakeArt(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val cy = h / 2f

        // Cake base layers
        val cakePath = Path().apply {
            moveTo(cx - w * 0.38f, cy - h * 0.15f)
            lineTo(cx + w * 0.38f, cy - h * 0.35f)
            lineTo(cx + w * 0.38f, cy + h * 0.25f)
            lineTo(cx - w * 0.38f, cy + h * 0.42f)
            close()
        }

        drawPath(
            path = cakePath,
            brush = Brush.verticalGradient(
                colors = listOf(Color(0xFFC77A38), Color(0xFF7E3E11), Color(0xFF532407))
            )
        )

        // Cream stripes
        drawLine(
            color = Color(0xFFFFF2DC),
            start = Offset(cx - w * 0.38f, cy + h * 0.05f),
            end = Offset(cx + w * 0.38f, cy - h * 0.08f),
            strokeWidth = 5f
        )
        drawLine(
            color = Color(0xFFFFF2DC),
            start = Offset(cx - w * 0.38f, cy + h * 0.25f),
            end = Offset(cx + w * 0.38f, cy + h * 0.12f),
            strokeWidth = 5f
        )

        // Top glossy strawberry / cherry
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFF5252), Color(0xFFB71C1C)),
                center = Offset(cx - 2f, cy - h * 0.3f)
            ),
            radius = 14f,
            center = Offset(cx, cy - h * 0.32f)
        )
        // Green leaf
        drawCircle(
            color = Color(0xFF4CAF50),
            radius = 5f,
            center = Offset(cx - 6f, cy - h * 0.4f)
        )
    }
}

/**
 * Realistic Uzbek Plov in traditional lagan plate.
 */
@Composable
fun RealisticPlovArt(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val cy = h / 2f

        // Ceramic Lagan plate
        drawOval(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFF5F9F6), Color(0xFF1E88E5), Color(0xFF0D47A1))
            ),
            topLeft = Offset(cx - w * 0.45f, cy - h * 0.35f),
            size = Size(w * 0.9f, h * 0.7f)
        )

        // Heap of golden devzira rice
        drawOval(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFFD54F), Color(0xFFFFA000), Color(0xFFE65100))
            ),
            topLeft = Offset(cx - w * 0.35f, cy - h * 0.28f),
            size = Size(w * 0.7f, h * 0.55f)
        )

        // Meat chunks & quail eggs
        drawRoundRect(
            color = Color(0xFF5D240E),
            topLeft = Offset(cx - 18f, cy - 14f),
            size = Size(36f, 24f),
            cornerRadius = CornerRadius(6f)
        )
        drawCircle(
            color = Color(0xFFFFFDE7),
            radius = 8f,
            center = Offset(cx + 20f, cy + 4f)
        )
        drawCircle(
            color = Color(0xFFFFB300),
            radius = 4f,
            center = Offset(cx + 20f, cy + 4f)
        )
    }
}

/**
 * Realistic Uzbek Teapot (choynak).
 */
@Composable
fun RealisticTeapotArt(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val cy = h / 2f

        // Body of teapot
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFFFFFF), Color(0xFFE3F2FD), Color(0xFF1976D2))
            ),
            radius = w * 0.32f,
            center = Offset(cx, cy)
        )
        // Spout
        drawOval(
            color = Color(0xFF1565C0),
            topLeft = Offset(cx + w * 0.22f, cy - 14f),
            size = Size(24f, 16f)
        )
        // Lid knob
        drawCircle(
            color = Color(0xFFFFD700),
            radius = 6f,
            center = Offset(cx, cy - w * 0.32f - 4f)
        )
    }
}

// ─── NOTIFICATION SYSTEM DATA & DIALOG ────────────────────────────────────────

data class AppNotification(
    val id: String,
    val title: String,
    val message: String,
    val timeAgo: String,
    val icon: String,
    var isRead: Boolean = false,
    val targetTab: Int? = null,
    val type: NotificationType = NotificationType.INFO
)

enum class NotificationType {
    ORDER,
    PROMO,
    SYSTEM,
    INFO
}

@Composable
fun NotificationsDialog(
    notifications: List<AppNotification>,
    onDismiss: () -> Unit,
    onNotificationClick: (AppNotification) -> Unit,
    onMarkAllAsRead: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.75f),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            modifier = Modifier.size(36.dp),
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("🔔", fontSize = 18.sp)
                            }
                        }
                        Column {
                            Text(
                                text = "Bildirishnomalar",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            val unreadCount = notifications.count { !it.isRead }
                            Text(
                                text = if (unreadCount > 0) "$unreadCount ta yangi" else "Barchasi o'qilgan",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (unreadCount > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Yopish")
                    }
                }

                Spacer(Modifier.height(12.dp))

                // Actions bar
                if (notifications.any { !it.isRead }) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(
                            onClick = onMarkAllAsRead,
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Icon(Icons.Default.DoneAll, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Barchasini o'qish", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

                // Notification items
                if (notifications.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text("🔕", fontSize = 48.sp)
                            Text(
                                text = "Hozircha bildirishnomalar yo'q",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        items(notifications, key = { it.id }) { notif ->
                            NotificationCard(
                                notification = notif,
                                onClick = { onNotificationClick(notif) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NotificationCard(
    notification: AppNotification,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        color = if (!notification.isRead)
            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = if (!notification.isRead)
            androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
        else null,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Surface(
                modifier = Modifier.size(40.dp),
                shape = CircleShape,
                color = when (notification.type) {
                    NotificationType.ORDER -> MaterialTheme.colorScheme.primaryContainer
                    NotificationType.PROMO -> MaterialTheme.colorScheme.tertiaryContainer
                    else -> MaterialTheme.colorScheme.surface
                }
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(notification.icon, fontSize = 20.sp)
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = notification.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = if (!notification.isRead) FontWeight.Bold else FontWeight.SemiBold
                    )
                    if (!notification.isRead) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary)
                        )
                    }
                }

                Spacer(Modifier.height(4.dp))

                Text(
                    text = notification.message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(Modifier.height(6.dp))

                Text(
                    text = notification.timeAgo,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            }
        }
    }
}
