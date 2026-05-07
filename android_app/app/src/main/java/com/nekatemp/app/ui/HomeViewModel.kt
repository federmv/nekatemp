package com.nekatemp.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nekatemp.app.data.ApiService
import com.nekatemp.app.data.TemperatureReading
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class HomeViewModel : ViewModel() {
    private val retrofit = Retrofit.Builder()
        .baseUrl("http://141.148.14.52:3001/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val apiService = retrofit.create(ApiService::class.java)

    private val _currentReading = MutableStateFlow<TemperatureReading?>(null)
    val currentReading: StateFlow<TemperatureReading?> = _currentReading

    private val _history = MutableStateFlow<List<TemperatureReading>>(emptyList())
    val history: StateFlow<List<TemperatureReading>> = _history

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        refreshData()
        // In a real app, you would start an SSE connection here to get real-time updates
    }

    fun refreshData() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val data = apiService.getMeasurements("7d")
                _history.value = data
                if (data.isNotEmpty()) {
                    _currentReading.value = data.last()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
}
