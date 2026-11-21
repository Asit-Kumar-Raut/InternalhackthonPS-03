import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDriverAuth } from '../hooks/useDriverAuth';
import { Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const Status: React.FC = () => {
  const { vehicle, refreshVehicle } = useDriverAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setLoading(true);
    await refreshVehicle();
    setLoading(false);
  };

  const status = vehicle?.status || 'PENDING';

  useEffect(() => {
    if (status === 'APPROVED') {
      navigate('/home');
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-sm mx-auto bg-white border border-[#BBF7D0] rounded-3xl p-6 shadow-md text-center">
        {status === 'PENDING' && (
          <div>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-800">Application Under Review</h1>
            <p className="text-xs text-slate-500 mt-2">
              Vehicle <strong className="text-emerald-700">{vehicle?.vehicle_number || 'OD02CD5678'}</strong> is currently pending controller approval.
            </p>
            <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Application Submitted
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. AI Plate OCR & Class Check Complete
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" /> 3. Traffic Controller Verification Pending
              </div>
            </div>
          </div>
        )}

        {status === 'REJECTED' && (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <XCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-red-700">Registration Rejected</h1>
            <p className="text-xs text-slate-500 mt-2">
              Reason: {vehicle?.reject_reason || 'Photo mismatch or unreadable registration proof'}
            </p>
          </div>
        )}

        {status === 'SUSPENDED' && (
          <div>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-700">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-gray-800">Account Suspended</h1>
            <p className="text-xs text-slate-500 mt-2">
              This vehicle has accumulated 3 strikes for false alarms or aborted runs. Please contact the city traffic controller.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-full py-3 bg-[#16A34A] hover:bg-[#166534] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Check Approval Status
          </button>
          <Link to="/login" className="text-xs font-bold text-slate-500 mt-2">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
