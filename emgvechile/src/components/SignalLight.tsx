import React from 'react';

export const SignalLight: React.FC<{ state: string }> = ({ state }) => {
  const normState = state?.toUpperCase() || 'GREEN';

  const isGreen = normState === 'GREEN' || normState === 'GREEN_READY';
  const isYellow = normState === 'YELLOW' || normState === 'CLEARING';
  const isRed = normState === 'ALL_RED' || normState === 'RED' || normState === 'WAITING';

  return (
    <div className="bg-slate-950 p-4 rounded-3xl border-2 border-slate-800 flex flex-col gap-3 shadow-2xl items-center">
      <div
        className={`w-14 h-14 rounded-full transition-all duration-300 ${
          isRed ? 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,1)]' : 'bg-red-950/40 opacity-30'
        }`}
      />
      <div
        className={`w-14 h-14 rounded-full transition-all duration-300 ${
          isYellow ? 'bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,1)] animate-pulse' : 'bg-amber-950/40 opacity-30'
        }`}
      />
      <div
        className={`w-14 h-14 rounded-full transition-all duration-300 ${
          isGreen ? 'bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,1)] animate-pulse' : 'bg-emerald-950/40 opacity-30'
        }`}
      />
    </div>
  );
};
