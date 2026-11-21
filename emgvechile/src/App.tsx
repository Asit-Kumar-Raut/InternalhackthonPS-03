import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { DriverAuthProvider, useDriverAuth } from './hooks/useDriverAuth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Status } from './pages/Status';
import { Home } from './pages/Home';
import { RoutePlanner } from './pages/RoutePlanner';
import { ActiveRun } from './pages/ActiveRun';
import { History } from './pages/History';
import { Profile } from './pages/Profile';

import { Home as HomeIcon, MapPin, History as HistoryIcon, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();

  // Hide bottom nav on ActiveRun and Auth screens
  if (['/login', '/register', '/status', '/run'].includes(location.pathname)) {
    return null;
  }

  const tabs = [
    { label: 'Home', path: '/home', icon: HomeIcon },
    { label: 'Route', path: '/route', icon: MapPin },
    { label: 'History', path: '/history', icon: HistoryIcon },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#BBF7D0] flex items-center justify-around h-16 z-40 px-2 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive ? 'text-[#16A34A] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, vehicle } = useDriverAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (vehicle && vehicle.status !== 'APPROVED') {
    return <Navigate to="/status" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <DriverAuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F0FDF4] max-w-md mx-auto shadow-2xl relative flex flex-col font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/status" element={<Status />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/route"
              element={
                <ProtectedRoute>
                  <RoutePlanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/run"
              element={
                <ProtectedRoute>
                  <ActiveRun />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </DriverAuthProvider>
  );
}

export default App;
