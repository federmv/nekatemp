import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { Activity, Aperture, Wifi, WifiOff } from 'lucide-react';

const API_URL = '/api/data';
const STATS_URL = '/api/data/stats';
const STREAM_URL = '/api/data/stream';

// Custom hook for SSE connection
function useSSE(url, onMessage) {
    const [connected, setConnected] = useState(false);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        let retries = 0;

        function connect() {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const es = new EventSource(url);
            eventSourceRef.current = es;

            es.onopen = () => {
                setConnected(true);
                retries = 0;
            };

            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage(data);
                } catch (e) {
                    // heartbeat or malformed
                }
            };

            es.onerror = () => {
                setConnected(false);
                es.close();
                // Exponential backoff: max 30s
                const delay = Math.min(1000 * Math.pow(2, retries), 30000);
                retries++;
                reconnectTimeoutRef.current = setTimeout(connect, delay);
            };
        }

        connect();

        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [url]);

    return connected;
}

// Ultra-lightweight uPlot wrapper
function TempChart({ timestamps, temperatures, range }) {
    const containerRef = useRef(null);
    const plotRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || timestamps.length === 0) return;

        const rect = containerRef.current.getBoundingClientRect();

        const fmtTime = (u, v) => {
            const d = new Date(v * 1000);
            if (range === 'live' || range === '1h') {
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        };

        const opts = {
            width: rect.width,
            height: rect.height,
            cursor: {
                drag: { x: false, y: false },
                points: {
                    size: 8,
                    fill: '#ffcc00',
                    stroke: '#ffcc00',
                    width: 2
                }
            },
            select: { show: false },
            legend: { show: false },
            padding: [16, 8, 0, 0],
            scales: {
                x: { time: true },
                y: {
                    auto: true,
                    range: (u, dmin, dmax) => {
                        const pad = (dmax - dmin) * 0.1 || 0.5;
                        return [dmin - pad, dmax + pad];
                    }
                }
            },
            axes: [
                {
                    stroke: '#48484a',
                    grid: { stroke: 'rgba(255,255,255,0.04)', width: 1 },
                    ticks: { stroke: 'rgba(255,255,255,0.04)', width: 1 },
                    font: '10px "JetBrains Mono"',
                    values: fmtTime,
                    gap: 8,
                    size: 40
                },
                {
                    stroke: '#48484a',
                    grid: { stroke: 'rgba(255,255,255,0.04)', width: 1 },
                    ticks: { stroke: 'rgba(255,255,255,0.04)', width: 1 },
                    font: '10px "JetBrains Mono"',
                    values: (u, vals) => vals.map(v => v.toFixed(1)),
                    gap: 8,
                    size: 50
                }
            ],
            series: [
                {},
                {
                    label: 'Temp',
                    stroke: '#ffcc00',
                    width: 2,
                    fill: (u, seriesIdx) => {
                        const ctx = u.ctx;
                        const yPos0 = u.valToPos(u.scales.y.min, 'y', true);
                        const yPos1 = u.valToPos(u.scales.y.max, 'y', true);
                        const grad = ctx.createLinearGradient(0, yPos1, 0, yPos0);
                        grad.addColorStop(0, 'rgba(255,204,0,0.15)');
                        grad.addColorStop(1, 'rgba(255,204,0,0)');
                        return grad;
                    },
                    points: { show: false }
                }
            ]
        };

        const data = [timestamps, temperatures];

        if (plotRef.current) {
            plotRef.current.destroy();
        }

        plotRef.current = new uPlot(opts, data, containerRef.current);

        return () => {
            if (plotRef.current) {
                plotRef.current.destroy();
                plotRef.current = null;
            }
        };
    }, [timestamps, temperatures, range]);

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return;

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (plotRef.current) {
                    plotRef.current.setSize({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    });
                }
            }
        });

        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// Tooltip for hover value
function ValueTooltip({ timestamps, temperatures, range }) {
    // This is handled by uPlot cursor natively
    return null;
}

