package com.example.dasturxon.core.designsystem

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.dasturxon.core.common.MoneyFormatter
import com.example.dasturxon.core.model.OrderStatus

@Composable
fun StatusChip(
    status: OrderStatus,
    modifier: Modifier = Modifier
) {
    val isDark = androidx.compose.foundation.isSystemInDarkTheme()
    val (bgColor, textColor, label) = when (status) {
        OrderStatus.PENDING -> if (isDark) {
            Triple(Color(0xFF4D3800), Color(0xFFFFDF9E), "Kutilmoqda")
        } else {
            Triple(Color(0xFFFFF3CD), Color(0xFF856404), "Kutilmoqda")
        }
        OrderStatus.ACCEPTED -> if (isDark) {
            Triple(Color(0xFF00325B), Color(0xFFD1E4FF), "Qabul qilindi")
        } else {
            Triple(Color(0xFFCCE5FF), Color(0xFF004085), "Qabul qilindi")
        }
        OrderStatus.READY -> if (isDark) {
            Triple(Color(0xFF0F3818), Color(0xFFB8F0BC), "Tayyor")
        } else {
            Triple(Color(0xFFD4EDDA), Color(0xFF155724), "Tayyor")
        }
        OrderStatus.COMPLETED -> if (isDark) {
            Triple(Color(0xFF1D3436), Color(0xFFBCEBEF), "Yakunlandi")
        } else {
            Triple(Color(0xFFE0F2F1), Color(0xFF004D40), "Yakunlandi")
        }
        OrderStatus.REJECTED -> if (isDark) {
            Triple(Color(0xFF561418), Color(0xFFFFDAD6), "Rad etildi")
        } else {
            Triple(Color(0xFFF8D7DA), Color(0xFF721C24), "Rad etildi")
        }
        OrderStatus.CANCELLED -> if (isDark) {
            Triple(Color(0xFF33302E), Color(0xFFD3CBC4), "Bekor qilindi")
        } else {
            Triple(Color(0xFFE2E3E5), Color(0xFF495057), "Bekor qilindi")
        }
    }

    Surface(
        modifier = modifier,
        color = bgColor,
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = label,
            color = textColor,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun LiveBadge(
    modifier: Modifier = Modifier,
    text: String = "● Hozir mavjud"
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(800),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.tertiaryContainer,
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .alpha(alpha)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.tertiary)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = text,
                color = MaterialTheme.colorScheme.onTertiaryContainer,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun DiscountBadge(
    discountPercent: Long,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.error,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = "-$discountPercent%",
            color = MaterialTheme.colorScheme.onError,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

@Composable
fun PriceText(
    price: Long,
    discountPercent: Long = 0,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (discountPercent > 0) {
            val discountedPrice = price - (price * discountPercent / 100L)
            Text(
                text = MoneyFormatter.formatSoM(discountedPrice),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = MoneyFormatter.formatSoM(price),
                style = MaterialTheme.typography.bodySmall.copy(textDecoration = TextDecoration.LineThrough),
                color = MaterialTheme.colorScheme.outline
            )
        } else {
            Text(
                text = MoneyFormatter.formatSoM(price),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
fun ShopAvatar(
    name: String,
    modifier: Modifier = Modifier,
    size: Int = 40
) {
    val initial = name.firstOrNull()?.uppercase() ?: "D"
    Surface(
        modifier = modifier.size(size.dp),
        shape = CircleShape,
        color = MaterialTheme.colorScheme.primaryContainer
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = initial,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}
