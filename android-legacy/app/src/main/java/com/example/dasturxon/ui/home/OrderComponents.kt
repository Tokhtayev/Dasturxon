package com.example.dasturxon.ui.home

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.input.KeyboardType
import com.example.dasturxon.core.common.ProductImageHelper
import kotlinx.coroutines.launch
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.dasturxon.data.model.CustomerOrder
import com.example.dasturxon.data.model.Expense
import com.example.dasturxon.data.model.Product
import com.google.firebase.Timestamp
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@Composable
internal fun PlaceOrderDialog(
    product: Product,
    isSubmitting: Boolean,
    submitError: String?,
    onDismiss: () -> Unit,
    onSubmit: (quantity: Long, pickupTime: Timestamp) -> Unit
) {
    val context = LocalContext.current
    var quantity by remember(product.id) { mutableStateOf("1") }
    var pickupMillis by remember(product.id) {
        mutableStateOf(System.currentTimeMillis() + 60 * 60 * 1000L)
    }
    val pickupLabel = remember(pickupMillis) {
        SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault()).format(Date(pickupMillis))
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Buyurtma: ${product.name}") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                val discounted = if (product.discountPercent > 0L && (product.discountEndsAt == null || product.discountEndsAt.toDate().after(Date()))) {
                    product.price - product.price * product.discountPercent / 100L
                } else product.price
                Text("Narx: ${"%,d".format(discounted).replace(',', ' ')} so'm × ${quantity.toLongOrNull() ?: 0L}")
                if (product.stock != null) Text("Mavjud zaxira: ${product.stock}")
                submitError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it.filter(Char::isDigit).take(4) },
                    label = { Text("Soni") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    enabled = !isSubmitting
                )
                OutlinedButton(
                    onClick = {
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
                ) { Text("Olib ketish: $pickupLabel") }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    quantity.toLongOrNull()?.takeIf { it > 0 }?.let {
                        onSubmit(it, Timestamp(Date(pickupMillis)))
                    }
                },
                enabled = !isSubmitting
                    && (quantity.toLongOrNull() ?: 0L) > 0L
                    && pickupMillis > System.currentTimeMillis()
                    && (product.stock == null || (quantity.toLongOrNull() ?: Long.MAX_VALUE) <= product.stock)
            ) {
                if (isSubmitting) CircularProgressIndicator()
                else Text("Tasdiqlash")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss, enabled = !isSubmitting) { Text("Bekor qilish") } }
    )
}

