package com.example.dasturxon.ui.customer

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.dasturxon.core.common.MoneyFormatter
import com.example.dasturxon.core.designsystem.DiscountBadge
import com.example.dasturxon.core.designsystem.LiveBadge
import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.Product
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailScreen(
    product: Product,
    business: Business?,
    onBack: () -> Unit,
    onOrderClick: (Product) -> Unit,
    onBusinessClick: ((Business) -> Unit)? = null
) {
    val context = LocalContext.current
    val isDiscountActive = product.discountPercent > 0 &&
        (product.discountEndsAt == null || product.discountEndsAt.toDate().after(Date()))
    val effectivePrice = if (isDiscountActive) {
        product.price - product.price * product.discountPercent / 100L
    } else product.price

    val isAvailable = product.status in listOf("available", "hot_ready")
    val isHotReady = product.status == "hot_ready"
    val isSoldOut = product.status == "sold_out"

    BackHandler(onBack = onBack)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Orqaga"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, "${product.name} — ${MoneyFormatter.formatSoM(effectivePrice)} | Dasturxon orqali buyurtma bering")
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "Ulashish"))
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "Ulashish")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            Surface(
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .navigationBarsPadding(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        if (isDiscountActive) {
                            Text(
                                text = MoneyFormatter.formatSoM(product.price),
                                style = MaterialTheme.typography.bodySmall.copy(
                                    textDecoration = TextDecoration.LineThrough
                                ),
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                        Text(
                            text = MoneyFormatter.formatSoM(effectivePrice),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Button(
                        onClick = { onOrderClick(product) },
                        enabled = isAvailable && !isSoldOut,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.height(52.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text(
                            text = when {
                                isSoldOut -> "Tugagan"
                                !isAvailable -> "Mavjud emas"
                                else -> "Buyurtma berish"
                            },
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ) {
            // Hero Image / Placeholder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            ) {
                // Type-colored gradient + food icon placeholder
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                                    MaterialTheme.colorScheme.primaryContainer
                                )
                            )
                        )
                )
                Text(
                    text = productEmoji(product),
                    fontSize = 80.sp,
                    modifier = Modifier.align(Alignment.Center)
                )

                // Badges top-start
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (isHotReady) {
                        LiveBadge(text = "● Hozir mavjud")
                    }
                    if (isDiscountActive) {
                        DiscountBadge(discountPercent = product.discountPercent)
                    }
                }

                // Stock warning
                if (product.stock != null && product.stock <= 5 && !isSoldOut) {
                    Surface(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(12.dp),
                        color = MaterialTheme.colorScheme.errorContainer,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "Faqat ${product.stock} ta qoldi!",
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                // Sold out overlay
                if (isSoldOut) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.4f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(
                            color = MaterialTheme.colorScheme.errorContainer,
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = "Tugagan",
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                        }
                    }
                }
            }

            // Content
            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Title & Business
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = product.name,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = product.businessName.ifBlank { "Mahalliy do'kon" },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }

                // Price Block
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            if (isDiscountActive) {
                                Text(
                                    text = MoneyFormatter.formatSoM(product.price),
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        textDecoration = TextDecoration.LineThrough
                                    ),
                                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.6f)
                                )
                            }
                            Text(
                                text = MoneyFormatter.formatSoM(effectivePrice),
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                        if (isDiscountActive) {
                            Surface(
                                color = MaterialTheme.colorScheme.error,
                                shape = CircleShape
                            ) {
                                Text(
                                    text = "-${product.discountPercent}%",
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }
                }

                // Stock Info
                if (product.stock != null) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(
                                    if (isSoldOut) MaterialTheme.colorScheme.error
                                    else if (product.stock <= 5) MaterialTheme.colorScheme.tertiary
                                    else MaterialTheme.colorScheme.primary
                                )
                        )
                        Text(
                            text = when {
                                isSoldOut -> "Zaxira tugagan"
                                product.stock <= 5 -> "Faqat ${product.stock} ta qoldi"
                                else -> "Zaxira: ${product.stock} ta"
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Description
                if (product.description.isNotBlank()) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Tavsif",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = product.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 22.sp
                        )
                    }
                }

                // Business Info Card
                val shopBusiness = business
                if (shopBusiness != null || product.businessName.isNotBlank()) {
                    Card(
                        onClick = {
                            if (shopBusiness != null && onBusinessClick != null) {
                                onBusinessClick(shopBusiness)
                            }
                        },
                        enabled = shopBusiness != null && onBusinessClick != null,
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "Do'kon haqida",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Surface(
                                    modifier = Modifier.size(48.dp),
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = product.businessName.firstOrNull()?.uppercase() ?: "D",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    }
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = shopBusiness?.name ?: product.businessName,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    if (shopBusiness?.address?.isNotBlank() == true || product.businessAddress.isNotBlank()) {
                                        Text(
                                            text = shopBusiness?.address ?: product.businessAddress,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                            val phone = shopBusiness?.phone ?: product.businessPhone
                            if (phone.isNotBlank()) {
                                OutlinedButton(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("📞  $phone")
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

private fun productEmoji(product: Product): String = when {
    product.name.contains("non", ignoreCase = true) -> "🥖"
    product.name.contains("somsa", ignoreCase = true) -> "🥟"
    product.name.contains("osh", ignoreCase = true) -> "🍲"
    product.name.contains("choy", ignoreCase = true) -> "🫖"
    product.name.contains("tort", ignoreCase = true) || product.name.contains("pishiriq", ignoreCase = true) -> "🍰"
    product.name.contains("kafe", ignoreCase = true) || product.name.contains("qahva", ignoreCase = true) -> "☕"
    else -> "🍽️"
}
