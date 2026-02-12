// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // { id, userName, email }
  const [token, setToken] = useState(null); // JWT
  const [loading, setLoading] = useState(true);

  const syncFromStorage = () => {
    const t = localStorage.getItem("authToken");
    const u = localStorage.getItem("authUser");
    setToken(t || null);
    setUser(u ? JSON.parse(u) : null);
  };

  useEffect(() => {
    syncFromStorage();
    setLoading(false);
  }, []);

  const login = async ({ userName, password }) => {
    await authService.login({ userName, password });
    syncFromStorage();
  };

  const register = async ({ userName, email, password, chatId }) => {
    await authService.register({ userName, email, password, chatId });
    syncFromStorage();
  };

  const loginWithGoogle = async (idToken) => {
    await authService.loginWithGoogle(idToken);
    syncFromStorage();
  };

  const logout = () => {
    authService.logout();
    syncFromStorage();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        loginWithGoogle,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
