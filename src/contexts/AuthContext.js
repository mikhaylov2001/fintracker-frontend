import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { AuthErrorScreen } from "./AuthErrorScreen";
import { apiFetch } from "../api/clientFetch";

const AuthContext = createContext(null);

const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  "https://fintrackerpro-production.up.railway.app"
).trim();

const API_AUTH_BASE = "/api/auth";
const AUTH_STORAGE_KEYS = ["authToken", "token", "accessToken", "jwt", "authUser"];

// --- ПЕРЕВОДЧИК ОШИБОК ---
const translateError = (err) => {
  const msg = err?.message || String(err);

  if (msg.includes("409")) return "Ошибка: Неверный текущий пароль или данные уже используются.";
  if (msg.includes("401") || msg.includes("403")) return "Сессия истекла. Войдите в систему заново.";
  if (msg.includes("400")) return "Некорректные данные. Проверьте правильность заполнения.";
  if (msg.includes("404")) return "Данные не найдены на сервере.";
  if (msg.includes("500")) return "Ошибка на сервере. Мы уже работаем над исправлением.";
  if (msg.includes("Failed to fetch") || msg.includes("Network Error")) return "Нет связи с сервером. Проверьте интернет.";

  return "Произошла ошибка. Попробуйте еще раз.";
};

const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Загрузка данных при старте
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("authUser");

      const t = normalizeToken(savedToken);
      if (t) setToken(t);

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed && (parsed.id || parsed.email) ? parsed : null);
      }
    } catch (e) {
      console.error("Auth init error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const hardResetState = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      AUTH_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
  }, []);

  const updateUserInState = useCallback((partialUser) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partialUser || {}) };
      localStorage.setItem("authUser", JSON.stringify(next));
      return next;
    });
  }, []);

  // --- МЕТОДЫ ДЛЯ SETTINGS (С СОХРАНЕНИЕМ В БД) ---

  const updateProfile = useCallback(async (data) => {
    try {
      const res = await apiFetch("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      updateUserInState(res);
      return res;
    } catch (err) {
      throw new Error(translateError(err));
    }
  }, [updateUserInState]);

  const updateSettings = useCallback(async (settings) => {
    try {
      const res = await apiFetch("/api/settings/me", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      updateUserInState({ settings: res });
      return res;
    } catch (err) {
      throw new Error(translateError(err));
    }
  }, [updateUserInState]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      return await apiFetch("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (err) {
      throw new Error(translateError(err));
    }
  }, []);

  const deleteData = useCallback(async (year, month, type = 'all') => {
    try {
      return await apiFetch(`/api/data/me/month/${year}/${month}?type=${type}`, {
        method: "DELETE",
      });
    } catch (err) {
      throw new Error(translateError(err));
    }
  }, []);

  // --- СТАНДАРТНЫЕ МЕТОДЫ АВТОРИЗАЦИИ ---

  const saveAuthData = useCallback((data) => {
    const nextToken = normalizeToken(data?.token || data?.accessToken || data?.jwt);
    const nextUser = data?.user;

    if (nextUser) {
      setUser(nextUser);
      localStorage.setItem("authUser", JSON.stringify(nextUser));
    }
    if (nextToken) {
      setToken(nextToken);
      localStorage.setItem("authToken", nextToken);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const data = await apiFetch(`${API_AUTH_BASE}/login`, {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      saveAuthData(data);
      return data;
    } catch (err) {
      throw new Error(translateError(err));
    }
  }, [saveAuthData]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}${API_AUTH_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {} finally {
      hardResetState();
    }
  }, [hardResetState]);

  const value = {
    user,
    token,
    login,
    logout,
    updateProfile,
    updateSettings,
    changePassword,
    deleteData,
    isAuthenticated: !!user && !!token,
    loading,
    updateUserInState,
    authError: false, // Теперь это просто константа, билд не упадет
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);