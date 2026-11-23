package com.example.dasturxon.core.designsystem

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

data class DxChipItem(
    val id: String,
    val label: String,
    val icon: String? = null
)

@Composable
fun DxChipRow(
    items: List<DxChipItem>,
    selectedId: String,
    onSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items.forEach { item ->
            FilterChip(
                selected = item.id == selectedId,
                onClick = { onSelected(item.id) },
                label = {
                    Text(
                        text = if (item.icon != null) "${item.icon} ${item.label}" else item.label
                    )
                }
            )
        }
    }
}
