package com.nekatemp.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nekatemp.app.data.TemperatureReading

@Composable
fun DashboardScreen(viewModel: HomeViewModel) {
    val currentReading by viewModel.currentReading.collectAsState()
    val history by viewModel.history.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            SmallTopAppBar(title = { Text("Neka Temp Monitor") })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (isLoading) {
                CircularProgressIndicator()
            } else {
                // Current Values
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    TempCard("Agua", currentReading?.tempWater ?: 0f, Color(0xFF2196F3))
                    TempCard("Ambiente", currentReading?.tempAmbient ?: 0f, Color(0xFF4CAF50))
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    "Historial (7 días)",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.align(Alignment.Start)
                )

                Spacer(modifier = Modifier.height(8.dp))

                // MPAndroidChart Integration
                if (history.isNotEmpty()) {
                    TemperatureChart(
                        data = history,
                        modifier = Modifier
                            .height(300.dp)
                            .fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(onClick = { viewModel.refreshData() }) {
                    Text("Actualizar")
                }
            }
        }
    }
}

@Composable
fun TempCard(label: String, value: Float, color: Color) {
    Card(
        modifier = Modifier.width(150.dp).padding(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(label, color = color, fontWeight = FontWeight.Bold)
            Text("${String.format("%.1f", value)}°C", fontSize = 24.sp)
        }
    }
}

@Composable
fun SimpleLineChart(data: List<TemperatureReading>, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.padding(8.dp)) {
        val width = size.width
        val height = size.height
        val maxTemp = 40f
        val minTemp = 10f
        val range = maxTemp - minTemp

        val pathWater = Path()
        val pathAmbient = Path()

        data.takeLast(50).forEachIndexed { index, reading ->
            val x = (index.toFloat() / 49f) * width
            
            // Water Path
            val yWater = height - ((reading.tempWater - minTemp) / range) * height
            if (index == 0) pathWater.moveTo(x, yWater) else pathWater.lineTo(x, yWater)

            // Ambient Path
            val yAmbient = height - ((reading.tempAmbient - minTemp) / range) * height
            if (index == 0) pathAmbient.moveTo(x, yAmbient) else pathAmbient.lineTo(x, yAmbient)
        }

        drawPath(pathWater, color = Color(0xFF2196F3), style = Stroke(width = 4f))
        drawPath(pathAmbient, color = Color(0xFF4CAF50), style = Stroke(width = 4f))
    }
}
