import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverAuth } from '../hooks/useDriverAuth';
import { Siren, ShieldCheck, MapPin, History, AlertTriangle } from 'lucide-react';

export const Home: React.FC = () => {
  const { vehicle } = useDriverAuth();
  const navigate = useNavigate();

  const trustScore = vehicle?.trust_score ?? 85;
  const isAutoGranted = trustScore >= 50;

  return (
    <div className="min-h-screen bg-[#F0FDF4] pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-5">
        {/* Driver Card */}
        <div className="bg-white border border-[#BBF7D0] rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Verified Driver
            </span>
            <h1 className="text-lg font-black text-slate-800 mt-1">
              {vehicle?.driver_name || 'Rajesh Kumar'}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              {vehicle?.vehicle_number || 'OD02AB1234'} • {vehicle?.org_name || 'AIIMS Emergency Care'}
            </p>
          </div>

          {/* Trust Score Badge */}
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${
                trustScore >= 70
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                  : trustScore >= 50
                  ? 'bg-amber-50 text-amber-800 border-amber-400'
                  : 'bg-red-50 text-red-800 border-red-400'
              }`}
            >
              {trustScore}
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5">Trust Score</span>
          </div>
        </div>

        {/* Status Message */}
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
            isAutoGranted
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}
        >
          {isAutoGranted ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span>
            {isAutoGranted
              ? 'Green Corridor Priority: Instantly Auto-Activated on Dispatch.'
              : 'Trust score < 50: Priority runs require 30s controller confirmation.'}
          </span>
        </div>

        {/* Big Start Emergency Run Button */}
        <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-xl text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <Siren className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-black text-[#166534]">Request Green Corridor</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select origin and destination to initiate synchronized signal clearance across all junctions.
            </p>
          </div>

          <button
            onClick={() => navigate('/route')}
            className="w-full py-4 bg-[#16A34A] hover:bg-[#166534] active:scale-95 text-white text-base font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>START EMERGENCY RUN</span>
          </button>
        </div>

        {/* Quick Menu */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/route')}
            className="p-4 bg-white border border-[#BBF7D0] rounded-2xl text-left shadow-sm hover:bg-emerald-50 transition-colors"
          >
            <MapPin className="w-5 h-5 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-slate-800 block">Plan Route</span>
            <span className="text-[10px] text-slate-400">Junction path & ETAs</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            className="p-4 bg-white border border-[#BBF7D0] rounded-2xl text-left shadow-sm hover:bg-emerald-50 transition-colors"
          >
            <History className="w-5 h-5 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-slate-800 block">Past Runs</span>
            <span className="text-[10px] text-slate-400">Trip confirmations</span>
          </button>
        </div>
      </div>
    </div>
  );
};
