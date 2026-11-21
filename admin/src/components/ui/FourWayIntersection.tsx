import React from 'react';
import { SignalLight } from './SignalLight';
import { AlertTriangle, CheckCircle2, Siren } from 'lucide-react';

interface ApproachData {
  count: number;
  speed: number;
  percentage: number;
  signal: string;
  level: string;
}

interface FourWayData {
  approaches: {
    NORTH: ApproachData;
    SOUTH: ApproachData;
    EAST: ApproachData;
    WEST: ApproachData;
  };
  total_vehicles: number;
  ns_total: number;
  ew_total: number;
  ns_percentage: number;
  ew_percentage: number;
  more_traffic_side: string;
  active_green_side: string;
  fsm: {
    phase: string;
    state: string;
    timer_s: number;
  };
  webster_splits: {
    NS: number;
    EW: number;
    C: number;
  };
  skipped_phase?: string | null;
}

export const FourWayIntersection: React.FC<{
  data?: FourWayData;
  onSelectRoad?: (road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST') => void;
  selectedRoad?: string;
}> = ({ data, onSelectRoad, selectedRoad = 'NORTH' }) => {
  const approaches = data?.approaches || {
    NORTH: { count: 18, speed: 35, percentage: 36, signal: 'GREEN', level: 'MEDIUM' },
    SOUTH: { count: 14, speed: 32, percentage: 28, signal: 'GREEN', level: 'MEDIUM' },
    EAST: { count: 11, speed: 38, percentage: 22, signal: 'ALL_RED', level: 'LOW' },
    WEST: { count: 7, speed: 40, percentage: 14, signal: 'ALL_RED', level: 'LOW' },
  };

  const nsTotal = data?.ns_total ?? (approaches.NORTH.count + approaches.SOUTH.count);
  const ewTotal = data?.ew_total ?? (approaches.EAST.count + approaches.WEST.count);
  const total = data?.total_vehicles ?? (nsTotal + ewTotal);
  const nsPct = data?.ns_percentage ?? 64.0;
  const ewPct = data?.ew_percentage ?? 36.0;

  const fsmState = data?.fsm?.state || 'GREEN';
  const fsmPhase = data?.fsm?.phase || 'NS';
  const fsmTimer = data?.fsm?.timer_s || 12;
  const skippedPhase = data?.skipped_phase;

  // Render car dots on roads
  const renderCars = (count: number, direction: 'vertical' | 'horizontal', reverse = false) => {
    const dotsCount = Math.min(8, Math.max(0, Math.ceil(count / 3)));
    return (
      <div className={`flex ${direction === 'vertical' ? 'flex-col gap-1.5' : 'flex-row gap-1.5'} items-center justify-center`}>
        {Array.from({ length: dotsCount }).map((_, i) => (
          <div
            key={i}
            className="w-3.5 h-6 bg-slate-900 border border-emerald-400 rounded-sm shadow-sm flex items-center justify-center text-[8px] text-white font-bold select-none"
            style={{
              transform: direction === 'horizontal' ? 'rotate(90deg)' : undefined,
            }}
          >
            🚗
          </div>
        ))}
        {count === 0 && (
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            EMPTY (0)
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#BBF7D0] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#BBF7D0] pb-3">
        <div>
          <h2 className="text-base font-black text-[#166534] flex items-center gap-2">
            <span>🚦</span> 4-Way Junction Intersection (4 Roads Meet at Once)
          </h2>
          <p className="text-xs text-slate-500">
            Real-time multi-approach intersection with dynamic Webster green allocation & empty-road skip
          </p>
        </div>

        {skippedPhase && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Phase {skippedPhase} Skipped (0 Vehicles - No Green Wasted)
          </span>
        )}
      </div>

      {/* Crossroad Junction SVG + Interactive Canvas */}
      <div className="relative w-full aspect-square max-h-[500px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 flex items-center justify-center shadow-inner">
        {/* Asphalt Roads */}
        {/* Vertical Road (North - South) */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-44 bg-slate-800 border-x-4 border-slate-900 flex flex-col justify-between py-2">
          {/* North Road approach */}
          <div
            onClick={() => onSelectRoad?.('NORTH')}
            className={`cursor-pointer p-2 mx-1 rounded-xl transition-all ${
              selectedRoad === 'NORTH' ? 'ring-2 ring-emerald-400 bg-slate-700/60' : 'hover:bg-slate-700/40'
            }`}
          >
            <div className="text-center text-[10px] font-bold text-emerald-300 mb-1">
              ⬆ NORTH ROAD ({approaches.NORTH.count} veh • {approaches.NORTH.percentage}%)
            </div>
            {renderCars(approaches.NORTH.count, 'vertical')}
          </div>

          {/* South Road approach */}
          <div
            onClick={() => onSelectRoad?.('SOUTH')}
            className={`cursor-pointer p-2 mx-1 rounded-xl transition-all ${
              selectedRoad === 'SOUTH' ? 'ring-2 ring-emerald-400 bg-slate-700/60' : 'hover:bg-slate-700/40'
            }`}
          >
            {renderCars(approaches.SOUTH.count, 'vertical')}
            <div className="text-center text-[10px] font-bold text-emerald-300 mt-1">
              ⬇ SOUTH ROAD ({approaches.SOUTH.count} veh • {approaches.SOUTH.percentage}%)
            </div>
          </div>
        </div>

        {/* Horizontal Road (West - East) */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-44 bg-slate-800 border-y-4 border-slate-900 flex justify-between px-2 items-center">
          {/* West Road approach */}
          <div
            onClick={() => onSelectRoad?.('WEST')}
            className={`cursor-pointer p-2 my-1 rounded-xl transition-all ${
              selectedRoad === 'WEST' ? 'ring-2 ring-emerald-400 bg-slate-700/60' : 'hover:bg-slate-700/40'
            }`}
          >
            <div className="text-center text-[10px] font-bold text-emerald-300 mb-1">
              ⬅ WEST ({approaches.WEST.count} veh • {approaches.WEST.percentage}%)
            </div>
            {renderCars(approaches.WEST.count, 'horizontal')}
          </div>

          {/* East Road approach */}
          <div
            onClick={() => onSelectRoad?.('EAST')}
            className={`cursor-pointer p-2 my-1 rounded-xl transition-all ${
              selectedRoad === 'EAST' ? 'ring-2 ring-emerald-400 bg-slate-700/60' : 'hover:bg-slate-700/40'
            }`}
          >
            {renderCars(approaches.EAST.count, 'horizontal')}
            <div className="text-center text-[10px] font-bold text-emerald-300 mt-1">
              ➡ EAST ({approaches.EAST.count} veh • {approaches.EAST.percentage}%)
            </div>
          </div>
        </div>

        {/* Center Intersection Box */}
        <div className="absolute w-44 h-44 bg-slate-850 border-2 border-dashed border-yellow-400/80 flex flex-col items-center justify-center text-center p-2 z-10 shadow-lg">
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-300">
            Intersection Core
          </div>
          <div className="my-1 px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-slate-900 border border-slate-700">
            <span className={fsmState === 'GREEN' ? 'text-emerald-400' : fsmState === 'YELLOW' ? 'text-amber-400' : 'text-red-400'}>
              {fsmPhase} : {fsmState} ({fsmTimer}s)
            </span>
          </div>
          <span className="text-[9px] text-slate-400">
            {fsmState === 'GREEN' ? (
              <strong className="text-emerald-400">{fsmPhase === 'NS' ? 'North-South Green' : 'East-West Green'}</strong>
            ) : fsmState === 'YELLOW' ? (
              <strong className="text-amber-300">Clearance Transition (3s)</strong>
            ) : (
              <strong className="text-red-400">All-Red Conflict Clearance (2s)</strong>
            )}
          </span>
        </div>

        {/* 4 Traffic Light Signals Mounted at the 4 Approaches */}
        {/* North Signal */}
        <div className="absolute top-4 left-[calc(50%+65px)] z-20 scale-90">
          <SignalLight size="sm" state={approaches.NORTH.signal} label="North Sig" />
        </div>

        {/* South Signal */}
        <div className="absolute bottom-4 left-[calc(50%-90px)] z-20 scale-90">
          <SignalLight size="sm" state={approaches.SOUTH.signal} label="South Sig" />
        </div>

        {/* West Signal */}
        <div className="absolute top-[calc(50%-90px)] left-4 z-20 scale-90">
          <SignalLight size="sm" state={approaches.WEST.signal} label="West Sig" />
        </div>

        {/* East Signal */}
        <div className="absolute bottom-[calc(50%-90px)] right-4 z-20 scale-90">
          <SignalLight size="sm" state={approaches.EAST.signal} label="East Sig" />
        </div>
      </div>

      {/* Traffic Comparison Summary Cards */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className={`p-3.5 rounded-xl border ${
          fsmPhase === 'NS' && fsmState === 'GREEN'
            ? 'bg-emerald-50 border-emerald-400 shadow-sm'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-800">North-South (NS) Roads</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              approaches.NORTH.signal === 'GREEN' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-red-100 text-red-700'
            }`}>
              {approaches.NORTH.signal}
            </span>
          </div>
          <div className="text-base font-black text-slate-900">{nsTotal} Vehicles ({nsPct}%)</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Webster Green Time: <strong className="text-emerald-700">{data?.webster_splits?.NS || 18}s</strong>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          fsmPhase === 'EW' && fsmState === 'GREEN'
            ? 'bg-emerald-50 border-emerald-400 shadow-sm'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-800">East-West (EW) Roads</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              approaches.EAST.signal === 'GREEN' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-red-100 text-red-700'
            }`}>
              {approaches.EAST.signal}
            </span>
          </div>
          <div className="text-base font-black text-slate-900">{ewTotal} Vehicles ({ewPct}%)</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Webster Green Time: <strong className="text-emerald-700">{data?.webster_splits?.EW || 12}s</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
