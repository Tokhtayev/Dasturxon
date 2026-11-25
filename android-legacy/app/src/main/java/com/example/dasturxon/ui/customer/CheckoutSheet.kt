package com.example.dasturxon.ui.customer

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.example.dasturxon.core.common.MoneyFormatter
import com.example.dasturxon.core.designsystem.QuantityStepper
import com.example.dasturxon.data.model.Product
import com.google.firebase.Timestamp
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutSheet(
    product: Product,
    isSubmitting: Boolean,
    submitError: String?,
    onDismiss: () -> Unit,
    onConfirm: (quantity: Long, pickupTime: Timestamp, fulfillmentType: String, deliveryAddress: String, customerPhone: String) -> Unit
) {
    val context = LocalContext.current
    var quantity by rememberSaveable(product.id) { mutableIntStateOf(1) }
    var fulfillmentType by rememberSaveable(product.id) { mutableStateOf("pickup") }
    var deliveryAddress by rememberSaveable(product.id) { mutableStateOf("") }
    var contactPhone by rememberSaveable(product.id) { mutableStateOf("") }
    var pickupMillis by rememberSaveable(product.id) {
        mutableLongStateOf(System.currentTimeMillis() + 60 * 60 * 1000L)
    }

    val pickupLabel = remember(pickupMillis) {
        SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault()).format(Date(pickupMillis))
    }

    val isDiscountActive = product.discountPercent > 0 &&
        (product.discountEndsAt == null || product.discountEndsAt.toDate().after(Date()))
    val unitPrice = if (isDiscountActive)
        product.price - product.price * product.discountPercent / 100L
    else product.price
    val totalPrice = unitPrice * quantity
    val discountAmount = if (isDiscountActive) product.price * product.discountPercent / 100L * quantity else 0L

    val maxQty = product.stock?.coerceAtMost(99L)?.toInt() ?: 99
    val isPickupValid = pickupMillis > System.currentTimeMillis()
    val isStockValid = product.stock == null || quantity <= product.stock
    val isDeliveryValid = fulfillmentType == "pickup" || (deliveryAddress.isNotBlank() && contactPhone.isNotBlank())

    fun openDateTimePicker() {
        val current = Calendar.getInstance().apply { timeInMillis = pickupMillis }
        DatePickerDialog(
            context,
            { _, year, month, day ->
                current.set(year, month, day)
                TimePickerDialog(
                    context,
                    { _, hour, minute ->
                        current.set(Calendar.HOUR_OF_DAY, hour)
                        current.set(Calendar.MINUTE, minute)
                        current.set(Calendar.SECOND, 0)
                        pickupMillis = current.timeInMillis
                    },
                    current.get(Calendar.HOUR_OF_DAY),
                    current.get(Calendar.MINUTE),
                    true
                ).show()
            },
            current.get(Calendar.YEAR),
            current.get(Calendar.MONTH),
            current.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    ModalBottomSheet(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 24.dp)
                .navigationBarsPadding()
                .animateContentSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Handle indicator
            Box(
                modifier = Modifier
                    .width(40.dp)
                    .height(4.dp)
                    .align(Alignment.CenterHorizontally)
                    .padding(bottom = 4.dp)
            )

            // Header
            Text(
                text = "Buyurtma berish",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )

            // Product Summary
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = product.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = product.businessName,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (isDiscountActive) {
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = MoneyFormatter.formatSoM(product.price),
                                style = MaterialTheme.typography.bodySmall.copy(textDecoration = TextDecoration.LineThrough),
                                color = MaterialTheme.colorScheme.outline
                            )
                            Text(
                                text = MoneyFormatter.formatSoM(unitPrice),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    } else {
                        Text(
                            text = MoneyFormatter.formatSoM(unitPrice),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            // Quantity
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Miqdor",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    QuantityStepper(
                        quantity = quantity,
                        onQuantityChange = { quantity = it },
                        min = 1,
                        max = maxQty
                    )
                    if (product.stock != null) {
                        Text(
                            text = "Mavjud: ${product.stock} ta",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                if (!isStockValid) {
                    Text(
                        text = "Zaxira yetarli emas (${product.stock} ta mavjud)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }

            HorizontalDivider()

            // Fulfillment option
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Qabul qilish usuli",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    FilterChip(
                        selected = fulfillmentType == "pickup",
                        onClick = { fulfillmentType = "pickup" },
                        label = { Text("🛍️ Olib ketish") },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = fulfillmentType == "delivery",
                        onClick = { fulfillmentType = "delivery" },
                        label = { Text("🚚 Yetkazib berish") },
                        modifier = Modifier.weight(1f)
                    )
                }

                if (fulfillmentType == "delivery") {
                    OutlinedTextField(
                        value = deliveryAddress,
                        onValueChange = { deliveryAddress = it },
                        label = { Text("Yetkazib berish manzili") },
                        placeholder = { Text("Yunusobod tumani, 4-mavze, 12-uy, 15-xonadon") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false
                    )
                    OutlinedTextField(
                        value = contactPhone,
                        onValueChange = { contactPhone = it },
                        label = { Text("Bog'lanish uchun telefon") },
                        placeholder = { Text("+998 90 123 45 67") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }

            HorizontalDivider()

            // Pickup time section
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = if (fulfillmentType == "delivery") "Yetkazish vaqti" else "Olib ketish vaqti",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )

                // Quick presets
                val now = System.currentTimeMillis()
                val presets = listOf(
                    "30 daqiqa" to (now + 30 * 60 * 1000L),
                    "1 soat" to (now + 60 * 60 * 1000L),
                    "2 soat" to (now + 2 * 60 * 60 * 1000L),
                    "Bugun 18:00" to Calendar.getInstance().apply {
                        set(Calendar.HOUR_OF_DAY, 18)
                        set(Calendar.MINUTE, 0)
                        set(Calendar.SECOND, 0)
                    }.timeInMillis
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    presets.take(3).forEach { (label, time) ->
                        FilterChip(
                            selected = kotlin.math.abs(pickupMillis - time) < 2 * 60 * 1000L,
                            onClick = { pickupMillis = time },
                            label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                OutlinedButton(
                    onClick = { openDateTimePicker() },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        Icons.Default.ArrowDropDown,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text("Boshqa vaqt: $pickupLabel")
                }

                if (!isPickupValid) {
                    Text(
                        text = "Olib ketish vaqti o'tib ketgan",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }

            HorizontalDivider()

            // Price breakdown
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Mahsulot (${quantity} × ${MoneyFormatter.formatSoM(if (isDiscountActive) product.price else unitPrice)})",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = MoneyFormatter.formatSoM(product.price * quantity),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                if (isDiscountActive && discountAmount > 0) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Chegirma (-${product.discountPercent}%)",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.tertiary
                        )
                        Text(
                            text = "−${MoneyFormatter.formatSoM(discountAmount)}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.tertiary
                        )
                    }
                }
                HorizontalDivider(modifier = Modifier.padding(vertical = 2.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "To'lanadigan summa",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = MoneyFormatter.formatSoM(totalPrice),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Error
            submitError?.let {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = it,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            // Confirm button
            Button(
                onClick = {
                    if (isPickupValid && isStockValid && quantity > 0 && isDeliveryValid) {
                        onConfirm(
                            quantity.toLong(),
                            Timestamp(Date(pickupMillis)),
                            fulfillmentType,
                            deliveryAddress.trim(),
                            contactPhone.trim()
                        )
                    }
                },
                enabled = !isSubmitting && isPickupValid && isStockValid && quantity > 0 && isDeliveryValid,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("Buyurtma yuborilmoqda...")
                } else {
                    Text(
                        text = "Tasdiqlash · ${MoneyFormatter.formatSoM(totalPrice)}",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            TextButton(
                onClick = { if (!isSubmitting) onDismiss() },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isSubmitting
            ) {
                Text("Bekor qilish")
            }
        }
    }
}
