import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { AuthErrorScreen } from "./AuthErrorScreen";
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
      if (savedToken) setToken(normalizeToken(savedToken));
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
    setAuthError(false);
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const register = useCallback(async (form) => {
    const data = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
    setAuthError(false);
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const data = await apiFetch("/api/auth/google", { method: "POST", body: JSON.stringify({ idToken }) });
    setAuthError(false);
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      hardResetState();
      setAuthError(false);
    }
  }, [hardResetState]);

  const value = {
    user, token, login, register, loginWithGoogle, logout,
    isAuthenticated: !!user && !!token,
    loading, authError,
    authFetch: useCallback(async (url, opts) => {
      const data = await apiFetch(url, opts);
      return { ok: true, status: 200, data };
    }, [])
  };

  if (authError) return <AuthContext.Provider value={value}><AuthErrorScreen onRetry={() => { setAuthError(false); window.location.href='/login'; }} /></AuthContext.Provider>;

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);