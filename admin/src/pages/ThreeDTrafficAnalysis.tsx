import React, { useState, useRef } from 'react';
import {
  Box,
  Layers,
  Sparkles,
  Siren,
  Car,
  Camera,
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Compass,
  ArrowRight,
  Trash2,
  Flame,
} from 'lucide-react';

export const ThreeDTrafficAnalysis: React.FC = () => {
  const [activeCam, setActiveCam] = useState<string>('orbit');
  const [configuredSelections, setConfiguredSelections] = useState<{
    [key: string]: { count: number; dest: string };
  }>({
    N: { count: 10, dest: 'EAST' },
    S: { count: 5, dest: 'NORTH' },
    E: { count: 2, dest: 'WEST' },
    W: { count: 1, dest: 'EAST' },
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5500);
  };

  const handleSetNumber = (road: 'N' | 'S' | 'E' | 'W', count: number) => {
    setConfiguredSelections((prev) => ({
      ...prev,
      [road]: { ...prev[road], count },
    }));
    if (iframeRef.current && (iframeRef.current as any).contentWindow?.setRoadNumber) {
      try {
        (iframeRef.current as any).contentWindow.setRoadNumber(road, count, {
          parentElement: { querySelectorAll: () => [] },
          classList: { add: () => {} },
        });
      } catch {}
    }
  };

  const handleSetDest = (road: 'N' | 'S' | 'E' | 'W', dest: string) => {
    setConfiguredSelections((prev) => ({
      ...prev,
      [road]: { ...prev[road], dest },
    }));
    if (iframeRef.current && (iframeRef.current as any).contentWindow?.setRoadDest) {
      try {
        (iframeRef.current as any).contentWindow.setRoadDest(road, dest);
      } catch {}
    }
  };

  const handleSpawnIndividual = (road: 'N' | 'S' | 'E' | 'W', type: 'CAR' | 'EMERGENCY') => {
    const roadNames = { N: 'North', S: 'South', E: 'East', W: 'West' };
    const count = configuredSelections[road].count;
    const dest = configuredSelections[road].dest;

    if (type === 'EMERGENCY') {
      showNotification(`🚨 Ambulance Dispatched from ${roadNames[road]} Road (heading ${dest})!`);
    } else {
      showNotification(`🚗 Dispatched ${count} Car(s) from ${roadNames[road]} Road (heading ${dest}).`);
    }

    if (iframeRef.current && (iframeRef.current as any).contentWindow?.spawnVehicles) {
      try {
        (iframeRef.current as any).contentWindow.spawnVehicles(road, type);
      } catch {}
    }
  };

  const handleRunJuryScenario = () => {
    showNotification(
      '🇮🇳 JURY SCENARIO ACTIVATED: North (10 cars + 1 ambulance ➔ East) vs South (5 cars + 1 ambulance ➔ North). System evaluates tie-breakers: SOUTH WINS (clears in ~11s)! North waits safely.'
    );
    if (iframeRef.current && (iframeRef.current as any).contentWindow?.runJuryConflictScenario) {
      try {
        (iframeRef.current as any).contentWindow.runJuryConflictScenario();
      } catch {}
    }
  };

  const handleDispatchAll = () => {
    showNotification(`🚀 STARTING SIMULATION: Dispatching traffic from all 4 roads on Indian Left-Hand Lanes!`);
    if (iframeRef.current && (iframeRef.current as any).contentWindow?.dispatchAllConfigured) {
      try {
        (iframeRef.current as any).contentWindow.dispatchAllConfigured();
      } catch {}
    }
  };

  const handleClearAll = () => {
    showNotification(`🧹 Cleared all vehicles from the 3D crossroads.`);
    if (iframeRef.current && (iframeRef.current as any).contentWindow?.clearAllVehicles) {
      try {
        (iframeRef.current as any).contentWindow.clearAllVehicles();
      } catch {}
    }
  };

  const handleCameraChange = (cam: string) => {
    setActiveCam(cam);
    if (iframeRef.current && (iframeRef.current as any).contentWindow?.setCameraView) {
      try {
        (iframeRef.current as any).contentWindow.setCameraView(cam);
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 text-[11px] font-black rounded-full flex items-center gap-1.5 uppercase shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                Jury Presentation: Dual Ambulance Tie-Breaker
              </span>
              <span className="px-2.5 py-0.5 bg-white/10 text-emerald-200 border border-white/20 text-[10px] font-bold rounded-lg uppercase">
                Indian 2-Way Roads (Left-Hand Drive)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>🌐</span> 3D Indian Crossroads & Dual-Ambulance Tie-Breaker Engine
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl font-normal">
              Two ambulances arriving from conflicting sides never get simultaneous green lights! The AI tie-breaker evaluates: Priority Class ➔ AI Plate Confirmation ➔ Already-Green Phase ➔ <strong>Shorter Queue Density (Winner!)</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={handleRunJuryScenario}
              className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 transition-all shadow-xl shadow-amber-500/30 flex items-center gap-2 active:scale-95 animate-pulse"
            >
              <span>🇮🇳</span>
              <span>RUN JURY SCENARIO (North vs South)</span>
            </button>
            <button
              onClick={handleDispatchAll}
              className="px-4 py-3 rounded-2xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg flex items-center gap-1.5 active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Custom</span>
            </button>
            <button
              onClick={handleClearAll}
              className="p-3 rounded-2xl text-xs font-bold bg-white/10 hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-white/20 transition-all"
              title="Clear all vehicles"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-black rounded-2xl shadow-xl border border-amber-300 flex items-center gap-2 animate-bounce">
          <span>⚡</span> {toastMessage}
        </div>
      )}

      {/* Main 3D Canvas Box */}
      <div className="relative w-full aspect-[16/9] max-h-[640px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        <iframe
          ref={iframeRef}
          src="/3dmodel-standalone/index.html"
          title="3D Indian Crossroads Traffic Simulation"
          className="w-full h-full border-0"
        />

        {/* Floating Quick Camera Controls inside container */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/80 shadow-2xl">
          {[
            { id: 'orbit', label: '🎥 3D Orbit' },
            { id: 'top', label: '🛰️ Top-Down' },
            { id: 'north', label: '⬆️ North' },
            { id: 'south', label: '⬇️ South' },
            { id: 'center', label: '🚦 Central Pole' },
          ].map((cam) => (
            <button
              key={cam.id}
              onClick={() => handleCameraChange(cam.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCam === cam.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 ROAD CONTROLLERS (Indian Left-Hand Drive) */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-black text-[#166534] flex items-center gap-2">
              <span>🇮🇳</span> Indian Crossroads Multi-Approach Vehicle Setup (LHD)
            </h2>
            <p className="text-xs text-slate-500">
              Vehicles drive on the <strong>left side</strong> of the yellow divider line. Select vehicle count and ambulance turning destination:
            </p>
          </div>
          <button
            onClick={handleRunJuryScenario}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
          >
            <span>⚡ Test Dual Ambulance Tie-Breaker</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              key: 'N',
              name: 'NORTH ROAD',
              icon: '⬆️',
              destOptions: [
                { val: 'EAST', label: '➔ Turn East (Left Turn LHD)' },
                { val: 'SOUTH', label: '➔ Go Straight South' },
                { val: 'WEST', label: '➔ Turn West (Right Turn)' },
              ],
            },
            {
              key: 'S',
              name: 'SOUTH ROAD',
              icon: '⬇️',
              destOptions: [
                { val: 'NORTH', label: '➔ Go Straight North' },
                { val: 'WEST', label: '➔ Turn West (Left Turn LHD)' },
                { val: 'EAST', label: '➔ Turn East (Right Turn)' },
              ],
            },
            {
              key: 'E',
              name: 'EAST ROAD',
              icon: '➡️',
              destOptions: [
                { val: 'WEST', label: '➔ Go Straight West' },
                { val: 'SOUTH', label: '➔ Turn South' },
                { val: 'NORTH', label: '➔ Turn North' },
              ],
            },
            {
              key: 'W',
              name: 'WEST ROAD',
              icon: '⬅️',
              destOptions: [
                { val: 'EAST', label: '➔ Go Straight East' },
                { val: 'NORTH', label: '➔ Turn North' },
                { val: 'SOUTH', label: '➔ Turn South' },
              ],
            },
          ].map((road) => {
            const conf = configuredSelections[road.key];

            return (
              <div
                key={road.key}
                className="bg-white border border-[#BBF7D0] rounded-3xl p-5 shadow-sm space-y-4 hover:border-emerald-400 transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{road.icon}</span>
                    <h3 className="text-xs font-black text-slate-800">{road.name}</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Indian LHD Lane
                  </span>
                </div>

                {/* Number selector: 1, 3, 5, 10 */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                    Cars Count Ahead
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 3, 5, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleSetNumber(road.key as any, num)}
                        className={`py-1.5 text-xs font-black rounded-xl border transition-all ${
                          conf.count === num
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destination Dropdown */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                    Ambulance Target Direction
                  </label>
                  <select
                    value={conf.dest}
                    onChange={(e) => handleSetDest(road.key as any, e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {road.destOptions.map((opt) => (
                      <option key={opt.val} value={opt.val}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2 Buttons: Cars and Emergency Vehicle */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => handleSpawnIndividual(road.key as any, 'CAR')}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-98"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Send {conf.count} Car(s)</span>
                  </button>

                  <button
                    onClick={() => handleSpawnIndividual(road.key as any, 'EMERGENCY')}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-red-500/20 active:scale-98 animate-pulse"
                  >
                    <Siren className="w-3.5 h-3.5" />
                    <span>Send Ambulance (➔ {conf.dest})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThreeDTrafficAnalysis;
