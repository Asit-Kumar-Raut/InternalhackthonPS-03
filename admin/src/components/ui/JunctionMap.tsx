import React from 'react';
import { SignalLight } from './SignalLight';

interface JunctionLive {
  id: number;
  name: string;
  current_phase: string;
  state: string;
  signals: {
    NS: string;
    EW: string;
  };
  phases: {
    NS?: { count: number; speed: number; level: string };
    EW?: { count: number; speed: number; level: string };
  };
}

interface EmergencyRunLive {
  request_id: number;
  vehicle_id: number;
  route_junctions: number[];
  status: string;
}

interface JunctionMapProps {
  junctions: JunctionLive[];
  emergencyRuns?: EmergencyRunLive[];
  onSelectJunction?: (id: number) => void;
  selectedJunctionId?: number;
}

export const JunctionMap: React.FC<JunctionMapProps> = ({
  junctions,
  emergencyRuns = [],
  onSelectJunction,
  selectedJunctionId,
}) => {
  const jMap = new Map(junctions.map((j) => [j.id, j]));

  const activeRuns = emergencyRuns.filter((r) => r.status === 'ACTIVE');
  const activeRouteJunctions = new Set(
    activeRuns.flatMap((r) => r.route_junctions)
  );

  const getRoadColor = (j1: number, j2: number) => {
    // Check if this road segment is part of active emergency corridor
    const inCorridor = activeRuns.some((r) => {
      const idx1 = r.route_junctions.indexOf(j1);
      const idx2 = r.route_junctions.indexOf(j2);
      return idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1;
    });

    if (inCorridor) return '#16A34A'; // Bright green priority corridor

    return '#94A3B8'; // Normal road
  };

  const coords: Record<number, { x: number; y: number; label: string }> = {
    1: { x: 120, y: 110, label: 'J1 (NW)' },
    2: { x: 380, y: 110, label: 'J2 (NE)' },
    3: { x: 120, y: 350, label: 'J3 (SW)' },
    4: { x: 380, y: 350, label: 'J4 (SE)' },
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-white border border-[#BBF7D0] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-[#BBF7D0] pb-2">
        <h3 className="text-base font-bold text-[#166534] flex items-center gap-2">
          <span>🚦</span> 2×2 Grid Traffic Simulation Map
        </h3>
        {activeRuns.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            🚑 Green Corridor Active (Run #{activeRuns[0].request_id})
          </span>
        )}
      </div>

      <div className="relative w-full aspect-square max-h-[480px]">
        <svg viewBox="0 0 500 480" className="w-full h-full">
          {/* Roads */}
          {/* J1 - J2 (Horizontal Top) */}
          <line
            x1={coords[1].x}
            y1={coords[1].y}
            x2={coords[2].x}
            y2={coords[2].y}
            stroke={getRoadColor(1, 2)}
            strokeWidth={getRoadColor(1, 2) === '#16A34A' ? 10 : 6}
            strokeDasharray={getRoadColor(1, 2) === '#16A34A' ? '6,4' : undefined}
          />
          {/* J1 - J3 (Vertical Left) */}
          <line
            x1={coords[1].x}
            y1={coords[1].y}
            x2={coords[3].x}
            y2={coords[3].y}
            stroke={getRoadColor(1, 3)}
            strokeWidth={getRoadColor(1, 3) === '#16A34A' ? 10 : 6}
            strokeDasharray={getRoadColor(1, 3) === '#16A34A' ? '6,4' : undefined}
          />
          {/* J2 - J4 (Vertical Right) */}
          <line
            x1={coords[2].x}
            y1={coords[2].y}
            x2={coords[4].x}
            y2={coords[4].y}
            stroke={getRoadColor(2, 4)}
            strokeWidth={getRoadColor(2, 4) === '#16A34A' ? 10 : 6}
            strokeDasharray={getRoadColor(2, 4) === '#16A34A' ? '6,4' : undefined}
          />
          {/* J3 - J4 (Horizontal Bottom) */}
          <line
            x1={coords[3].x}
            y1={coords[3].y}
            x2={coords[4].x}
            y2={coords[4].y}
            stroke={getRoadColor(3, 4)}
            strokeWidth={getRoadColor(3, 4) === '#16A34A' ? 10 : 6}
            strokeDasharray={getRoadColor(3, 4) === '#16A34A' ? '6,4' : undefined}
          />

          {/* Road Length Labels */}
          <text x="250" y="95" textAnchor="middle" className="text-[11px] fill-slate-500 font-medium">300m</text>
          <text x="95" y="235" textAnchor="middle" className="text-[11px] fill-slate-500 font-medium">250m</text>
          <text x="405" y="235" textAnchor="middle" className="text-[11px] fill-slate-500 font-medium">400m</text>
          <text x="250" y="375" textAnchor="middle" className="text-[11px] fill-slate-500 font-medium">200m</text>
        </svg>

        {/* Junction Nodes (Interactive Overlays) */}
        {[1, 2, 3, 4].map((jId) => {
          const pos = coords[jId];
          const jData = jMap.get(jId);
          const isSelected = selectedJunctionId === jId;
          const isCorridor = activeRouteJunctions.has(jId);

          return (
            <div
              key={jId}
              onClick={() => onSelectJunction && onSelectJunction(jId)}
              style={{
                left: `${(pos.x / 500) * 100}%`,
                top: `${(pos.y / 480) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute cursor-pointer flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                isSelected
                  ? 'ring-4 ring-emerald-500 bg-emerald-50/90 shadow-lg scale-105'
                  : 'bg-white/95 hover:bg-emerald-50/80 shadow border border-[#BBF7D0]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs font-bold text-slate-800">{pos.label}</span>
                {isCorridor && <span className="text-xs">🚑</span>}
              </div>

              {/* Traffic Signals for NS and EW */}
              <div className="flex gap-2">
                <SignalLight
                  size="sm"
                  state={jData?.signals?.NS || 'GREEN'}
                  label="NS"
                />
                <SignalLight
                  size="sm"
                  state={jData?.signals?.EW || 'ALL_RED'}
                  label="EW"
                />
              </div>

              {/* Current state badge */}
              <div className="mt-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {jData?.current_phase || 'NS'} : {jData?.state || 'GREEN'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
