import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Activity, Clock } from 'lucide-react';

const API_URL = '/api/data';

function App() {
    const [data, setData] = useState([]);
    const [range, setRange] = useState('live');

    const fetchData = async () => {
        try {
            const response = await axios.get(API_URL, {
                params: { range: range === 'live' ? undefined : range }
            });
            const formattedData = range === 'live' ? response.data.reverse() : response.data;
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

    const formatXAxis = (tickItem) => {
        if (!tickItem) return '';
        const date = parseTimestamp(tickItem);
        const coOptions = { timeZone: 'America/Bogota' };

        if (range === 'live' || range === '1h') return date.toLocaleTimeString('es-CO', { ...coOptions, hour: '2-digit', minute: '2-digit' });
        if (range === '12h' || range === '24h') return date.toLocaleTimeString('es-CO', { ...coOptions, hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString('es-CO', { ...coOptions, month: 'short', day: 'numeric', hour: '2-digit' });
    };

    return (
        <div className="app-container">
            <header>
                <div>
                    <h1>Neka Monitor</h1>
                    <div className="subtitle">
                        ESP32 SENSOR HUB <span className="mono">::v1.2</span>
                    </div>
                </div>
                <div className="status-badge glass">
                    <span className="status-dot"></span>
                    SYSTEM ONLINE
                </div>
            </header>

            <div className="dashboard-grid">
                {/* Left: Temperature HUD */}
                <div className="glass temp-widget">
                    <div className="temp-circle">
                        <span className="temp-value neon-text">
                            {latest.temperature?.toFixed(1)}
                            <span className="temp-unit">°C</span>
                        </span>
                    </div>
                    <div className="temp-label flex items-center gap-2">
                        <Thermometer size={16} /> AMBIENT TEMP
                    </div>
                </div>

                {/* Right: Chart */}
                <div className="glass chart-widget">
                    <div className="chart-controls">
                        <div className="chart-title">
                            <Activity size={18} className="text-secondary" />
                            <span style={{ color: '#fff' }}>Temperature History</span>
                        </div>

                        <div className="range-tabs">
                            {[
                                { k: 'live', l: 'LIVE' },
                                { k: '1h', l: '1H' },
                                { k: '24h', l: '24H' },
                                { k: '7d', l: '7D' },
                                { k: '15d', l: '15D' }
                            ].map((item) => (
                                <button
                                    key={item.k}
                                    onClick={() => setRange(item.k)}
                                    className={`range-tab ${range === item.k ? 'active' : ''}`}
                                >
                                    {item.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={formatXAxis}
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fill: '#8b9bb4' }}
                                    minTickGap={50}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    domain={['auto', 'auto']}
                                    tick={{ fontSize: 11, fill: '#8b9bb4' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(5, 5, 17, 0.9)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#00f2ff', fontFamily: 'Outfit', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#8b9bb4', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                                    labelFormatter={(label) => parseTimestamp(label).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                                    formatter={(value) => [`${value}°C`, 'Temp']}
                                    cursor={{ stroke: '#7000ff', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="temperature"
                                    stroke="#00f2ff"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTemp)"
                                    activeDot={{ r: 6, stroke: '#00f2ff', strokeWidth: 2, fill: '#fff' }}
                                    isAnimationActive={range !== 'live'}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
