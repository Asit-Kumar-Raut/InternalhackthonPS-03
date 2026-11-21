import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { SignalLight } from '../components/SignalLight';
import {
  Navigation,
  ArrowRight,
  Gauge,
  AlertOctagon,
} from 'lucide-react';

export const ActiveRun: React.FC = () => {
  const [searchParams] = useSearchParams();
  const runId = parseInt(searchParams.get('id') || '1', 10);
  const [demoGPS, setDemoGPS] = useState(true);
  const [simulatedIndex, setSimulatedIndex] = useState(1); // 0, 1, 2, 3
  const [speedKmh] = useState(58);
  const [countdown, setCountdown] = useState(38);
  const navigate = useNavigate();

  const stations = [
    { id: 4, name: 'Khandagiri Square', km: '0.0 km', status: 'CLEARED' },
    { id: 3, name: 'Master Canteen Square', km: '3.2 km', status: 'CURRENT' },
    { id: 2, name: 'Vani Vihar Square', km: '6.4 km', status: 'UPCOMING' },
    { id: 1, name: 'Rasulgarh Square', km: '9.6 km', status: 'DESTINATION' },
  ];

  // Automatic moving progress simulation
  useEffect(() => {
    if (!demoGPS) return;

    const interval = setInterval(() => {
      setSimulatedIndex((prev) => {
        if (prev < stations.length - 1) {
          const nextIdx = prev + 1;
          setCountdown(40);
          return nextIdx;
        }
        return prev;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [demoGPS, stations.length]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEndRun = async () => {
    try {
      await api.post(`/emergency/requests/${runId}/end`);
    } catch {
      // ignore
    }
    navigate('/home');
  };

  const currentStation = stations[simulatedIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 pb-8 font-sans">
      {/* Top Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
              GREEN CORRIDOR LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-red-950 border border-red-500/50 text-red-300 font-bold px-2 py-0.5 rounded-full uppercase">
              108 Emergency
            </span>
            <button
              onClick={() => setDemoGPS(!demoGPS)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300"
            >
              {demoGPS ? 'Auto Sim' : 'Manual'}
            </button>
          </div>
        </div>

        {/* Route Origin to Destination Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Emergency Route</span>
            <div className="text-xs font-black text-white flex items-center gap-1.5 mt-0.5">
              <span>Khandagiri</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Rasulgarh Sq</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Speed</span>
            <div className="text-sm font-black text-amber-400 flex items-center gap-1 justify-end">
              <Gauge className="w-3.5 h-3.5" />
              {speedKmh} km/h
            </div>
          </div>
        </div>
      </div>

      {/* WHERE IS MY TRAIN CONTINUOUS VERTICAL LIVE TRACK */}
      <div className="my-4 bg-slate-900/70 border border-slate-800/80 rounded-3xl p-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" /> Live Station-to-Station Track
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Odisha NH-16 Hub</span>
        </div>

        <div className="relative pl-6 space-y-6">
          {/* Vertical Track Rail Line */}
          <div className="absolute left-2.5 top-3 bottom-4 w-1 bg-slate-800 rounded-full" />
          {/* Green Passed Line */}
          <div
            className="absolute left-2.5 top-3 w-1 bg-gradient-to-b from-emerald-500 to-green-400 rounded-full transition-all duration-500 shadow-[0_0_10px_#22c55e]"
            style={{
              height: `${(simulatedIndex / (stations.length - 1)) * 88}%`,
            }}
          />

          {stations.map((st, idx) => {
            const isPassed = idx < simulatedIndex;
            const isCurrent = idx === simulatedIndex;

            return (
              <div key={st.id} className="relative flex items-start gap-4">
                {/* Station Node Marker */}
                <div
                  className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                    isPassed
                      ? 'bg-emerald-500 border-white text-white'
                      : isCurrent
                      ? 'bg-emerald-400 border-white text-slate-950 ring-4 ring-emerald-400/40 shadow-lg'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  {isPassed ? '✓' : idx + 1}
                </div>

                {/* Moving Ambulance Flag beside current station */}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black ${isCurrent ? 'text-white' : isPassed ? 'text-slate-400' : 'text-slate-500'}`}>
                        {st.name}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-red-600 text-[9px] font-black text-white rounded-full animate-bounce shadow">
                          🚑 HERE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{st.km}</span>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                      isPassed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : isCurrent
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? 'CLEARED' : isCurrent ? 'GREEN WAVE' : 'PENDING'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Junction Big Status */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-900/60 rounded-3xl p-4 text-center space-y-2 shadow-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Approaching Intersection
        </span>
        <h2 className="text-xl font-black text-emerald-400 font-mono tracking-tight">
          {currentStation.name}
        </h2>

        {/* Illuminated Signal Light */}
        <div className="py-2 flex flex-col items-center justify-center">
          <SignalLight state="GREEN" />
          <div className="mt-2 text-xs font-mono text-emerald-300 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Estimated Arrival: {countdown}s • Conflicts Locked RED
          </div>
        </div>
      </div>

      {/* End Run Button */}
      <button
        onClick={handleEndRun}
        className="w-full mt-4 py-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-red-600/30 active:scale-98 flex items-center justify-center gap-2"
      >
        <AlertOctagon className="w-4 h-4" />
        <span>END EMERGENCY RUN</span>
      </button>
    </div>
  );
};

export default ActiveRun;
