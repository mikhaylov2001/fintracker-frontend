// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { apiFetch, AUTH_LOGOUT_EVENT } from "../api/clientFetch";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEYS = ["authToken", "authUser"];

// Хелпер для очистки токена
const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
};

// Улучшенный переводчик ошибок
const getHumanErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  const message = error.message || "";
  if (message.includes("500")) return "Ошибка на сервере. Мы уже чиним.";
  if (message.includes("403") || message.includes("401")) return "Сессия истекла. Войдите снова.";
  if (message.includes("404")) return "Данные не найдены.";
  if (message.includes("Failed to fetch")) return "Сервер недоступен. Проверьте интернет.";
  return message || "Произошла ошибка. Попробуйте еще раз.";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Полный сброс авторизации
  const hardResetState = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      AUTH_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
  }, []);

  // Инициализация из LocalStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("authUser");
      const t = normalizeToken(savedToken);
      
      if (t) setToken(t);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id || parsed?.email) setUser(parsed);
      }
    } catch (e) {
      console.error("[AUTH] Init error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Слушатель глобального события логаута (например, при 401 ошибке из apiFetch)
  useEffect(() => {
    const handleForceLogout = () => hardResetState();
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
  }, [hardResetState]);

  // Сохранение данных при логине/регистрации
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

  /**
   * ОБНОВЛЕНИЕ ПРОФИЛЯ И НАСТРОЕК
   * Универсальный метод для firstName, lastName, displayCurrency, hideAmounts
   */
  const updateProfile = useCallback(async (updatedFields) => {
    try {
      const data = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(updatedFields),
      });

      if (data) {
        const newUserState = { ...(user || {}), ...data };
        setUser(newUserState);
        localStorage.setItem("authUser", JSON.stringify(newUserState));
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: getHumanErrorMessage(error) };
    }
  }, [user]);

  /**
   * СМЕНА ПАРОЛЯ
   */
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      await apiFetch("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: getHumanErrorMessage(error) };
    }
  }, []);

  /**
   * УДАЛЕНИЕ ДАННЫХ ЗА МЕСЯЦ
   */
  const deleteDataByMonth = useCallback(async (month, type = 'all') => {
    try {
      // month ожидается в формате "YYYY-MM"
      await apiFetch(`/api/data/delete?month=${month}&type=${type}`, {
        method: "DELETE",
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: getHumanErrorMessage(error) };
    }
  }, []);

  // --- Стандартные методы Auth ---

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

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      hardResetState();
      window.location.href = "/login";
    }
  }, [hardResetState]);

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteDataByMonth,
    isAuthenticated: !!user && !!token,
    loading,
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