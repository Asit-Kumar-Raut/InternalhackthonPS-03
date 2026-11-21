import React, { type ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: any;
  trend?: { value: number; label: string };
  highlight?: 'danger' | 'warning' | 'normal';
  accent?: 'danger' | 'warning' | 'info' | 'purple' | 'default';
  subtext?: string;
}

export function StatCard({ label, value, icon: Icon, trend, highlight = 'normal', accent, subtext }: StatCardProps) {
  const effectiveAccent = accent || (highlight === 'danger' ? 'danger' : highlight === 'warning' ? 'warning' : 'default');

  const themeStyles = {
    danger: {
      card: 'bg-gradient-to-br from-white via-rose-50/40 to-red-50/70 border-rose-200 shadow-rose-500/10 hover:border-rose-400',
      iconBg: 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30',
      valColor: 'text-rose-600',
      bar: 'bg-rose-500',
    },
    warning: {
      card: 'bg-gradient-to-br from-white via-amber-50/40 to-yellow-50/70 border-amber-200 shadow-amber-500/10 hover:border-amber-400',
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30',
      valColor: 'text-amber-700',
      bar: 'bg-amber-500',
    },
    info: {
      card: 'bg-gradient-to-br from-white via-cyan-50/40 to-blue-50/70 border-cyan-200 shadow-cyan-500/10 hover:border-cyan-400',
      iconBg: 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30',
      valColor: 'text-cyan-700',
      bar: 'bg-cyan-500',
    },
    purple: {
      card: 'bg-gradient-to-br from-white via-purple-50/40 to-indigo-50/70 border-purple-200 shadow-purple-500/10 hover:border-purple-400',
      iconBg: 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/30',
      valColor: 'text-purple-700',
      bar: 'bg-purple-500',
    },
    default: {
      card: 'bg-gradient-to-br from-white via-emerald-50/40 to-green-50/60 border-emerald-200 shadow-emerald-500/10 hover:border-emerald-400',
      iconBg: 'bg-gradient-to-tr from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30',
      valColor: 'text-emerald-800',
      bar: 'bg-emerald-500',
    },
  }[effectiveAccent] || {
    card: 'bg-white border-slate-200',
    iconBg: 'bg-emerald-600 text-white',
    valColor: 'text-slate-800',
    bar: 'bg-emerald-500',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm flex items-start gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${themeStyles.card}`}>
      <div className={`flex-shrink-0 p-3 rounded-xl flex items-center justify-center ${themeStyles.iconBg}`}>
        {React.isValidElement(Icon) ? Icon : Icon ? <Icon className="w-5 h-5" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-500 truncate tracking-wide">{label}</p>
        <p className={`text-2xl font-black mt-0.5 tracking-tight ${themeStyles.valColor}`}>{value}</p>
        {subtext && <p className="text-[10px] text-slate-500 mt-1 truncate font-medium">{subtext}</p>}
        {trend && (
          <p className={`text-[10px] mt-1 font-bold ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
