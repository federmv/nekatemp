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

    // Función auxiliar para parsear fechas UTC de SQLite correctamente
    const parseTimestamp = (timestamp) => {
        if (!timestamp) return new Date();
        // SQLite devuelve "YYYY-MM-DD HH:MM:SS" (UTC).
        // Reemplazamos espacio por T y agregamos Z para que JS sepa que es UTC.
        return new Date(timestamp.replace(' ', 'T') + 'Z');
    };

    const formatXAxis = (tickItem) => {
        if (!tickItem) return '';
        const date = parseTimestamp(tickItem);
        const coOptions = { timeZone: 'America/Bogota' };

        if (range === 'live' || range === '1h') return date.toLocaleTimeString('es-CO', { ...coOptions, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (range === '12h' || range === '24h') return date.toLocaleTimeString('es-CO', { ...coOptions, hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString('es-CO', { ...coOptions, month: 'short', day: 'numeric', hour: '2-digit' });
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
            <div className="stat-card glass-card mb-8 main-stat-widget" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div className="stat-label flex items-center gap-2">
                        <Thermometer size={20} className="text-sky-400" />
                        TEMPERATURA ACTUAL
                    </div>
                    <div className="stat-value" style={{ fontSize: '4rem', color: '#38bdf8' }}>
                        {latest.temperature?.toFixed(2)}°C
                    </div>
                </div>
                <div className="update-info" style={{ textAlign: 'right' }}>
                    <div className="stat-label">Última actualización</div>
                    <div style={{ color: '#94a3b8' }}>{new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}</div>
                </div>
            </div>

            <div className="glass-card chart-container" style={{ height: '540px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0' }}>Historial</h3>

                    {/* Selector de Rango Estilo Segmentado */}
                    <div className="range-segment" style={{ display: 'flex', background: '#0f172a', padding: '4px', borderRadius: '8px', gap: '2px' }}>
                        {[
                            { k: 'live', l: 'LIVE' },
                            { k: '1h', l: '1H' },
                            { k: '24h', l: '1D' },
                            { k: '7d', l: '7D' },
                            { k: '15d', l: '15D' }
                        ].map((item) => (
                            <button
                                key={item.k}
                                onClick={() => setRange(item.k)}
                                style={{
                                    border: 'none',
                                    background: range === item.k ? '#38bdf8' : 'transparent',
                                    color: range === item.k ? '#0f172a' : '#64748b',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {item.l}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={true} />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatXAxis}
                                stroke="#94a3b8"
                                tick={{ fontSize: 11 }}
                                minTickGap={50}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                domain={[20, 60]}
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
                                labelFormatter={(label) => parseTimestamp(label).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                                formatter={(value) => [`${value}°C`, '']}
                                cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="temperature"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorTemp)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                animationDuration={300}
                                isAnimationActive={range === 'live'}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default App;
