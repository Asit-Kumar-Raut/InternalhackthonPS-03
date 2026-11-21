import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const defaultAdminUser: User = {
  id: 1,
  email: 'admin@demo.com',
  role: 'ADMIN',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Direct access: Default to Admin user automatically without requiring login
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : defaultAdminUser;
    } catch {
      return defaultAdminUser;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || 'direct_admin_token';
  });

  const login = useCallback(async (email: string, pwd: string) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
      });
      if (res.ok) {
        const data = await res.json();
        const accessToken = data.access_token;
        const userObj = data.user || defaultAdminUser;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userObj));
        setToken(accessToken);
        setUser(userObj);
      }
    } catch {
      // Fallback
    }
  }, []);

  const logout = useCallback(() => {
    // Keep admin session active for direct access
    setUser(defaultAdminUser);
    setToken('direct_admin_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user || defaultAdminUser,
        token: token || 'direct_admin_token',
        login,
        logout,
        isAuthenticated: true, // Always true for direct access
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
