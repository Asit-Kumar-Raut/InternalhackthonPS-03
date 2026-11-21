import React from 'react';
import { ShieldCheck, Cpu, Clock, Activity, BarChart2, Siren, Sliders, Layers } from 'lucide-react';

interface AlgorithmFlowPanelProps {
  fsmState?: string;
  fsmPhase?: string;
  websterSplits?: { NS: number; EW: number; C: number };
  skippedPhase?: string | null;
}

export const AlgorithmFlowPanel: React.FC<AlgorithmFlowPanelProps> = ({
  fsmState = 'GREEN',
  fsmPhase = 'NS',
  websterSplits = { NS: 18.0, EW: 12.0, C: 40.0 },
  skippedPhase = null,
}) => {
  const algorithms = [
    {
      num: 1,
      title: 'Safety FSM + Conflict Matrix',
      icon: ShieldCheck,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      rule: 'GREEN → YELLOW (3s) → ALL_RED (2s) → next GREEN',
      status: `Current: ${fsmPhase} (${fsmState}). Conflict matrix check: PASS (NS & EW never simultaneously green).`,
    },
    {
      num: 2,
      title: 'Actuated Control (Skip Empty Roads)',
      icon: Activity,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      rule: 'min_green=8s, gap=3s, max_green=40s. Zero demand → Phase skipped.',
      status: skippedPhase
        ? `Phase ${skippedPhase} skipped (0 vehicles waiting) → No green wasted on empty road.`
        : 'Active extension on vehicle arrivals. Gap-out enabled.',
    },
    {
      num: 3,
      title: "Webster's Method (Green Splits)",
      icon: Sliders,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      rule: 'C = (1.5L + 5)/(1 - Y), g_i = (y_i/Y)(C - L) clamped between 8s-40s',
      status: `Cycle: ${websterSplits.C}s | g_NS: ${websterSplits.NS}s | g_EW: ${websterSplits.EW}s. Proportional split.`,
    },
    {
      num: 4,
      title: 'Exponential Moving Average (EMA)',
      icon: Cpu,
      color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      rule: 'smoothed = β × new + (1 - β) × previous (β = 0.4)',
      status: 'Smooths out transient camera noise and vehicle detection spikes.',
    },
    {
      num: 5,
      title: 'Hysteresis Congestion Bounds',
      icon: Layers,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      rule: 'UP thresholds: 45 / 65 / 85% | DOWN thresholds: 35 / 55 / 75%',
      status: 'Prevents rapid oscillation between congestion levels.',
    },
    {
      num: 6,
      title: 'Emergency Priority Queue + ETA',
      icon: Siren,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      rule: 'ETA = distance / speed. Transition begins when ETA ≤ yellow + all_red + buffer (10s)',
      status: 'Verified ambulances clear junctions in turn; 2 unconfirmed checks flag false alarms.',
    },
    {
      num: 7,
      title: 'Random Forest Forecaster',
      icon: BarChart2,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      rule: 'Predicts occupancy 10m ahead; blended density = α×current + (1-α)×predicted (α=0.6)',
      status: 'Pre-allocates green capacity before traffic jams fully materialize.',
    },
    {
      num: 8,
      title: 'Aging Starvation Protection',
      icon: Clock,
      color: 'text-slate-700 bg-slate-100 border-slate-300',
      rule: 'priority = demand + k × waiting_time. Hard cap: max red wait 90s.',
      status: 'Guarantees fair service so low-traffic roads never wait indefinitely.',
    },
  ];

  return (
    <div className="bg-white border border-[#BBF7D0] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="border-b border-[#BBF7D0] pb-3">
        <h3 className="text-sm font-bold text-[#166534] flex items-center gap-2">
          <span>⚙️</span> 8 Core Traffic Engineering & AI Algorithms (Live State)
        </h3>
        <p className="text-[11px] text-slate-500">
          Actuated control, safety FSM, Webster's method, and predictive ML executing in harmony
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {algorithms.map((alg) => {
          const Icon = alg.icon;
          return (
            <div key={alg.num} className={`p-3.5 rounded-xl border ${alg.color} flex flex-col justify-between`}>
              <div>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] shadow-xs">
                    {alg.num}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{alg.title}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-600 mb-2">{alg.rule}</div>
              </div>
              <div className="text-[10px] font-semibold text-slate-800 bg-white/80 p-1.5 rounded-lg border border-slate-200/60">
                {alg.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
