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
        } catch { localStorage.removeItem("authUser"); }
      }
    } catch (e) { console.error("[AUTH] Init error", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleForceLogout = () => hardResetState();
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

  const register = useCallback(async (form) => {
    const data = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const loginWithGoogle = useCallback(async (idToken) => {
    // Отправляем ID токен, полученный от Google, на наш бэкенд
    const data = await apiFetch("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken })
    });
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

  const updateUserInState = useCallback((partialUser) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partialUser || {}) };
      try { localStorage.setItem("authUser", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const value = {
    user, token, login, register, loginWithGoogle, logout,
    updateUserInState,
    isAuthenticated: !!user && !!token,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};