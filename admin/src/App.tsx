import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Vehicles } from './pages/Vehicles';
import { Emergency } from './pages/Emergency';
import { JunctionDetail } from './pages/JunctionDetail';
import { Traffic } from './pages/Traffic';
import { ThreeDTrafficAnalysis } from './pages/ThreeDTrafficAnalysis';

import {
  LayoutDashboard,
  Box,
  ShieldCheck,
  Siren,
  MapPin,
  LineChart,
  LogOut,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Live Overview', path: '/', icon: LayoutDashboard },
    { label: '3D Traffic Analysis', path: '/3d-analysis', icon: Box },
    { label: 'Vehicle Approvals', path: '/vehicles', icon: ShieldCheck },
    { label: 'Emergency Corridor', path: '/emergency', icon: Siren },
    { label: 'Junction Details (Odisha Map)', path: '/junctions', icon: MapPin },
    { label: 'Traffic Density & Congestion', path: '/traffic', icon: LineChart },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#BBF7D0] flex flex-col shrink-0 h-screen sticky top-0 shadow-sm">
      <div className="p-5 border-b border-[#BBF7D0]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center justify-center text-xl shadow-inner">
            🚦
          </div>
          <div>
            <h1 className="text-base font-black text-[#166534] leading-tight">SmartSignal AI</h1>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Odisha Traffic Command</span>
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-500/20 translate-x-1'
                  : 'text-slate-600 hover:bg-[#F0FDF4] hover:text-[#166534]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-4 border-t border-[#BBF7D0] bg-[#F0FDF4]/60 flex items-center justify-between">
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-slate-800 truncate">
            {user?.email || 'admin@demo.com'}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-100 px-1.5 py-0.5 rounded">
            Role: {user?.role || 'ADMIN'}
          </span>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F0FDF4]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto">{children}</main>
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/3d-analysis"
              element={
                <ProtectedLayout>
                  <ThreeDTrafficAnalysis />
                </ProtectedLayout>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedLayout>
                  <Vehicles />
                </ProtectedLayout>
              }
            />
            <Route
              path="/emergency"
              element={
                <ProtectedLayout>
                  <Emergency />
                </ProtectedLayout>
              }
            />
            <Route
              path="/junctions"
              element={
                <ProtectedLayout>
                  <JunctionDetail />
                </ProtectedLayout>
              }
            />
            <Route
              path="/junctions/:id"
              element={
                <ProtectedLayout>
                  <JunctionDetail />
                </ProtectedLayout>
              }
            />
            <Route
              path="/traffic"
              element={
                <ProtectedLayout>
                  <Traffic />
                </ProtectedLayout>
              }
            />
            {/* Catch-all redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