function App() {
    const [chartData, setChartData] = useState({ timestamps: [], temperatures: [] });
    const [stats, setStats] = useState({ peak: 0, low: 0, avg: 0, count: 0 });
    const [range, setRange] = useState('live');
    const [latestTemp, setLatestTemp] = useState(null);
    const liveBufferRef = useRef([]);
    const maxLivePoints = 60;

    // Parse timestamp string to unix seconds
    const parseTs = useCallback((ts) => {
        if (!ts) return Date.now() / 1000;
        return new Date(ts.replace(' ', 'T') + 'Z').getTime() / 1000;
    }, []);

    // Fetch historical data
    const fetchData = useCallback(async (r) => {
        try {
            const [dataRes, statsRes] = await Promise.all([
                fetch(`${API_URL}?range=${r === 'live' ? '' : r}`),
                fetch(`${STATS_URL}?range=${r === 'live' ? '' : r}`)
            ]);

            const data = await dataRes.json();
            const statsData = await statsRes.json();

            const ts = data.map(d => parseTs(d.timestamp));
            const temps = data.map(d => d.temperature);

            setChartData({ timestamps: ts, temperatures: temps });
            setStats(statsData);

            if (r === 'live') {
                liveBufferRef.current = data.map(d => ({
                    timestamp: parseTs(d.timestamp),
                    temperature: d.temperature
                }));
                if (data.length > 0) {
                    setLatestTemp(data[data.length - 1].temperature);
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
        }
    }, [parseTs]);

    // SSE handler — only active when range is 'live'
    const handleSSE = useCallback((data) => {
        if (range !== 'live') return;

        const ts = parseTs(data.timestamp);
        const temp = data.temperature;

        setLatestTemp(temp);

        liveBufferRef.current.push({ timestamp: ts, temperature: temp });
        if (liveBufferRef.current.length > maxLivePoints) {
            liveBufferRef.current = liveBufferRef.current.slice(-maxLivePoints);
        }

        const buf = liveBufferRef.current;
        setChartData({
            timestamps: buf.map(d => d.timestamp),
            temperatures: buf.map(d => d.temperature)
        });

        // Update stats from buffer
        const temps = buf.map(d => d.temperature);
        setStats({
            peak: Math.max(...temps),
            low: Math.min(...temps),
            avg: +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2),
            count: temps.length
        });
    }, [range, parseTs]);

    const connected = useSSE(STREAM_URL, handleSSE);

    // Fetch data on range change
    useEffect(() => {
        fetchData(range);

        // For non-live ranges, poll every 60s
        if (range !== 'live') {
            const interval = setInterval(() => fetchData(range), 60000);
            return () => clearInterval(interval);
        }
    }, [range, fetchData]);

    const timeRanges = useMemo(() => [
        { k: 'live', l: 'LIVE', icon: '⚡' },
        { k: '1h', l: '1H' },
        { k: '24h', l: '24H' },
        { k: '7d', l: '7D' },
        { k: '15d', l: '15D' }
    ], []);

    return (
        <div className="dashboard-layout">
            <header>
                <h1>
                    <span className="brand-pill">NEKA</span>
                    Monitor
                </h1>
                <div className={`status-indicator ${connected ? '' : 'disconnected'}`}>
                    {connected
                        ? <><Wifi size={12} /> <span>LIVE</span></>
                        : <><WifiOff size={12} /> <span>OFFLINE</span></>
                    }
                </div>
            </header>

            <div className="readout-container">
                {/* Main Readout */}
                <div className="glass-panel main-readout">
                    <div className="readout-label">
                        <Aperture size={16} color="var(--accent-primary)" />
                        Ambient Sensor
                    </div>

                    <div className="readout-value-wrapper">
                        <span className="readout-value mono-num">
                            {latestTemp != null ? latestTemp.toFixed(1) : '--'}
                            <span className="readout-unit">°C</span>
                        </span>
                    </div>

                    <div className="readout-meta">
                        <div className="meta-item">
                            <span className="meta-label">Peak</span>
                            <span className="meta-value">
                                {stats.peak ? stats.peak.toFixed(1) : '--'}°
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Low</span>
                            <span className="meta-value">
                                {stats.low ? stats.low.toFixed(1) : '--'}°
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Avg</span>
                            <span className="meta-value">
                                {stats.avg ? stats.avg.toFixed(1) : '--'}°
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Points</span>
                            <span className="meta-value">
                                {stats.count || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Time Scale Control */}
                <div className="glass-panel side-panel">
                    <div className="chart-label">TIME SCALE</div>
                    <div className="time-buttons">
                        {timeRanges.map((item) => (
                            <button
                                key={item.k}
                                onClick={() => setRange(item.k)}
                                className={`time-tab ${range === item.k ? 'active' : ''}`}
                            >
                                {item.icon && <span className="tab-icon">{item.icon}</span>}
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
                    <div className="range-badge">{range.toUpperCase()}</div>
                </div>

                <div className="chart-canvas-wrap">
                    <TempChart
                        timestamps={chartData.timestamps}
                        temperatures={chartData.temperatures}
                        range={range}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
