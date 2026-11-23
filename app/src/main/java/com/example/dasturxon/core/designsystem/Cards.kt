package com.example.dasturxon.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.dasturxon.core.designsystem.charts.Sparkline
import com.example.dasturxon.data.model.Business
import com.example.dasturxon.data.model.Product

@Composable
fun ProductCard(
    product: Product,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    onOrderClick: (() -> Unit)? = null,
    showOwnerActions: Boolean = false,
    onEditClick: (() -> Unit)? = null,
    onStatusChange: ((String) -> Unit)? = null
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            ) {
                // Central subtle food icon placeholder
                Text(
                    text = when {
                        product.name.contains("non", ignoreCase = true) -> "🥖"
                        product.name.contains("somsa", ignoreCase = true) -> "🥟"
                        product.name.contains("osh", ignoreCase = true) -> "🍲"
                        product.name.contains("choy", ignoreCase = true) -> "🫖"
                        product.name.contains("tort", ignoreCase = true) || product.name.contains("pishiriq", ignoreCase = true) -> "🍰"
                        else -> "🍽️"
                    },
                    style = MaterialTheme.typography.displayLarge,
                    modifier = Modifier.align(Alignment.Center)
                )

                // Top Start: Live status badge
                if (product.status == "hot_ready") {
                    Box(modifier = Modifier.align(Alignment.TopStart).padding(8.dp)) {
                        LiveBadge(text = "● Issiq tayyor")
                    }
                }

                // Top End: Discount badge
                Box(
                    modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)
                ) {
                    if (product.discountPercent > 0) {
                        DiscountBadge(discountPercent = product.discountPercent)
                    }
                }
            }
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ShopAvatar(name = product.businessName, size = 26)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = product.businessName.ifBlank { "Mahalliy do'kon" },
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    if (product.status == "sold_out") {
                        Surface(
                            color = MaterialTheme.colorScheme.errorContainer,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "Tugagan",
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    } else if (product.stock != null) {
                        Text(
                            text = "Zaxira: ${product.stock} ta",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.outline
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                if (product.description.isNotBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = product.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    PriceText(price = product.price, discountPercent = product.discountPercent)

                    if (onOrderClick != null && product.status != "sold_out") {
                        androidx.compose.material3.Button(
                            onClick = onOrderClick,
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Buyurtma", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }

                if (showOwnerActions) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        onEditClick?.let {
                            androidx.compose.material3.OutlinedButton(
                                onClick = it,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Tahrirlash")
                            }
                        }
                        if (onStatusChange != null) {
                            val nextStatus = when (product.status) {
                                "available" -> "hot_ready" to "Issiq qilish"
                                "hot_ready" -> "sold_out" to "Tugatish"
                                else -> "available" to "Mavjud qilish"
                            }
                            androidx.compose.material3.Button(
                                onClick = { onStatusChange(nextStatus.first) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text(nextStatus.second)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ShopCard(
    business: Business,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    onCallClick: (() -> Unit)? = null
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ShopAvatar(name = business.name, size = 52)
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = business.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(3.dp))
                if (business.address.isNotBlank()) {
                    Text(
                        text = business.address,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (business.phone.isNotBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = business.phone,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }

            if (onCallClick != null && business.phone.isNotBlank()) {
                androidx.compose.material3.IconButton(onClick = onCallClick) {
                    Text("📞", style = MaterialTheme.typography.titleMedium)
                }
            }
        }
    }
}

@Composable
fun KpiCard(
    title: String,
    value: String,
    delta: String? = null,
    sparklineData: List<Float> = emptyList(),
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = value,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    if (delta != null) {
                        Text(
                            text = delta,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.tertiary
                        )
                    }
                }
                if (sparklineData.isNotEmpty()) {
                    Sparkline(data = sparklineData)
                }
            }
        }
    }
}
