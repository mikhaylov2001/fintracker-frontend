// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://fintrackerpro-production.up.railway.app";
const API_AUTH_BASE = "/api/auth";

// Обёртка с авто‑refresh
const authFetchImpl = async (path, options = {}, getToken, saveAuthData) => {
  const doRequest = async () => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let res = await doRequest();

  if (res.status === 401) {
    const refreshRes = await fetch(`${API_BASE_URL}${API_AUTH_BASE}/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json().catch(() => ({}));

      // Защита от смены пользователя через refresh-cookie
      const prevUser = JSON.parse(localStorage.getItem("authUser") || "null");
      const nextUserId = data?.user?.id;

      if (prevUser?.id && nextUserId && prevUser.id !== nextUserId) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        window.location.href = "/login";
        return res;
      }

      saveAuthData(data);
      res = await doRequest();
    }
  }

  return res;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");

    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const saveAuthData = useCallback((data) => {
    const nextToken = data?.token ?? data?.accessToken ?? data?.jwt ?? null;
    const nextUser = data?.user ?? null;

    if (nextToken) {
      setToken(nextToken);
      localStorage.setItem("authToken", nextToken);
    }
    if (nextUser) {
      setUser(nextUser);
      localStorage.setItem("authUser", JSON.stringify(nextUser));
    }
  }, []);

  const updateUserInState = useCallback((partialUser) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partialUser || {}) };
      localStorage.setItem("authUser", JSON.stringify(next));
      return next;
    });
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await fetch(`${API_BASE_URL}${API_AUTH_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "Login failed");

    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const register = useCallback(async ({ firstName, lastName, email, password }) => {
    const res = await fetch(`${API_BASE_URL}${API_AUTH_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "Registration failed");

    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const res = await fetch(`${API_BASE_URL}${API_AUTH_BASE}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || "Google authentication failed");
    }

    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  // ✅ logout вызывает бэкенд — сервер ставит Max-Age=0 на обе cookie
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}${API_AUTH_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    }
  }, []);

  const value = {
    user,
    token,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!token,
    loading,
    authFetch: (path, options) =>
      authFetchImpl(path, options, () => token, saveAuthData),
    updateUserInState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
