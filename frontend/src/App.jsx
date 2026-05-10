import { useState, useEffect, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ThermometerSun, AlertCircle, Calendar, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const SERVER_URL = ''; // Default to relative path for production

function App() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState('LIVE');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Fetch data when range changes
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const queryRange = range === 'LIVE' ? 'live' : range.toLowerCase();
        const res = await fetch(`${SERVER_URL}/api/data?range=${queryRange}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            setData(json); // Backend already handles order
          }
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // 2. Setup SSE for LIVE range
    let eventSource = null;
    if (range === 'LIVE') {
      eventSource = new EventSource(`${SERVER_URL}/api/data/stream`);
      
      eventSource.onopen = () => setConnected(true);
      eventSource.onmessage = (event) => {
        try {
          const newPoint = JSON.parse(event.data);
          if (newPoint) {
            setData(prev => {
              const next = [...prev, newPoint];
              return next.slice(-100); // Keep last 100 in live mode
            });
            setConnected(true);
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      };
      eventSource.onerror = () => setConnected(false);
    } else {
      setConnected(true); // Treat as "connected" if viewing history
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [range]);

  // 3. Local Calculations (Business logic in App)
  const stats = useMemo(() => {
    if (data.length === 0) return { max: 0, min: 0, avg: 0, current: 0, lastTime: '' };
    
    // For current value, we always take the last point
    const lastPoint = data[data.length - 1];
    
    // For Max/Min, we check both raw values and potentially the max/min_temp_water from buckets
    let max = -Infinity;
    let min = Infinity;
    let sum = 0;

    data.forEach(p => {
      const val = p.temp_water;
      const pMax = p.max_temp_water ?? val;
      const pMin = p.min_temp_water ?? val;
      
      if (pMax > max) max = pMax;
      if (pMin < min) min = pMin;
      sum += val;
    });

    return {
      max: max === -Infinity ? 0 : max,
      min: min === Infinity ? 0 : min,
      avg: sum / data.length,
      current: lastPoint.temp_water,
      lastTime: new Date(lastPoint.timestamp).toLocaleTimeString()
    };
  }, [data]);

  return (
    <div className="app-wrapper">
      <header className="header-container">
        <div className="title-icon">
          <ThermometerSun size={40} color="#fff" />
        </div>
        <div className="title-text">
          <h1>Neka Temp</h1>
          <p>Sistema de Monitoreo Inteligente</p>
        </div>
        <div className={`connection-status ${!connected && range === 'LIVE' ? 'off' : 'on'}`}>
          <Activity size={16} />
          <span>{range === 'LIVE' ? (connected ? 'LIVE' : 'RECONECTANDO') : 'HISTORIAL'}</span>
        </div>
      </header>

      <main className="main-content">
        {/* Main Display Card */}
        <section className="glass-card main-stats">
          <div className="temp-hero">
            <div className="current-temp">
              <span className="value">{stats.current.toFixed(1)}</span>
              <span className="unit">°C</span>
            </div>
            <div className="last-update">
              <Clock size={14} />
              <span>{stats.lastTime || '--:--'}</span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item max">
              <div className="stat-icon"><TrendingUp size={20} /></div>
              <div className="stat-info">
                <span className="label">MÁXIMO</span>
                <span className="val">{stats.max.toFixed(1)}°C</span>
              </div>
            </div>
            <div className="stat-item min">
              <div className="stat-icon"><TrendingDown size={20} /></div>
              <div className="stat-info">
                <span className="label">MÍNIMO</span>
                <span className="val">{stats.min.toFixed(1)}°C</span>
              </div>
            </div>
            <div className="stat-item avg">
              <div className="stat-icon"><Activity size={20} /></div>
              <div className="stat-info">
                <span className="label">PROMEDIO</span>
                <span className="val">{stats.avg.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
        </section>

        {/* Range Selector */}
        <nav className="range-selector">
          {['LIVE', '1H', '24H', '7D', '15D'].map(r => (
            <button 
              key={r} 
              className={`range-btn ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === 'LIVE' ? <Activity size={14} /> : <Calendar size={14} />}
              {r}
            </button>
          ))}
        </nav>

        {/* Chart Card */}
        <section className="glass-card chart-section">
          <div className="chart-header">
            <h3>Gráfica de Tendencia</h3>
            {loading && <div className="loader-mini"></div>}
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4facfe" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(tick) => {
                    const d = new Date(tick);
                    return range === '7D' || range === '15D' 
                      ? `${d.getDate()}/${d.getMonth()+1}`
                      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }}
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  minTickGap={30}
                />
                <YAxis
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#00f2fe' }}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Area
                  type="monotone"
                  dataKey="temp_water"
                  stroke="#00f2fe"
                  strokeWidth={3}
                  fill="url(#colorTemp)"
                  isAnimationActive={range === 'LIVE'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>

      {range === 'LIVE' && !connected && (
        <footer className="connection-error">
          <AlertCircle size={16} />
          <span>Intentando conectar con el servidor...</span>
        </footer>
      )}
    </div>
  );
}

export default App;
