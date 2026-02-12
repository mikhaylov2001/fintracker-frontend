// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// REACT_APP_API_BASE_URL должен быть типа: "http://localhost:8082" или "https://your-domain"
// А полный базовый путь для auth = <origin>/api/auth (см. swagger) [file:7210]
const ORIGIN = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');
const AUTH_BASE_URL =
  ORIGIN
    ? `${ORIGIN}/api/auth`
    : (process.env.NODE_ENV === 'development' ? 'http://localhost:8082/api/auth' : '');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // { id, userName, email }
  const [token, setToken] = useState(null);    // JWT
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const saveAuthData = (data) => {
    const { token, user } = data || {};
    setToken(token || null);
    setUser(user || null);

    if (token) localStorage.setItem('authToken', token);
    if (user) localStorage.setItem('authUser', JSON.stringify(user));
  };

  const login = async ({ userName, password }) => {
    if (!AUTH_BASE_URL) throw new Error('API base URL is not configured');

    const res = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');

    saveAuthData(data);
    return data;
  };

  const register = async ({ userName, email, password, chatId }) => {
    if (!AUTH_BASE_URL) throw new Error('API base URL is not configured');

    const res = await fetch(`${AUTH_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, email, password, chatId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    saveAuthData(data);
    return data;
  };

  const loginWithGoogle = async (idToken) => {
    if (!AUTH_BASE_URL) throw new Error('API base URL is not configured');

    const res = await fetch(`${AUTH_BASE_URL}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Google authentication failed');

    saveAuthData(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
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
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
