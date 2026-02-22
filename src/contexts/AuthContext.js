import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { apiFetch, AUTH_LOGOUT_EVENT } from "../api/clientFetch";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEYS = ["authToken", "authUser"];

const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const hardResetState = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      AUTH_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("authUser");
      const t = normalizeToken(savedToken);
      if (t) setToken(t);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && (parsed.id || parsed.email)) setUser(parsed);
        } catch { setUser(null); }
      }
    } catch (e) { console.error("[AUTH] Init error", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleForceLogout = () => {
      hardResetState();
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
  }, [hardResetState]);

  const saveAuthData = useCallback((data) => {
    if (!data) return;
    const nextToken = normalizeToken(data.token || data.accessToken || data.jwt);
    if (data.user) {
      setUser(data.user);
      localStorage.setItem("authUser", JSON.stringify(data.user));
    }
    if (nextToken) {
      setToken(nextToken);
      localStorage.setItem("authToken", nextToken);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      hardResetState();
      window.location.href = '/login';
    }
  }, [hardResetState]);

  const value = {
    user, token, login, logout,
    isAuthenticated: !!user && !!token,
    loading, authError
  };

  // Простая заглушка вместо AuthErrorScreen для успешной сборки
  if (authError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
        <h2>Ошибка сессии</h2>
        <button onClick={() => window.location.href = '/login'}>Войти заново</button>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};