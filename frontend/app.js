import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, TrendingUp, TrendingDown, Activity } from 'lucide-react';

function App() {
  const [query, setQuery] = useState('RELIANCE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStock = async (symbol) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/stock/${symbol}`);
      setData(res.data);
    } catch (err) {
      alert("Stock not found! Use symbols like RELIANCE, TCS, ZOMATO");
    }
    setLoading(false);
  };

  useEffect(() => { fetchStock('RELIANCE'); }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6">
      {/* Search Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          AI-STOCK.VISION
        </h1>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search Stock (e.g. INFY)..." 
            className="bg-slate-900 border border-slate-700 rounded-full px-10 py-2 focus:outline-none focus:border-blue-500 w-80"
            onKeyPress={(e) => e.key === 'Enter' && fetchStock(e.target.value.toUpperCase())}
          />
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
        </div>
      </div>

      {loading ? <div className="text-center mt-20">Analysing Market Data...</div> : data && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-4xl font-bold">{data.symbol}</h2>
                <p className="text-slate-400">2 Year Performance Analysis</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono">₹{data.currentPrice}</p>
                <p className={data.trend === 'Up' ? 'text-emerald-400' : 'text-rose-400'}>
                  {data.trend === 'Up' ? '▲ Bullish' : '▼ Bearish'}
                </p>
              </div>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.history}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Prediction Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 rounded-3xl shadow-xl">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Activity size={20}/> AI Prediction
              </h3>
              <p className="mt-4 text-slate-100 opacity-80">Estimated Price (Tomorrow):</p>
              <p className="text-4xl font-bold mt-2">₹{data.prediction}</p>
              <div className="mt-6 bg-white/10 p-4 rounded-xl">
                <p className="text-sm">Confidence Score: 88%</p>
                <div className="w-full bg-black/20 h-2 mt-2 rounded-full">
                  <div className="bg-emerald-400 h-full rounded-full" style={{width: '88%'}}></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
              <h3 className="text-lg font-semibold mb-4">Market Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-400">2Y High</span><span>₹{Math.max(...data.history.map(o => o.value)).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">2Y Low</span><span>₹{Math.min(...data.history.map(o => o.value)).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Volatility</span><span>Medium</span></div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;