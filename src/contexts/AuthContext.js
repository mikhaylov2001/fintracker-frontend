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

const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
};

// Функция-"переводчик" технических ошибок в понятные слова
const getHumanErrorMessage = (error) => {
  const message = error.message || "";
  if (message.includes("500")) return "Ошибка на сервере. Попробуйте позже.";
  if (message.includes("403") || message.includes("401")) return "Сессия истекла. Войдите в аккаунт снова.";
  if (message.includes("404")) return "Данные не найдены.";
  if (message.includes("Failed to fetch")) return "Нет связи с сервером. Проверьте интернет.";
  return message || "Произошла непредвиденная ошибка";
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
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.id || parsed.email)) setUser(parsed);
      }
    } catch (e) {
      console.error("[AUTH] Init error", e);
    }
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

  /**
   * ОБНОВЛЕНИЕ ПРОФИЛЯ / ВАЛЮТЫ / СКРЫТИЯ СУММ
   */
  const updateProfile = useCallback(async (updatedFields) => {
    try {
      const data = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(updatedFields),
      });

      if (data) {
        setUser((prev) => {
          const next = { ...(prev || {}), ...data };
          localStorage.setItem("authUser", JSON.stringify(next));
          return next;
        });
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: getHumanErrorMessage(error)
      };
    }
  }, []);

  /**
   * УДАЛЕНИЕ ДАННЫХ
   */
  const deleteDataByMonth = useCallback(async (month, type) => {
    try {
      await apiFetch(`/api/data/delete?month=${month}&type=${type}`, {
        method: "DELETE",
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getHumanErrorMessage(error)
      };
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
    const data = await apiFetch("/api/auth/google", { method: "POST", body: JSON.stringify({ idToken }) });
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
    loginWithGoogle,
    logout,
    updateProfile,
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