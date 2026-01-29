import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';
import { Activity, Aperture } from 'lucide-react';

const API_URL = '/api/data';

function App() {
    const [data, setData] = useState([]);
    const [range, setRange] = useState('live');

    const fetchData = async () => {
        try {
            const response = await axios.get(API_URL, {
                params: { range: range === 'live' ? undefined : range }
            });
            const formattedData = response.data;
            setData(formattedData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const intervalTime = range === 'live' ? 2000 : 60000;
        const interval = setInterval(fetchData, intervalTime);
        return () => clearInterval(interval);
    }, [range]);

    const latest = data.length > 0 ? data[data.length - 1] : { temperature: 0 };

    const parseTimestamp = (timestamp) => {
        if (!timestamp) return new Date();
        return new Date(timestamp.replace(' ', 'T') + 'Z');
    };

    const chartOptions = useMemo(() => ({
        chart: {
            id: 'pro-chart',
            type: 'area',
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                dynamicAnimation: {
                    speed: range === 'live' ? 1000 : 350
                }
            },
            background: 'transparent',
            foreColor: '#48484a', // darker axis labels
            fontFamily: 'JetBrains Mono, monospace'
        },
        colors: ['#ffcc00'], // Halide Amber
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.25,
                opacityTo: 0,
                stops: [0, 100]
            }
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        dataLabels: { enabled: false },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            strokeDashArray: 0,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } },
            padding: { top: 0, right: 0, bottom: 0, left: 10 }
        },
        xaxis: {
            type: 'datetime',
            tooltip: { enabled: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: { fontSize: '10px', fontFamily: 'JetBrains Mono' },
                formatter: (val) => {
                    const date = new Date(val);
                    if (range === 'live' || range === '1h') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
            }
        },
        yaxis: {
            min: range === 'live' && latest.temperature ? Math.floor(latest.temperature - 1) : undefined,
            max: range === 'live' && latest.temperature ? Math.ceil(latest.temperature + 1) : undefined,
            tickAmount: 4,
            labels: {
                style: { fontSize: '10px', fontFamily: 'JetBrains Mono' },
                formatter: (val) => val.toFixed(1)
            }
        },
        tooltip: {
            theme: 'dark', // We'll override this with CSS if needed, but 'dark' is a good base
            x: { format: 'dd MMM HH:mm:ss' },
            y: {
                formatter: (val) => `${val.toFixed(2)}°C`,
            },
            marker: { show: false },
            style: {
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif'
            }
        },
        markers: { size: 0, hover: { size: 4 } }
    }), [range, latest.temperature]);

    const chartSeries = useMemo(() => [{
        name: 'Temp',
        data: data.map(d => [
            parseTimestamp(d.timestamp).getTime(),
            d.temperature
        ])
    }], [data]);

    return (
        <div className="dashboard-layout">
            <header>
                <h1>
                    <span className="brand-pill">NEKA</span>
                    Monitor
                </h1>
                <div className="status-indicator">
                    <span className="status-dot"></span>
                    <span>CONNECTED</span>
                </div>
            </header>

            <div className="readout-container">
                {/* Main "Lens" Readout */}
                <div className="glass-panel main-readout">
                    <div className="readout-label">
                        <Aperture size={16} color="var(--accent-primary)" />
                        Ambient Sensor
                    </div>

                    <div className="readout-value-wrapper">
                        <span className="readout-value mono-num">
                            {latest.temperature ? latest.temperature.toFixed(1) : '--'}
                            <span className="readout-unit">°C</span>
                        </span>
                    </div>

                    <div className="readout-meta">
                        <div className="meta-item">
                            <span className="meta-label">Range</span>
                            <span className="meta-value">AUTO</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Peak</span>
                            <span className="meta-value">
                                {data.length > 0 ? Math.max(...data.map(d => d.temperature)).toFixed(1) : '--'}°
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Low</span>
                            <span className="meta-value">
                                {data.length > 0 ? Math.min(...data.map(d => d.temperature)).toFixed(1) : '--'}°
                            </span>
                        </div>
                    </div>
                </div>

                {/* Secondary Panels (could be expanded later, using placeholder style for now if needed, or just part of the grid) */}
                {/* For this specific design, we might want the chart to take up the rest, or have a side panel. 
                     The CSS 'readout-container' defined a 1fr 280px grid. 
                     Let's put a secondary info panel or controls in the right column if we have content, 
                     otherwise we can adjust. For now let's put the Time Control there for a unique layout. */}

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="chart-label" style={{ marginBottom: '1rem' }}>TIME SCALE</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { k: 'live', l: 'Live Stream' },
                            { k: '1h', l: 'Last Hour' },
                            { k: '24h', l: '24 Hours' },
                            { k: '7d', l: '7 Days' },
                            { k: '15d', l: '15 Days' }
                        ].map((item) => (
                            <button
                                key={item.k}
                                onClick={() => setRange(item.k)}
                                className={`time-tab ${range === item.k ? 'active' : ''}`}
                                style={{ textAlign: 'left', padding: '10px 14px' }}
                            >
                                {item.l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="glass-panel chart-panel">
                <div className="chart-header">
                    <div className="readout-label">
                        <Activity size={16} />
                        Temperature History
                    </div>
                    {/* Compact tabs for mobile fallback or alternative view could go here */}
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="area"
                        height="100%"
                        width="100%"
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
