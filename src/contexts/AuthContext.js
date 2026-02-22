// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { apiFetch, AUTH_LOGOUT_EVENT } from "../api/clientFetch";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEYS = ["authToken", "authUser"];

const getHumanErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  const message = error?.message || "";
  if (message.includes("500")) return "Ошибка на сервере. Попробуйте позже.";
  if (message.includes("403") || message.includes("401")) return "Сессия истекла. Войдите снова.";
  if (message.includes("Failed to fetch")) return "Нет связи с сервером. Проверьте интернет.";
  return message || "Произошла ошибка";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);

  // Инициализация
  useEffect(() => {
    const savedUser = localStorage.getItem("authUser");
    if (savedUser && savedUser !== "undefined") {
      try { setUser(JSON.parse(savedUser)); } catch (e) { console.error(e); }
    }
    setLoading(false);
  }, []);

  // Слушатель принудительного выхода
  useEffect(() => {
    const handleForceLogout = () => {
      AUTH_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
      setUser(null);
      setToken(null);
      window.location.href = "/login";
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
  }, []);

  /**
   * 1. ПРОФИЛЬ (Имя, Фамилия) -> AccountController PUT /api/account/profile
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      const res = await apiFetch("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });
      // Обновляем локальное состояние пользователя
      const updatedUser = { ...user, ...res };
      setUser(updatedUser);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: getHumanErrorMessage(err) };
    }
  }, [user]);

  /**
   * 2. НАСТРОЙКИ (Валюта, Скрытие) -> UserSettingsController PUT /api/settings/me
   */
  const updateSettings = useCallback(async (settingsData) => {
    try {
      const res = await apiFetch("/api/settings/me", {
        method: "PUT",
        body: JSON.stringify(settingsData),
      });
      // Настройки в твоем бэкенде обычно лежат в поле settings или приходят отдельным DTO
      const updatedUser = { ...user, settings: res };
      setUser(updatedUser);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: getHumanErrorMessage(err) };
    }
  }, [user]);

  /**
   * 3. БЕЗОПАСНОСТЬ -> AccountController POST /api/account/change-password
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await apiFetch("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: getHumanErrorMessage(err) };
    }
  }, []);

  /**
   * 4. УДАЛЕНИЕ -> DataController DELETE /api/data/me/month/{year}/{month}
   */
  const deleteData = useCallback(async (year, month, type = 'all') => {
    try {
      await apiFetch(`/api/data/me/month/${year}/${month}?type=${type}`, {
        method: "DELETE",
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: getHumanErrorMessage(err) };
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });
    if (data.token) {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    AUTH_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, updateProfile,
      updateSettings, changePassword, deleteData,
      isAuthenticated: !!token, loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);