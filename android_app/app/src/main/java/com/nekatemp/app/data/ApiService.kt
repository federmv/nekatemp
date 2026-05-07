package com.nekatemp.app.data

import retrofit2.http.GET
import retrofit2.http.Query

interface ApiService {
    @GET("api/data")
    suspend fun getMeasurements(@Query("range") range: String = "7d"): List<TemperatureReading>

    @GET("api/data/stats")
    suspend fun getStats(@Query("range") range: String = "24h"): Stats
}
