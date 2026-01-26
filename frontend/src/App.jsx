import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Thermometer, Droplets, Activity, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:3001/api/data'; // Cambiar por IP de Oracle Cloud después

function App() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await axios.get(API_URL);
            // Revertir para que el gráfico sea cronológico (izquierda a derecha)
            setData(response.data.reverse());
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Actualizar cada 5s
        return () => clearInterval(interval);
    }, []);

    const latest = data.length > 0 ? data[data.length - 1] : { temperature: 0, humidity: 0 };

    return (
        <div className="dashboard">
            <header>
                <h1>Oracle IoT Dashboard</h1>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Monitoreo de ESP32 en tiempo real</p>
            </header>

            <div className="stat-grid">
                <div className="stat-card glass-card">
                    <div className="stat-label">
                        <Thermometer size={16} className="inline mr-2" /> Temperatura Actual
                    </div>
                    <div className="stat-value">{latest.temperature}°C</div>
                </div>

                <div className="stat-card glass-card" style={{ borderLeftColor: '#818cf8' }}>
                    <div className="stat-label">
                        <Droplets size={16} className="inline mr-2" /> Humedad
                    </div>
                    <div className="stat-value">{latest.humidity}%</div>
                </div>

                <div className="stat-card glass-card" style={{ borderLeftColor: '#10b981' }}>
                    <div className="stat-label">
                        <Activity size={16} className="inline mr-2" /> Estado
                    </div>
                    <div className="stat-value">Activo</div>
                </div>
            </div>

            <div className="glass-card chart-container">
                <h3 style={{ marginTop: 0, marginBottom: '2rem' }}>Histórico de Temperatura</h3>
                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            hide={true}
                        />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            itemStyle={{ color: '#38bdf8' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="temperature"
                            stroke="#38bdf8"
                            fillOpacity={1}
                            fill="url(#colorTemp)"
                            strokeWidth={3}
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default App;
