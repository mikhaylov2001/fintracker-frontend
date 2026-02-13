// src/contexts/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

const API_ORIGIN = process.env.REACT_APP_API_BASE_URL || "http://localhost:8082";
const API_BASE_URL = `${API_ORIGIN}/api/auth`;


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, userName, email }
  const [token, setToken] = useState(null); // JWT
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const saveAuthData = (data) => {
    const nextToken = data?.token ?? data?.accessToken ?? data?.jwt;
    const nextUser = data?.user ?? null;

    if (nextToken) {
      setToken(nextToken);
      localStorage.setItem("authToken", nextToken);
    }
    if (nextUser) {
      setUser(nextUser);
      localStorage.setItem("authUser", JSON.stringify(nextUser));
    }
  };

  const login = async ({ userName, password }) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName, password }),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "Login failed");

    saveAuthData(data);
    return data;
  };

  const register = async ({ userName, email, password, chatId }) => {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName, email, password, chatId }),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.error || data.message || "Registration failed");

    saveAuthData(data);
    return data;
  };

  const loginWithGoogle = async (idToken) => {
    const res = await fetch(`${API_BASE_URL}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(
        data.error || data.message || "Google authentication failed"
      );

    saveAuthData(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  };

  const value = {
    user,
    token,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
