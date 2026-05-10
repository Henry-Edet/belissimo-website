// lib/auth-context.tsx
// Global auth state — wraps the whole app so every screen can access the token

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  email: string;
  role: 'admin' | 'stylist' | 'client';
  firstName?: string;
  lastName?: string;
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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Simple in-memory token store (no AsyncStorage needed for now) ────────────
// Tokens are lost on app restart — add AsyncStorage later for persistence

let _accessToken: string | null = null;
let _refreshToken: string | null = null;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // false since we use in-memory only

  // Decode JWT payload (no library needed — just base64 decode the middle part)
  const decodeToken = (token: string): User | null => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return { id: decoded.sub, email: decoded.email, role: decoded.role };
    } catch {
      return null;
    }
  };

  const setTokens = (tokens: AuthTokens) => {
    _accessToken = tokens.accessToken;
    _refreshToken = tokens.refreshToken;
    setAccessToken(tokens.accessToken);
    setUser(decodeToken(tokens.accessToken));
  };

  const clearTokens = () => {
    _accessToken = null;
    _refreshToken = null;
    setAccessToken(null);
    setUser(null);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Invalid credentials');
      }

      const tokens: AuthTokens = await res.json();
      setTokens(tokens);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }

      // Auto-login after register
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      if (_accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${_accessToken}` },
        });
      }
    } catch {
      // Ignore logout errors — always clear local state
    } finally {
      clearTokens();
    }
  };

  // ── Helper: get auth headers for any fetch call ────────────────────────────
  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!_accessToken) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${_accessToken}`,
    };
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!accessToken,
        login,
        register,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}