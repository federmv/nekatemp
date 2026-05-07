package com.nekatemp.app.data

import com.google.gson.annotations.SerializedName

data class TemperatureReading(
    @SerializedName("temp_water") val tempWater: Float,
    @SerializedName("temp_ambient") val tempAmbient: Float,
    @SerializedName("timestamp") val timestamp: String
)

data class Stats(
    val peak: Float,
    val low: Float,
    val avg: Float,
    val count: Int
)
