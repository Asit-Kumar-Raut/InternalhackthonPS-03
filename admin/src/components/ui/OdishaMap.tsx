import React, { useState } from 'react';
import { MapPin, Navigation, Compass, ShieldCheck, Activity } from 'lucide-react';

export interface OdishaJunction {
  id: number;
  name: string;
  city: string;
  x: number; // percentage in svg canvas
  y: number;
  status: string;
  current_phase?: string;
  signals?: { NS: string; EW: string };
  traffic_density?: number;
}

const defaultOdishaJunctions: OdishaJunction[] = [
  { id: 1, name: 'Rasulgarh Square', city: 'Bhubaneswar', x: 62, y: 54, status: 'ACTIVE', current_phase: 'NS', signals: { NS: 'GREEN', EW: 'ALL_RED' }, traffic_density: 76 },
  { id: 2, name: 'Vani Vihar Square', city: 'Bhubaneswar', x: 58, y: 50, status: 'ACTIVE', current_phase: 'EW', signals: { NS: 'ALL_RED', EW: 'GREEN' }, traffic_density: 64 },
  { id: 3, name: 'Master Canteen Square', city: 'Bhubaneswar', x: 55, y: 57, status: 'ACTIVE', current_phase: 'NS', signals: { NS: 'GREEN', EW: 'ALL_RED' }, traffic_density: 82 },
  { id: 4, name: 'Khandagiri Square', city: 'Bhubaneswar', x: 48, y: 58, status: 'ACTIVE', current_phase: 'EW', signals: { NS: 'ALL_RED', EW: 'GREEN' }, traffic_density: 55 },
  { id: 5, name: 'Badambadi Junction', city: 'Cuttack', x: 64, y: 44, status: 'ACTIVE', current_phase: 'NS', signals: { NS: 'GREEN', EW: 'ALL_RED' }, traffic_density: 88 },
  { id: 6, name: 'AIIMS Healthcare Hub', city: 'Bhubaneswar', x: 45, y: 64, status: 'ACTIVE', current_phase: 'NS', signals: { NS: 'GREEN', EW: 'ALL_RED' }, traffic_density: 42 },
];

export const OdishaMap: React.FC<{
  junctions?: OdishaJunction[];
  selectedJunctionId?: number;
  onSelectJunction?: (junction: OdishaJunction) => void;
  activeCorridorJunctions?: number[];
}> = ({
  junctions = defaultOdishaJunctions,
  selectedJunctionId = 1,
  onSelectJunction,
  activeCorridorJunctions = [4, 3, 2, 1],
}) => {
  const [hoveredJunction, setHoveredJunction] = useState<OdishaJunction | null>(null);

  const selected = junctions.find((j) => j.id === selectedJunctionId) || junctions[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-black text-emerald-400 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            Odisha State Highway & Smart Junction Corridor Map
          </h2>
          <p className="text-xs text-slate-400">
            Interactive geographic GIS map of Odisha highlighting SmartSignal AI managed intersections along NH-16
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            NH-16 Corridor Monitored
          </span>
        </div>
      </div>

      {/* Stylized SVG Map of Odisha with Coastal Bay of Bengal */}
      <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner flex items-center justify-center">
        <svg viewBox="0 0 800 500" className="w-full h-full">
          <defs>
            <linearGradient id="odishaLand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="bayOfBengal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Bay of Bengal Sea Zone (East/South-East Coast) */}
          <path
            d="M 520 500 Q 560 380 620 320 T 750 210 L 800 200 L 800 500 Z"
            fill="url(#bayOfBengal)"
            stroke="#0284C7"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="680" y="420" fill="#38BDF8" fontSize="13" fontStyle="italic" opacity="0.6" fontWeight="bold">
            Bay of Bengal
          </text>

          {/* Stylized Outline Polygon of Odisha State */}
          <path
            d="M 280 80 
               L 420 60 
               L 560 90 
               L 660 140 
               L 720 220 
               L 620 320 
               L 560 380 
               L 480 440 
               L 360 460 
               L 260 400 
               L 200 320 
               L 180 220 
               L 220 130 Z"
            fill="url(#odishaLand)"
            stroke="#334155"
            strokeWidth="2.5"
          />

          {/* Major Highway NH-16 Connecting Cuttack, Bhubaneswar, Khordha */}
          <path
            d="M 640 220 Q 550 280 450 320"
            fill="none"
            stroke="#10B981"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 640 220 Q 550 280 450 320"
            fill="none"
            stroke="#6EE7B7"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* Regional Highway Labels */}
          <text x="490" y="275" fill="#10B981" fontSize="11" fontWeight="bold" transform="rotate(-28 490 275)">
            NH-16 Green Corridor
          </text>
          <text x="320" y="160" fill="#64748B" fontSize="14" fontWeight="black" letterSpacing="4">
            ODISHA
          </text>
          <text x="250" y="240" fill="#475569" fontSize="10">Sambalpur Corridor</text>
          <text x="460" y="110" fill="#475569" fontSize="10">Rourkela Highway</text>
          <text x="380" y="420" fill="#475569" fontSize="10">Berhampur Link</text>
        </svg>

        {/* Junction Point Markers Plotted on the Odisha Map */}
        {junctions.map((j) => {
          const isSelected = j.id === selectedJunctionId;
          const isCorridor = activeCorridorJunctions.includes(j.id);

          return (
            <div
              key={j.id}
              onClick={() => onSelectJunction?.(j)}
              onMouseEnter={() => setHoveredJunction(j)}
              onMouseLeave={() => setHoveredJunction(null)}
              style={{
                left: `${j.x}%`,
                top: `${j.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute cursor-pointer flex flex-col items-center group transition-all duration-300 z-30 ${
                isSelected ? 'scale-125 z-40' : 'hover:scale-115'
              }`}
            >
              {/* Pulsing Signal Glow Pin */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                  isCorridor
                    ? 'bg-emerald-500 text-slate-950 border-2 border-white shadow-[0_0_20px_rgba(16,185,129,0.9)] animate-pulse'
                    : 'bg-slate-800 text-emerald-400 border border-slate-600 shadow-md'
                }`}
              >
                J{j.id}
              </div>

              {/* Pin Label */}
              <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-[10px] font-bold text-slate-200 shadow-md whitespace-nowrap pointer-events-none">
                {j.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Junction Details Box */}
      <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Selected Junction
            </span>
          </div>
          <h3 className="text-base font-black text-white mt-0.5">
            {selected.name} ({selected.city})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitored 4-way intersection connecting arterial capital traffic
          </p>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-bold uppercase">Signals State</span>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400 mt-1">
            <span>NS: {selected.signals?.NS || 'GREEN'}</span>
            <span>•</span>
            <span className="text-red-400">EW: {selected.signals?.EW || 'ALL_RED'}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-bold uppercase">Traffic Density</span>
          <div className="text-base font-black text-emerald-400 mt-0.5 font-mono">
            {selected.traffic_density || 72}% OCC
          </div>
        </div>
      </div>
    </div>
  );
};
