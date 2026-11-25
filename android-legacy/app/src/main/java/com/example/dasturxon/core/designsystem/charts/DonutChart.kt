package com.example.dasturxon.core.designsystem.charts

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

@Composable
fun DonutChart(
    values: List<Float>,
    colors: List<Color>,
    modifier: Modifier = Modifier
) {
    if (values.isEmpty()) return

    val animatedProgress = remember { Animatable(0f) }
    LaunchedEffect(values) {
        animatedProgress.animateTo(1f, animationSpec = tween(1000))
    }

    val total = values.sum().coerceAtLeast(1f)

    Canvas(
        modifier = modifier.size(160.dp)
    ) {
        var startAngle = -90f
        val strokeWidth = 24.dp.toPx()

        values.forEachIndexed { index, value ->
            val sweepAngle = (value / total) * 360f * animatedProgress.value
            val color = colors.getOrElse(index) { Color.Gray }

            drawArc(
                color = color,
                startAngle = startAngle,
                sweepAngle = sweepAngle,
                useCenter = false,
                style = Stroke(width = strokeWidth)
            )

            startAngle += sweepAngle
        }
    }
}
