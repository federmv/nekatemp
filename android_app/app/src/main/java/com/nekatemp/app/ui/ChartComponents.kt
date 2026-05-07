package com.nekatemp.app.ui

import android.graphics.Color as AndroidColor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.github.mikephil.charting.charts.LineChart
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter
import com.nekatemp.app.data.TemperatureReading
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun TemperatureChart(data: List<TemperatureReading>, modifier: Modifier = Modifier) {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
    val displayFormat = SimpleDateFormat("dd/MM HH:mm", Locale.getDefault())

    AndroidView(
        modifier = modifier,
        factory = { context ->
            LineChart(context).apply {
                description.isEnabled = false
                setTouchEnabled(true)
                setPinchZoom(true)
                
                xAxis.apply {
                    position = XAxis.XAxisPosition.BOTTOM
                    setDrawGridLines(false)
                    granularity = 1f
                    labelRotationAngle = -45f
                }

                axisRight.isEnabled = false
                axisLeft.apply {
                    setDrawGridLines(true)
                    axisMinimum = 0f
                    axisMaximum = 50f
                }

                legend.isEnabled = true
            }
        },
        update = { chart ->
            if (data.isEmpty()) return@AndroidView

            val waterEntries = mutableListOf<Entry>()
            val ambientEntries = mutableListOf<Entry>()
            val xLabels = mutableListOf<String>()

            data.forEachIndexed { index, reading ->
                waterEntries.add(Entry(index.toFloat(), reading.tempWater))
                ambientEntries.add(Entry(index.toFloat(), reading.tempAmbient))
                
                try {
                    val date = dateFormat.parse(reading.timestamp)
                    xLabels.add(if (date != null) displayFormat.format(date) else "")
                } catch (e: Exception) {
                    xLabels.add("")
                }
            }

            val waterDataSet = LineDataSet(waterEntries, "Agua").apply {
                color = AndroidColor.BLUE
                setCircleColor(AndroidColor.BLUE)
                lineWidth = 2f
                setDrawValues(false)
                setDrawCircles(data.size < 20)
                mode = LineDataSet.Mode.CUBIC_BEZIER
            }

            val ambientDataSet = LineDataSet(ambientEntries, "Ambiente").apply {
                color = AndroidColor.GREEN
                setCircleColor(AndroidColor.GREEN)
                lineWidth = 2f
                setDrawValues(false)
                setDrawCircles(data.size < 20)
                mode = LineDataSet.Mode.CUBIC_BEZIER
            }

            chart.xAxis.valueFormatter = IndexAxisValueFormatter(xLabels)
            chart.data = LineData(waterDataSet, ambientDataSet)
            chart.invalidate() // Refresh
        }
    )
}
