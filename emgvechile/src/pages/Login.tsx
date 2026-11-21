import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDriverAuth } from '../hooks/useDriverAuth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('ambulance@demo.com');
  const [password, setPassword] = useState('Driver@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useDriverAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col justify-center px-6 py-12">
      <div className="w-full max-w-sm mx-auto bg-white border border-[#BBF7D0] rounded-3xl p-7 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner text-3xl">
            🚑
          </div>
          <h1 className="text-2xl font-black text-[#166534]">Driver Portal</h1>
          <p className="text-xs text-slate-500 mt-1">SmartSignal AI Emergency Green Corridor</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Registered Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
              placeholder="driver@hospital.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#16A34A] hover:bg-[#166534] text-white font-bold rounded-xl transition-colors shadow text-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In as Driver'}
          </button>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try {
                await login('ambulance@demo.com', 'Driver@123');
                navigate('/home');
              } catch (err: any) {
                setError(err.message || 'Login failed');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-300 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>⚡ Instant Demo Driver Login (Direct Access)</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600 mb-2">Need to register an emergency vehicle?</p>
          <Link
            to="/register"
            className="inline-block w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-300 text-xs transition-colors"
          >
            New Emergency Vehicle Registration
          </Link>
        </div>
      </div>
    </div>
  );
};
