package com.example.dasturxon.data.model

data class Business(
    val id: String,
    val ownerId: String,
    val name: String,
    val type: String,
    val address: String,
    val phone: String,
    val status: String,
    val rejectionReason: String? = null,
    val typeNote: String? = null
) {
    companion object {
        fun fromDocument(id: String, data: Map<String, Any?>): Business = Business(
            id = id,
            ownerId = (data["ownerId"] as? String).orEmpty(),
            name = (data["name"] as? String).orEmpty(),
            type = (data["type"] as? String).orEmpty(),
            address = (data["address"] as? String).orEmpty(),
            phone = (data["phone"] as? String).orEmpty(),
            status = (data["status"] as? String).orEmpty(),
            rejectionReason = data["rejectionReason"] as? String,
            typeNote = data["typeNote"] as? String
        )
    }
}
