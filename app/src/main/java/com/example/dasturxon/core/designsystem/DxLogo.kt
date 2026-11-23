package com.example.dasturxon.core.designsystem

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.dasturxon.R

@Composable
fun DxLogo(
    modifier: Modifier = Modifier,
    size: Dp = 40.dp,
    showWordmark: Boolean = true
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            painter = painterResource(id = R.drawable.ic_logo_mark),
            contentDescription = "Dasturxon Logo",
            modifier = Modifier.size(size)
        )
        if (showWordmark) {
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Dasturxon",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = (size.value * 0.55).sp
                ),
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
