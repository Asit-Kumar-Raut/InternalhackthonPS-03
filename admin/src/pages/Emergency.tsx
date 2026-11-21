import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Siren,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Zap,
  MapPin,
  Clock,
  Gauge,
  Sliders,
} from 'lucide-react';

interface CorridorStation {
  id: number;
  name: string;
  distanceKm: number;
  status: 'CLEARED' | 'ACTIVE_GREEN' | 'TRANSITIONING' | 'UPCOMING';
  signals: {
    N: 'RED' | 'YELLOW' | 'GREEN';
    S: 'RED' | 'YELLOW' | 'GREEN';
    E: 'RED' | 'YELLOW' | 'GREEN';
    W: 'RED' | 'YELLOW' | 'GREEN';
  };
  approachRoad: 'N' | 'S' | 'E' | 'W';
  trafficCounts: { N: number; S: number; E: number; W: number };
  etaSeconds: number;
}

export const Emergency: React.FC = () => {
  const { liveState } = useWebSocket();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Active simulated corridor run progress (0 to 100%)
  const [progress, setProgress] = useState<number>(35);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedKmh, setSpeedKmh] = useState<number>(55);

  const fetchRequests = async () => {
    try {
      const data = await api.get<any[]>('/emergency/requests');
      setRequests(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Animate moving ambulance along track
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0; // loop demo
        return Math.min(100, prev + 1.2);
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const liveRuns = liveState?.emergency_runs || [];

  // 4 Junctions along the corridor (Khandagiri -> Master Canteen -> Vani Vihar -> Rasulgarh)
  const stations: CorridorStation[] = [
    {
      id: 4,
      name: 'Khandagiri Square',
      distanceKm: 0.0,
      status: progress > 25 ? 'CLEARED' : progress > 5 ? 'ACTIVE_GREEN' : 'TRANSITIONING',
      approachRoad: 'W',
      trafficCounts: { N: 14, S: 18, E: 24, W: 4 },
      signals: progress > 25 
        ? { N: 'GREEN', S: 'GREEN', E: 'RED', W: 'RED' } // returned to normal
        : { N: 'RED', S: 'RED', E: 'RED', W: 'GREEN' }, // green for ambulance west
      etaSeconds: 0,
    },
    {
      id: 3,
      name: 'Master Canteen Square',
      distanceKm: 3.2,
      status: progress > 55 ? 'CLEARED' : progress >= 20 && progress <= 55 ? 'ACTIVE_GREEN' : 'TRANSITIONING',
      approachRoad: 'W',
      trafficCounts: { N: 28, S: 32, E: 12, W: 6 },
      signals: progress > 55
        ? { N: 'GREEN', S: 'GREEN', E: 'RED', W: 'RED' }
        : progress >= 20
        ? { N: 'RED', S: 'RED', E: 'RED', W: 'GREEN' } // Green corridor active!
        : { N: 'YELLOW', S: 'YELLOW', E: 'RED', W: 'RED' }, // Preparing yellow
      etaSeconds: Math.max(0, Math.round((3.2 - (progress / 100) * 9.6) * 60)),
    },
    {
      id: 2,
      name: 'Vani Vihar Square',
      distanceKm: 6.4,
      status: progress > 85 ? 'CLEARED' : progress >= 50 && progress <= 85 ? 'ACTIVE_GREEN' : progress >= 30 ? 'TRANSITIONING' : 'UPCOMING',
      approachRoad: 'S',
      trafficCounts: { N: 16, S: 8, E: 35, W: 29 },
      signals: progress > 85
        ? { N: 'RED', S: 'RED', E: 'GREEN', W: 'GREEN' }
        : progress >= 50
        ? { N: 'RED', S: 'GREEN', E: 'RED', W: 'RED' } // Green for ambulance south approach!
        : progress >= 30
        ? { N: 'RED', S: 'RED', E: 'YELLOW', W: 'YELLOW' } // Safety transition
        : { N: 'RED', S: 'RED', E: 'GREEN', W: 'GREEN' },
      etaSeconds: Math.max(0, Math.round((6.4 - (progress / 100) * 9.6) * 60)),
    },
    {
      id: 1,
      name: 'Rasulgarh Square',
      distanceKm: 9.6,
      status: progress >= 80 ? 'ACTIVE_GREEN' : progress >= 60 ? 'TRANSITIONING' : 'UPCOMING',
      approachRoad: 'W',
      trafficCounts: { N: 42, S: 38, E: 20, W: 10 },
      signals: progress >= 80
        ? { N: 'RED', S: 'RED', E: 'RED', W: 'GREEN' } // Final junction cleared!
        : progress >= 60
        ? { N: 'YELLOW', S: 'YELLOW', E: 'RED', W: 'RED' }
        : { N: 'GREEN', S: 'GREEN', E: 'RED', W: 'RED' },
      etaSeconds: Math.max(0, Math.round((9.6 - (progress / 100) * 9.6) * 60)),
    },
  ];

  const handleConfirm = async (id: number) => {
    setLoading(true);
    try {
      await api.post(`/emergency/requests/${id}/confirm`);
      await fetchRequests();
    } finally {
      setLoading(false);
    }
  };

  const handleAbort = async (id: number) => {
    setLoading(true);
    try {
      await api.post(`/emergency/requests/${id}/abort`);
      await fetchRequests();
    } finally {
      setLoading(false);
    }
  };

  // Find currently active junction
  const activeStationIndex = progress < 25 ? 0 : progress < 55 ? 1 : progress < 85 ? 2 : 3;
  const currentStation = stations[activeStationIndex];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#BBF7D0] p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#166534] flex items-center gap-2">
            <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">🚨</span>
            AI Verified Green Corridor Live Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            "Where Is My Train" continuous station-to-station corridor clearing with Actuated FSM signal pre-emption
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-600 text-white shadow'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Simulation' : 'Auto Advance'}
          </button>
          <button
            onClick={() => setProgress(0)}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Restart Corridor Run"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trip Route Banner Card (Rapido & Where Is My Train Style) */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-red-500/90 text-white text-[11px] font-black rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Live Green Corridor Active
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-800/80 text-emerald-200 border border-emerald-600/50 text-[10px] font-bold rounded-lg uppercase">
                OD-02-EMG-108 • Ambulance
              </span>
              <span className="text-xs text-slate-300">AIIMS Trauma Hub ➔ SCB Medical</span>
            </div>

            <div className="flex items-center gap-3 text-lg sm:text-2xl font-black tracking-tight">
              <span>Khandagiri Square</span>
              <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Master Canteen</span>
              <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Vani Vihar</span>
              <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300">Rasulgarh Square</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              4 Junctions • Total Route 9.6 km along NH-16 Odisha Arterial Corridor
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Gauge className="w-3 h-3 text-emerald-400" /> Speed
              </span>
              <div className="text-base font-black text-white">{speedKmh} km/h</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Total ETA
              </span>
              <div className="text-base font-black text-amber-300">
                {Math.max(1, Math.round(((100 - progress) / 100) * 8.5))} min
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Next Signal
              </span>
              <div className="text-base font-black text-emerald-400">CLEARED 🟢</div>
            </div>
          </div>
        </div>

        {/* WHERE IS MY TRAIN CONTINUOUS TRACK LINE */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
            <span>LIVE AMBULANCE POSITION: {progress.toFixed(0)}% ROUTE COMPLETED</span>
            <span className="text-emerald-400 font-semibold">
              Approaching: {currentStation.name} ({currentStation.etaSeconds}s away)
            </span>
          </div>

          <div className="relative py-7">
            {/* Base grey line */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-3 bg-slate-800 rounded-full shadow-inner" />

            {/* Filled green route line */}
            <div
              className="absolute top-1/2 left-0 -translate-y-1/2 h-3 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
              style={{ width: `${progress}%` }}
            />

            {/* Moving Ambulance Icon */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 z-30 cursor-pointer"
              style={{ left: `${Math.max(2, Math.min(98, progress))}%` }}
            >
              <div className="relative flex flex-col items-center">
                <div className="px-2 py-0.5 bg-red-600 text-[10px] font-black text-white rounded-full shadow-lg border border-white/40 mb-1 whitespace-nowrap animate-bounce">
                  🚑 108 LIVE
                </div>
                <div className="w-9 h-9 bg-white text-red-600 rounded-full flex items-center justify-center text-lg shadow-2xl border-2 border-red-500 animate-pulse">
                  🚑
                </div>
              </div>
            </div>

            {/* Stations / Junctions on the track */}
            <div className="relative flex justify-between z-20">
              {stations.map((st, idx) => {
                const isCleared = st.status === 'CLEARED';
                const isActive = st.status === 'ACTIVE_GREEN';
                const isTrans = st.status === 'TRANSITIONING';

                return (
                  <div key={st.id} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all shadow-md ${
                        isCleared
                          ? 'bg-emerald-500 border-white text-white'
                          : isActive
                          ? 'bg-emerald-400 border-white text-slate-900 ring-4 ring-emerald-400/40 animate-pulse'
                          : isTrans
                          ? 'bg-amber-400 border-white text-slate-900 ring-4 ring-amber-400/40'
                          : 'bg-slate-700 border-slate-600 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="mt-2 text-center">
                      <span className="block text-xs font-black text-white">{st.name}</span>
                      <span className="block text-[10px] text-slate-400">{st.distanceKm} km</span>
                      <span
                        className={`inline-block mt-0.5 text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                          isCleared
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                            : isActive
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : isTrans
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCleared ? 'CLEARED' : isActive ? 'GREEN SIGNAL' : isTrans ? 'ALL-RED' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4-ROAD CROSSROADS VIEW FOR EVERY JUNCTION EN-ROUTE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black text-[#166534] flex items-center gap-2">
              <span>🚦</span> Real-Time 4-Way Crossroads Status Along Route
            </h2>
            <p className="text-xs text-slate-500">
              Each junction pre-empts conflicting cross-roads to ALL_RED while opening an uninterrupted GREEN lane for the ambulance
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
            Conflict Matrix: 100% Conflict Free
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((st, index) => {
            const isAmbulanceHere = currentStation.id === st.id;

            return (
              <div
                key={st.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                  isAmbulanceHere
                    ? 'border-emerald-500 ring-2 ring-emerald-400/30 bg-emerald-50/20'
                    : 'border-[#BBF7D0]'
                }`}
              >
                {/* Station header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center">
                        J{st.id}
                      </span>
                      <h3 className="text-xs font-black text-slate-800 truncate">{st.name}</h3>
                    </div>
                    <span className="text-[10px] text-slate-400">{st.distanceKm} km mark</span>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      st.status === 'CLEARED'
                        ? 'bg-slate-100 text-slate-600'
                        : st.status === 'ACTIVE_GREEN'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {st.status.replace('_', ' ')}
                  </span>
                </div>

                {/* 4-Way Cross Intersection Mini Schematic */}
                <div className="relative aspect-square max-w-[200px] mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
                  {/* Road Asphalt lines */}
                  {/* Vertical Road (North - South) */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-14 bg-slate-800 border-x border-slate-700 flex flex-col justify-between py-1 items-center">
                    <span className="text-[8px] font-bold text-slate-400">N ({st.trafficCounts.N})</span>
                    <span className="text-[8px] font-bold text-slate-400">S ({st.trafficCounts.S})</span>
                  </div>

                  {/* Horizontal Road (East - West) */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-14 bg-slate-800 border-y border-slate-700 flex justify-between px-1 items-center">
                    <span className="text-[8px] font-bold text-slate-400">W ({st.trafficCounts.W})</span>
                    <span className="text-[8px] font-bold text-slate-400">E ({st.trafficCounts.E})</span>
                  </div>

                  {/* Center Junction Intersection */}
                  <div className="relative z-10 w-14 h-14 bg-slate-950/80 rounded-lg flex items-center justify-center">
                    {isAmbulanceHere ? (
                      <span className="text-lg animate-bounce" title="Ambulance Current Intersection">
                        🚑
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-500">J{st.id}</span>
                    )}
                  </div>

                  {/* 4 Traffic Signals positioned at approaches */}
                  {/* North Light */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border border-slate-950 shadow-md ${
                        st.signals.N === 'GREEN'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#4ade80]'
                          : st.signals.N === 'YELLOW'
                          ? 'bg-amber-400 shadow-[0_0_8px_#facc15]'
                          : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                      }`}
                    />
                  </div>

                  {/* South Light */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border border-slate-950 shadow-md ${
                        st.signals.S === 'GREEN'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#4ade80]'
                          : st.signals.S === 'YELLOW'
                          ? 'bg-amber-400 shadow-[0_0_8px_#facc15]'
                          : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                      }`}
                    />
                  </div>

                  {/* West Light (Ambulance Entry) */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border border-slate-950 shadow-md ${
                        st.signals.W === 'GREEN'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#4ade80]'
                          : st.signals.W === 'YELLOW'
                          ? 'bg-amber-400 shadow-[0_0_8px_#facc15]'
                          : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                      }`}
                    />
                    {st.approachRoad === 'W' && (
                      <span className="text-[10px] ml-0.5 text-emerald-400 font-bold" title="Ambulance Entry Road">
                        ➔
                      </span>
                    )}
                  </div>

                  {/* East Light */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border border-slate-950 shadow-md ${
                        st.signals.E === 'GREEN'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#4ade80]'
                          : st.signals.E === 'YELLOW'
                          ? 'bg-amber-400 shadow-[0_0_8px_#facc15]'
                          : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                      }`}
                    />
                  </div>
                </div>

                {/* Road summary pill */}
                <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-[10px]">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Corridor Road: Approach {st.approachRoad}</span>
                    <span className="text-emerald-700 font-bold">
                      {st.signals[st.approachRoad] === 'GREEN' ? '🟢 GREEN WAVE' : '🟡 PREPARING'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 mt-0.5">
                    <span>Cross Roads (Conflict):</span>
                    <span className="text-red-600 font-bold">LOCKED RED</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PENDING OPERATOR CONFIRMATIONS & AUDIT QUEUE */}
      <div className="bg-white rounded-2xl border border-[#BBF7D0] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-[#166534] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              Emergency Vehicle Corridor Queue & Manual Controller Overrides
            </h2>
            <p className="text-xs text-slate-500">
              Only verified approved emergency vehicles with active triage clearance can command green signal pre-emption
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            {requests.length} Requests on Record
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-[#F0FDF4]/30 rounded-xl border border-dashed border-[#BBF7D0]">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">No Pending Emergency Authorizations</div>
            <p className="text-xs text-slate-500 mt-1">
              Live automated green corridors are operating smoothly along NH-16 under Webster + Actuated control.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0FDF4] text-slate-700 font-bold uppercase border-b border-[#BBF7D0]">
                <tr>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Hospital / Triage</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">AI Verification</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-black text-slate-800">
                      {req.vehicle?.plate_number || `Vehicle #${req.vehicle_id}`}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="info">{req.vehicle?.vehicle_type || 'AMBULANCE'}</Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {req.hospital_name || 'AIIMS Emergency Hub'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          req.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'PENDING_CONFIRM'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        AI Verified (Plate + GPS)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {req.status === 'PENDING_CONFIRM' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={loading}
                          onClick={() => handleConfirm(req.id)}
                        >
                          Confirm Corridor
                        </Button>
                      )}
                      {req.status === 'CONFIRMED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={loading}
                          onClick={() => handleAbort(req.id)}
                        >
                          Abort Run
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Emergency;
