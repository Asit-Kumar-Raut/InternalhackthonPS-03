import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { History as HistoryIcon, CheckCircle2 } from 'lucide-react';

export const History: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/emergency/requests').then(setRuns).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F0FDF4] pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white border border-[#BBF7D0] rounded-3xl p-5 shadow-sm">
          <h1 className="text-lg font-black text-[#166534] flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-emerald-600" /> Emergency Run Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Past green corridor dispatch history and junction confirmations
          </p>
        </div>

        <div className="space-y-3">
          {runs.length === 0 ? (
            <div className="bg-white border border-[#BBF7D0] rounded-2xl p-8 text-center text-xs text-slate-400">
              No emergency runs recorded yet
            </div>
          ) : (
            runs.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-[#BBF7D0] rounded-2xl p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">Run #{r.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {r.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-emerald-700 font-semibold mt-1">
                    Route: J1 → J2 → J4
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
