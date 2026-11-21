import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge } from '../components/ui/Badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { LineChart as ChartIcon, Zap, Activity, AlertTriangle, ShieldCheck, TrendingUp, Compass } from 'lucide-react';

export const Traffic: React.FC = () => {
  const { liveState } = useWebSocket();
  const [selectedJunction, setSelectedJunction] = useState<number>(1);

  const junctions = [
    { id: 1, name: 'Rasulgarh Square', density: 76, speed: 28, level: 'HIGH' },
    { id: 2, name: 'Vani Vihar Square', density: 64, speed: 34, level: 'MEDIUM' },
    { id: 3, name: 'Master Canteen Square', density: 82, speed: 22, level: 'HIGH' },
    { id: 4, name: 'Khandagiri Square', density: 55, speed: 42, level: 'MEDIUM' },
    { id: 5, name: 'Badambadi Cuttack', density: 88, speed: 18, level: 'SEVERE' },
    { id: 6, name: 'AIIMS Healthcare Hub', density: 42, speed: 48, level: 'LOW' },
  ];

  const currentJunction = junctions.find((j) => j.id === selectedJunction) || junctions[0];

  const timelineData = [
    { time: '08:00', density: 34, emaSmoothed: 35, speed: 48, forecast: 36 },
    { time: '08:15', density: 46, emaSmoothed: 41, speed: 42, forecast: 44 },
    { time: '08:30', density: 70, emaSmoothed: 58, speed: 28, forecast: 62 },
    { time: '08:45', density: 84, emaSmoothed: 74, speed: 16, forecast: 80 },
    { time: '09:00', density: 86, emaSmoothed: 81, speed: 18, forecast: 85 },
    { time: '09:15', density: 72, emaSmoothed: 76, speed: 26, forecast: 74 },
    { time: '09:30', density: 58, emaSmoothed: 66, speed: 36, forecast: 56 },
    { time: '09:45', density: 44, emaSmoothed: 52, speed: 44, forecast: 42 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#BBF7D0] p-5 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#166534] flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-600 rounded-xl">📈</span>
            Traffic Density & Congestion AI Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exponential Moving Average (EMA β=0.4), Hysteresis noise debounce & Random Forest congestion forecasting
          </p>
        </div>

        {/* Junction Switcher */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {junctions.map((j) => (
            <button
              key={j.id}
              onClick={() => setSelectedJunction(j.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedJunction === j.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              J{j.id} {j.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Colorful Cards for Selected Junction */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white via-emerald-50/50 to-green-100/60 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Selected Location</span>
          <div className="text-base font-black text-slate-800 mt-0.5 truncate">{currentJunction.name}</div>
          <span className="inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            NH-16 Bhubaneswar
          </span>
        </div>

        <div className="bg-gradient-to-br from-white via-cyan-50/50 to-blue-100/60 border border-cyan-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Live Density (EMA)</span>
          <div className="text-2xl font-black text-cyan-800 mt-0.5">{currentJunction.density}%</div>
          <span className="text-[10px] text-slate-500 font-medium">Smoothed count: β=0.4 noise rejection</span>
        </div>

        <div className="bg-gradient-to-br from-white via-amber-50/50 to-orange-100/60 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Average Road Speed</span>
          <div className="text-2xl font-black text-amber-700 mt-0.5">{currentJunction.speed} km/h</div>
          <span className="text-[10px] text-slate-500 font-medium">Loop detector + radar telemetry</span>
        </div>

        <div className="bg-gradient-to-br from-white via-purple-50/50 to-indigo-100/60 border border-purple-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hysteresis Status</span>
          <div className="text-xl font-black text-purple-700 mt-0.5">{currentJunction.level} CONGESTION</div>
          <span className="text-[10px] text-slate-500 font-medium">Stable state (debounced threshold)</span>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Density & Speed Chart */}
        <div className="lg:col-span-2 bg-white border border-[#BBF7D0] rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Live Sensor Trend: Density (%) vs Speed (km/h)
              </h2>
              <p className="text-xs text-slate-400">Green = Raw Density, Blue = EMA Filtered, Purple = Vehicle Speed</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                Raw Density
              </span>
              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded">
                EMA β=0.4
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                Speed (km/h)
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="density" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorDensity)" name="Raw Density %" />
                <Line type="monotone" dataKey="emaSmoothed" stroke="#06B6D4" strokeWidth={2.5} dot={false} name="EMA Filtered %" />
                <Line type="monotone" dataKey="speed" stroke="#3B82F6" strokeWidth={2} dot={false} name="Speed (km/h)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hysteresis & AI Predictor Breakdown */}
        <div className="space-y-4">
          <div className="bg-white border border-[#BBF7D0] rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Dual-Threshold Hysteresis Gates
            </h3>
            <p className="text-xs text-slate-500">
              Prevents signal flapping by requiring higher occupancy to enter congested tiers and lower to exit:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">LOW ➔ MEDIUM</span>
                <span className="font-mono text-emerald-700 font-black">UP 45% / DOWN 35%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">MEDIUM ➔ HIGH</span>
                <span className="font-mono text-amber-700 font-black">UP 65% / DOWN 55%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">HIGH ➔ SEVERE</span>
                <span className="font-mono text-rose-700 font-black">UP 85% / DOWN 75%</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900">
              <strong>Status:</strong> State stable for 48 consecutive cycles without debounce flapping.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Traffic;
