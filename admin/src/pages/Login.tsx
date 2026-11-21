import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { AuthResponse } from '../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#BBF7D0] rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner text-2xl">
            🚦
          </div>
          <h1 className="text-2xl font-black text-[#166534]">SmartSignal AI</h1>
          <p className="text-sm text-slate-500 mt-1">Controller Dashboard & Operations</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent"
              placeholder="admin@demo.com"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#16A34A] hover:bg-[#166534] text-white font-bold rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">Demo Accounts:</p>
          <div className="flex flex-col gap-1 text-[11px]">
            <span>Admin: <code className="text-emerald-700">admin@demo.com / Admin@123</code></span>
            <span>Operator: <code className="text-emerald-700">operator@demo.com / Operator@123</code></span>
            <span>Viewer: <code className="text-emerald-700">viewer@demo.com / Viewer@123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