@Composable
internal fun ProductEditDialog(
    product: Product,
    onDismiss: () -> Unit,
    onSave: (String, String, Long, Long?, Long, Timestamp?, Long, String) -> Unit,
    onDelete: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var name by rememberSaveable(product.id) { mutableStateOf(product.name) }
    var description by rememberSaveable(product.id) { mutableStateOf(product.description) }
    var price by rememberSaveable(product.id) { mutableStateOf(product.price.toString()) }
    var costPrice by rememberSaveable(product.id) { mutableStateOf(if (product.costPrice > 0L) product.costPrice.toString() else "") }
    var stock by rememberSaveable(product.id) { mutableStateOf(product.stock?.toString().orEmpty()) }
    var discount by rememberSaveable(product.id) { mutableStateOf(product.discountPercent.toString()) }
    var expiryMillis by rememberSaveable(product.id) {
        mutableStateOf(product.discountEndsAt?.toDate()?.time)
    }
    var imageBase64 by rememberSaveable(product.id) { mutableStateOf(product.image) }
    var isEncodingImage by remember { mutableStateOf(false) }
    var validation by remember { mutableStateOf<String?>(null) }

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            isEncodingImage = true
            validation = null
            coroutineScope.launch {
                ProductImageHelper.encodeUriToBase64(context, uri)
                    .onSuccess { encoded -> imageBase64 = encoded }
                    .onFailure { validation = it.localizedMessage ?: "Rasmni yuklab bo'lmadi." }
                isEncodingImage = false
            }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Mahsulotni tahrirlash") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val previewBitmap = remember(imageBase64) {
                    ProductImageHelper.decodeBase64ToImageBitmap(imageBase64)
                }
                if (previewBitmap != null) {
                    Image(
                        bitmap = previewBitmap,
                        contentDescription = name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(16f / 9f)
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Crop
                    )
                    TextButton(
                        onClick = { imageBase64 = "" },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Rasmni olib tashlash", color = MaterialTheme.colorScheme.error)
                    }
                }
                OutlinedButton(
                    onClick = {
                        imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    },
                    enabled = !isEncodingImage,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isEncodingImage) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        Text("  Rasm tayyorlanmoqda...")
                    } else {
                        Text(if (imageBase64.isBlank()) "📷 Rasm yuklash" else "📷 Boshqa rasm tanlash")
                    }
                }
                OutlinedTextField(name, { name = it }, label = { Text("Nomi") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(description, { description = it }, label = { Text("Tavsif") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(price, { price = it.filter(Char::isDigit) }, label = { Text("Sotish narxi (so'm)") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                OutlinedTextField(costPrice, { costPrice = it.filter(Char::isDigit) }, label = { Text("Tannarxi (so'm, ixtiyoriy)") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                OutlinedTextField(stock, { stock = it.filter(Char::isDigit) }, label = { Text("Zaxira (ixtiyoriy)") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                OutlinedTextField(discount, { discount = it.filter(Char::isDigit) }, label = { Text("Chegirma (0–90%)") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                OutlinedButton(onClick = {
                    val calendar = Calendar.getInstance().apply {
                        timeInMillis = expiryMillis ?: System.currentTimeMillis()
                    }
                    DatePickerDialog(
                        context,
                        { _, year, month, day ->
                            calendar.set(year, month, day, 23, 59, 59)
                        expiryMillis = calendar.timeInMillis
                        },
                        calendar.get(Calendar.YEAR),
                        calendar.get(Calendar.MONTH),
                        calendar.get(Calendar.DAY_OF_MONTH)
                    ).show()
                }) {
                    Text(expiryMillis?.let { "Tugash sanasi: ${SimpleDateFormat("dd.MM.yyyy", Locale.getDefault()).format(Date(it))}" }
                        ?: "Chegirma muddati cheklanmagan")
                }
                TextButton(onClick = { expiryMillis = null }) { Text("Tugash sanasini olib tashlash") }
                if (onDelete != null) {
                    OutlinedButton(
                        onClick = {
                            onDelete()
                            onDismiss()
                        },
                        colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("🗑️ Mahsulotni o'chirish")
                    }
                }
                validation?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            Button(
                enabled = !isEncodingImage,
                onClick = {
                    val parsedPrice = price.toLongOrNull()
                    val parsedCostPrice = costPrice.toLongOrNull() ?: 0L
                    val parsedStock = stock.takeIf(String::isNotBlank)?.toLongOrNull()
                    val parsedDiscount = discount.toLongOrNull()
                    when {
                        name.isBlank() -> validation = "Mahsulot nomini kiriting."
                        parsedPrice == null || parsedPrice <= 0L -> validation = "Narxni tekshiring."
                        stock.isNotBlank() && (parsedStock == null || parsedStock < 0L) -> validation = "Zaxirani tekshiring."
                        parsedDiscount == null || parsedDiscount !in 0L..90L -> validation = "Chegirma 0–90 oralig'ida bo'lsin."
                        else -> onSave(
                            name.trim(),
                            description.trim(),
                            parsedPrice,
                            parsedStock,
                            parsedDiscount,
                            expiryMillis?.let { Timestamp(Date(it)) },
                            parsedCostPrice,
                            imageBase64
                        )
                    }
                }
            ) { Text("Saqlash") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Bekor qilish") } }
    )
}

@Composable
internal fun OrderCard(
    order: CustomerOrder,
    ownerActions: Boolean = false,
    onPaymentStatusChange: (String) -> Unit = {},
    onStatusChange: (String) -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Text(
                    text = order.productName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                )
                com.example.dasturxon.core.designsystem.StatusChip(
                    status = com.example.dasturxon.core.model.OrderStatus.fromStoredValue(order.status)
                )
            }
            Text("Biznes: ${order.businessName}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                "Soni: ${order.quantity} • Jami: ${com.example.dasturxon.core.common.MoneyFormatter.formatSoM(order.totalPrice)}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary
            )

            // Payment status indicator
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                if (order.paymentStatus == "paid") {
                    androidx.compose.material3.Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = "✓ To'langan",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                } else {
                    Row(
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        androidx.compose.material3.Surface(
                            color = MaterialTheme.colorScheme.errorContainer,
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "To'lanmagan",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                        if (ownerActions) {
                            OutlinedButton(
                                onClick = { onPaymentStatusChange("paid") },
                                shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
                            ) {
                                Text("To'lovni tasdiqlash", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }
            }

            val isDelivery = order.fulfillmentType == "delivery"
            Text(
                text = if (isDelivery) "🚚 Yetkazib berish: ${order.deliveryAddress.ifBlank { "Manzil ko'rsatilmagan" }}"
                       else "🛍️ Olib ketish: " + (order.pickupTime?.let { SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault()).format(it.toDate()) } ?: "Vaqt belgilanmagan"),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (order.customerPhone.isNotBlank()) {
                val context = LocalContext.current
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    Text(
                        text = "Mijoz: ${order.customerName.ifBlank { order.customerPhone }}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                    if (ownerActions) {
                        OutlinedButton(
                            onClick = {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${order.customerPhone}"))
                                context.startActivity(intent)
                            },
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
                        ) {
                            Text("📞 Qo'ng'iroq")
                        }
                    }
                }
            }
            if (ownerActions) {
                Spacer(Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    when (order.status) {
                        "new", "pending" -> {
                            Button(
                                onClick = { onStatusChange("accepted") },
                                shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp)
                            ) {
                                Text("Qabul qilish")
                            }
                            OutlinedButton(
                                onClick = { onStatusChange("rejected") },
                                shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp)
                            ) {
                                Text("Rad etish")
                            }
                        }
                        "accepted" -> Button(
                            onClick = { onStatusChange("ready") },
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp)
                        ) {
                            Text("Tayyor")
                        }
                        "ready" -> Button(
                            onClick = { onStatusChange("completed") },
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp)
                        ) {
                            Text("Topshirildi (Yakunlash)")
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun AddExpenseDialog(
    onDismiss: () -> Unit,
    onSubmit: (title: String, amount: Long, category: String) -> Unit
) {
    var title by rememberSaveable { mutableStateOf("") }
    var amountText by rememberSaveable { mutableStateOf("") }
    val categories = listOf("Xomashyo", "Ijara", "Kommunal", "Maosh", "Boshqa")
    var selectedCategory by rememberSaveable { mutableStateOf(categories.first()) }
    var expanded by remember { mutableStateOf(false) }
    var validation by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Yangi xarajat qo'shish") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Xarajat nomi") },
                    placeholder = { Text("Masalan: Un va sariyog'") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it.filter(Char::isDigit) },
                    label = { Text("Summasi (so'm)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it }
                ) {
                    OutlinedTextField(
                        value = selectedCategory,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Kategoriya") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier.menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable, true).fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        categories.forEach { category ->
                            DropdownMenuItem(
                                text = { Text(category) },
                                onClick = {
                                    selectedCategory = category
                                    expanded = false
                                }
                            )
                        }
                    }
                }
                validation?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            Button(onClick = {
                val amount = amountText.toLongOrNull()
                when {
                    title.isBlank() -> validation = "Xarajat nomini kiriting."
                    amount == null || amount <= 0L -> validation = "Xarajat summasini to'g'ri kiriting."
                    else -> onSubmit(title.trim(), amount, selectedCategory)
                }
            }) { Text("Saqlash") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Bekor qilish") } }
    )
}

@Composable
internal fun ExpenseCard(
    expense: Expense,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = expense.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                    androidx.compose.material3.Surface(
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = expense.category,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "${SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault()).format(expense.createdAt.toDate())}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline
                )
            }
            Row(
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "-${com.example.dasturxon.core.common.MoneyFormatter.formatSoM(expense.amount)}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )
                TextButton(
                    onClick = onDelete,
                    colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("🗑️")
                }
            }
        }
    }
}
