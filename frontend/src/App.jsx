import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer } from 'lucide-react';

const API_URL = '/api/data';

function App() {
    const [data, setData] = useState([]);
    const [range, setRange] = useState('live'); // 'live', '1h', '12h', '24h', '7d', '15d'

    const fetchData = async () => {
        try {
            const response = await axios.get(API_URL, {
                params: { range: range === 'live' ? undefined : range }
            });
            // Si es 'live' (por defecto), vienen DESC, así que invertimos. 
            // Si es un rango específico, el server ya los manda ASC.
            const formattedData = range === 'live' ? response.data.reverse() : response.data;

            setData(formattedData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        // Actualizar más rápido si es Live (cada 2s), más lento si es historial (cada 1 min)
        const intervalTime = range === 'live' ? 2000 : 60000;
        const interval = setInterval(fetchData, intervalTime);
        return () => clearInterval(interval);
    }, [range]); // Recargar cuando cambie el rango

    const latest = data.length > 0 ? data[data.length - 1] : { temperature: 0 };

    const formatXAxis = (tickItem) => {
        if (!tickItem) return '';
        const date = new Date(tickItem);
        if (range === 'live' || range === '1h') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (range === '12h' || range === '24h') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
    };

    return (
        <div className="dashboard">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1>Neka Dashboard</h1>
                    <p style={{ color: '#94a3b8' }}>Monitor de Temperatura</p>
                </div>
            </header>

            {/* Widget Principal de Temperatura */}
            <div className="stat-card glass-card mb-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div className="stat-label flex items-center gap-2">
                        <Thermometer size={20} className="text-sky-400" />
                        TEMPERATURA ACTUAL
                    </div>
                    <div className="stat-value" style={{ fontSize: '4rem', color: '#38bdf8' }}>
                        {latest.temperature?.toFixed(1)}°C
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="stat-label">Última actualización</div>
                    <div style={{ color: '#94a3b8' }}>{new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}</div>
                </div>
            </div>

            {/* Controles de Rango */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['live', '1h', '12h', '24h', '7d', '15d'].map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${range === r
                                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {r === 'live' ? 'En Vivo' : r.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="glass-card chart-container" style={{ height: '500px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatXAxis}
                            stroke="#64748b"
                            tick={{ fontSize: 12 }}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#64748b"
                            domain={[20, 60]}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                            itemStyle={{ color: '#38bdf8' }}
                            labelFormatter={(label) => new Date(label).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                            formatter={(value) => [`${value}°C`, 'Temperatura']}
                        />
                        <Area
                            type="monotone"
                            dataKey="temperature"
                            stroke="#38bdf8"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTemp)"
                            animationDuration={500}
                            isAnimationActive={range === 'live'} // Solo animar en vivo para rendimiento
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default App;
