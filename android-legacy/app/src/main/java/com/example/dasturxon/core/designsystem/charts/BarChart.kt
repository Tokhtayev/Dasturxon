package com.example.dasturxon.core.designsystem.charts

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.dp

@Composable
fun BarChart(
    data: List<Float>,
    modifier: Modifier = Modifier
) {
    if (data.isEmpty()) return

    val animatedProgress = remember { Animatable(0f) }
    LaunchedEffect(data) {
        animatedProgress.animateTo(1f, animationSpec = tween(800))
    }

    val barColor = MaterialTheme.colorScheme.secondary

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(180.dp)
    ) {
        val maxVal = (data.maxOrNull() ?: 1f).coerceAtLeast(1f)
        val barWidth = (size.width / data.size) * 0.6f
        val gap = (size.width / data.size) * 0.4f

        data.forEachIndexed { index, value ->
            val barHeight = (value / maxVal) * size.height * animatedProgress.value
            val x = index * (barWidth + gap) + gap / 2
            val y = size.height - barHeight

            drawRect(
                color = barColor,
                topLeft = Offset(x, y),
                size = Size(barWidth, barHeight)
            )
        }
    }
}
