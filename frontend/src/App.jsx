import { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const SERVER_URL = '';

function IOTChart({ title, data, dataKey, color, range, setRange }) {
  return (
    <div className="iot-card">
      <div className="iot-header">
        <h2>{title}</h2>
      </div>
      
      <div className="iot-range-bar">
        {['15 D', '7 D', '1 D', '1 H', 'LIVE'].map(r => (
          <button 
            key={r} 
            className={range === r ? 'active' : ''} 
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="iot-chart-wrapper">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 35, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eee" />
            <XAxis 
              dataKey="timestamp" 
              axisLine={false}
              tickLine={true}
              tick={{fill: '#999', fontSize: 12}}
              tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              minTickGap={40}
            />
            <YAxis 
              orientation="right" 
              axisLine={false}
              tickLine={false}
              tick={{fill: '#666', fontSize: 12}}
              domain={['auto', 'auto']}
              tickFormatter={(val) => val.toFixed(1)}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              labelFormatter={(t) => new Date(t).toLocaleString()}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={3} 
              fillOpacity={1} 
              fill={`url(#color${dataKey})`} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="iot-timezone">UTC-05</div>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState('LIVE');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/data?range=${range.toLowerCase()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) { console.error(err); }
    };
    fetchHistory();

    if (range === 'LIVE') {
      const eventSource = new EventSource(`${SERVER_URL}/api/data/stream`);
      eventSource.onmessage = (e) => {
        try {
          const newPoint = JSON.parse(e.data);
          setData(prev => {
            const next = [...prev, newPoint];
            return next.slice(-50);
          });
        } catch(err) { console.error(err); }
      };
      return () => eventSource.close();
    }
  }, [range]);

  return (
    <div className="iot-container">
      <div className="iot-stack">
        <IOTChart 
          title="Temperatura Agua" 
          data={data} 
          dataKey="temp_water" 
          color="#008784" 
          range={range} 
          setRange={setRange} 
        />
        <IOTChart 
          title="Temperatura Ambiente" 
          data={data} 
          dataKey="temp_ambient" 
          color="#ff6b6b" 
          range={range} 
          setRange={setRange} 
        />
      </div>
    </div>
  );
}

export default App;
