// lib/auth-context.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'stylist' | 'client';
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'bellissimo_tokens';

// Module-level vars so getAuthHeaders always has current token
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const decodeToken = (token: string): User | null => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return { id: decoded.sub, email: decoded.email, role: decoded.role };
    } catch { return null; }
  };

  const getTokenExpiry = (token: string): number => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp * 1000;
    } catch { return 0; }
  };

  const scheduleRefresh = (token: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const expiry = getTokenExpiry(token);
    const refreshIn = expiry - Date.now() - 2 * 60 * 1000; // 2 mins before expiry
    if (refreshIn > 0) {
      refreshTimerRef.current = setTimeout(() => silentRefresh(), refreshIn);
    } else {
      // Token expires very soon — refresh in 30 seconds
      refreshTimerRef.current = setTimeout(() => silentRefresh(), 30000);
    }
  };

  const applyTokens = async (tokens: AuthTokens, persist = true) => {
    _accessToken = tokens.accessToken;
    _refreshToken = tokens.refreshToken;
    setAccessToken(tokens.accessToken);
    setUser(decodeToken(tokens.accessToken));
    if (persist) {
      try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens)); } catch {}
    }
    scheduleRefresh(tokens.accessToken);
  };

  const clearSession = async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    _accessToken = null;
    _refreshToken = null;
    setAccessToken(null);
    setUser(null);
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const silentRefresh = async () => {
    if (!_refreshToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${_refreshToken}`,
        },
        body: JSON.stringify({ refreshToken: _refreshToken }),
      });
      if (res.ok) {
        const tokens: AuthTokens = await res.json();
        if (tokens?.accessToken) {
          await applyTokens(tokens);
        }
      }
    } catch {
      refreshTimerRef.current = setTimeout(() => silentRefresh(), 60000);
    }
  };

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const tokens: AuthTokens = JSON.parse(stored);
          if (tokens?.accessToken && tokens?.refreshToken) {
            // Always restore the session from storage
            // The token may be expired but we restore anyway and let silentRefresh fix it
            await applyTokens(tokens, false);
            // If access token is expired, immediately try to refresh
            const expiry = getTokenExpiry(tokens.accessToken);
            if (expiry < Date.now()) {
              await silentRefresh();
            }
          }
        }
      } catch {
        // Storage error — start fresh but don't crash
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let msg = 'Invalid credentials';
        try {
          const err = await res.json();
          msg = err.message || err.error || msg;
        } catch {
          if (res.status === 401) msg = 'Invalid email or password';
          else if (res.status === 403) msg = 'Access denied';
          else msg = `Login failed (${res.status})`;
        }
        throw new Error(msg);
      }
      const tokens: AuthTokens = await res.json();
      if (!tokens?.accessToken) throw new Error('Login failed — no token received.');
      await applyTokens(tokens);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let msg = 'Registration failed';
        try {
          const err = await res.json();
          msg = err.message || err.error || msg;
        } catch {
          if (res.status === 403 || res.status === 409) msg = 'Email already exists';
          else msg = `Registration failed (${res.status})`;
        }
        throw new Error(msg);
      }
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (_accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${_accessToken}` },
        });
      }
    } catch {}
    await clearSession();
  };

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!_accessToken) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${_accessToken}`,
    };
  }, [accessToken]);

  // Don't return null — always render children
  // isLoading is just for showing spinners in individual screens
  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!accessToken,
      login,
      register,
      logout,
      getAuthHeaders,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}