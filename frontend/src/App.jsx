import { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ThermometerSun, AlertCircle, Droplets, Wind } from 'lucide-react';

const SERVER_URL = '';

function App() {
  const [data, setData] = useState([]);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [ambientTemp, setAmbientTemp] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [range, setRange] = useState('live');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/data?range=${range}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            setData(json);
            if (json.length > 0) {
              const latest = json[json.length - 1];
              setCurrentTemp(latest.temp_water || latest.temperature || null);
              setAmbientTemp(latest.temp_ambient || latest.humidity || null);
              setLastUpdated(new Date(latest.timestamp).toLocaleTimeString());
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch historical data", err);
      }
    };
    fetchHistory();

    if (range === 'live') {
      const eventSource = new EventSource(`${SERVER_URL}/api/data/stream`);
      eventSource.onopen = () => setConnected(true);
      eventSource.onmessage = (event) => {
        try {
          const newPoint = JSON.parse(event.data);
          if (newPoint) {
            const tWater = newPoint.temp_water || newPoint.temperature;
            const tAmb = newPoint.temp_ambient || newPoint.humidity;
            if (tWater !== undefined) setCurrentTemp(tWater);
            if (tAmb !== undefined) setAmbientTemp(tAmb);
            setLastUpdated(new Date(newPoint.timestamp).toLocaleTimeString());
            setData(prev => {
              const next = [...prev, newPoint];
              if (next.length > 50) next.shift();
              return next;
            });
          }
        } catch (err) { console.error(err); }
      };
      eventSource.onerror = () => setConnected(false);
      return () => eventSource.close();
    } else {
      setConnected(true); // Treat as connected for historical view
    }
  }, [range]);

  return (
    <div className="dashboard-root">
      <div className="header-container">
        <div className="title-icon">
          <ThermometerSun size={48} color="#fff" />
        </div>
        <div>
          <h1>Neka Temp</h1>
          <p style={{ margin: 0, opacity: 0.8 }}>Monitoreo en Tiempo Real - Oracle Cloud</p>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header">
          <div className={`status-badge ${!connected ? 'disconnected' : ''}`}>
            <div className="pulse"></div>
            {connected ? (range === 'live' ? 'En Vivo' : `Histórico: ${range}`) : 'Desconectado'}
          </div>

          <div className="range-selector">
            {['live', '1h', '24h', '7d', '15d'].map(r => (
              <button 
                key={r} 
                onClick={() => setRange(r)}
                className={range === r ? 'active' : ''}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="main-stats">
          <div className="temp-box">
            <div className="label"><Droplets size={16} /> Agua</div>
            <div className="temp-display">
              {currentTemp !== null ? currentTemp.toFixed(1) : '--'}
              <span>°C</span>
            </div>
          </div>
          
          <div className="temp-box ambient">
            <div className="label"><Wind size={16} /> Ambiente</div>
            <div className="temp-display small">
              {ambientTemp !== null ? ambientTemp.toFixed(1) : '--'}
              <span>°C</span>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', opacity: 0.7, margin: '1rem 0' }}>
          {lastUpdated ? `Última lectura: ${lastUpdated}` : 'Esperando datos del ESP32...'}
        </p>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAmb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff9a9e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ff9a9e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                width={30}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
              />
              <Area
                type="monotone"
                dataKey="temp_water"
                name="Agua"
                stroke="#00d2ff"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorWater)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="temp_ambient"
                name="Ambiente"
                stroke="#ff9a9e"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorAmb)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!connected && (
        <div className="error-footer">
          <AlertCircle size={20} />
          <span>Error de conexión. Verifica que el servidor Oracle esté en línea.</span>
        </div>
      )}
    </div>
  );
}

export default App;
