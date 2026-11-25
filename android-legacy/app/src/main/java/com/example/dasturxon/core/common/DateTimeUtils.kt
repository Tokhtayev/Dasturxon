package com.example.dasturxon.core.common

import java.time.ZoneId
import java.time.format.DateTimeFormatter

object DateTimeUtils {
    val TASHKENT_ZONE: ZoneId = ZoneId.of("Asia/Tashkent")

    val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm").withZone(TASHKENT_ZONE)
    val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy").withZone(TASHKENT_ZONE)
    val dateTimeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(TASHKENT_ZONE)
}
