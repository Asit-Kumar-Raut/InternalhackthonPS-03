import React from 'react';
import { useDriverAuth } from '../hooks/useDriverAuth';
import { LogOut } from 'lucide-react';

export const Profile: React.FC = () => {
  const { vehicle, logout } = useDriverAuth();

  return (
    <div className="min-h-screen bg-[#F0FDF4] pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white border border-[#BBF7D0] rounded-3xl p-5 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-3 text-emerald-700 font-black text-2xl shadow-inner">
            👤
          </div>
          <h1 className="text-lg font-black text-slate-800">
            {vehicle?.driver_name || 'Rajesh Kumar'}
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {vehicle?.vehicle_number || 'OD02AB1234'} • {vehicle?.org_name || 'AIIMS Emergency Care'}
          </p>

          <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-around">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Trust Score</span>
              <span className="text-lg font-black text-emerald-800">{vehicle?.trust_score ?? 85}</span>
            </div>
            <div className="h-8 w-px bg-emerald-200" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
              <span className="text-xs font-bold text-emerald-700">{vehicle?.status || 'APPROVED'}</span>
            </div>
            <div className="h-8 w-px bg-emerald-200" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Strikes</span>
              <span className="text-lg font-black text-slate-800">{vehicle?.strikes ?? 0} / 3</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-2xl border border-red-200 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" /> Sign Out Driver Account
        </button>
      </div>
    </div>
  );
};
