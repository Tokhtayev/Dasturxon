package com.example.dasturxon.core.designsystem.charts

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

@Composable
fun Sparkline(
    data: List<Float>,
    modifier: Modifier = Modifier
) {
    if (data.size < 2) return

    val primaryColor = MaterialTheme.colorScheme.primary

    Canvas(
        modifier = modifier
            .width(60.dp)
            .height(24.dp)
    ) {
        val maxVal = (data.maxOrNull() ?: 1f).coerceAtLeast(1f)
        val minVal = 0f
        val points = mutableListOf<Offset>()

        val widthStep = size.width / (data.size - 1)

        data.forEachIndexed { index, value ->
            val x = index * widthStep
            val y = size.height - ((value - minVal) / (maxVal - minVal) * size.height)
            points.add(Offset(x, y))
        }

        val path = Path()
        path.moveTo(points.first().x, points.first().y)
        for (i in 1 until points.size) {
            path.lineTo(points[i].x, points[i].y)
        }

        drawPath(
            path = path,
            color = primaryColor,
            style = Stroke(width = 2.dp.toPx())
        )
    }
}
