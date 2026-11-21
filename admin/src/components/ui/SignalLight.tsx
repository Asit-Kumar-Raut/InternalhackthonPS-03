import React from 'react';

interface SignalLightProps {
  state: 'GREEN' | 'YELLOW' | 'ALL_RED' | string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const SignalLight: React.FC<SignalLightProps> = ({ state, size = 'md', label }) => {
  const normState = state?.toUpperCase() || 'ALL_RED';

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
  };

  const isRed = normState === 'ALL_RED' || normState === 'RED';
  const isYellow = normState === 'YELLOW';
  const isGreen = normState === 'GREEN';

  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-xs font-semibold text-slate-600 mb-1">{label}</span>}
      <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-700 flex flex-col gap-1.5 shadow-md">
        {/* Red */}
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ${
            isRed ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse' : 'bg-red-950/60 opacity-40'
          }`}
        />
        {/* Yellow */}
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ${
            isYellow ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse' : 'bg-amber-950/60 opacity-40'
          }`}
        />
        {/* Green */}
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ${
            isGreen ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse' : 'bg-emerald-950/60 opacity-40'
          }`}
        />
      </div>
    </div>
  );
};
