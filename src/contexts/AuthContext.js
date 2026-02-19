// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://fintrackerpro-production.up.railway.app";
const API_AUTH_BASE = "/api/auth";

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
    updateUserInState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
