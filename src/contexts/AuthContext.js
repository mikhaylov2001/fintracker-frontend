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

// Перевод ошибок на русский
const getRuError = (err) => {
  const msg = err?.message || String(err);
  if (msg.includes("409")) return "Неверный пароль или данные уже заняты";
  if (msg.includes("401") || msg.includes("403")) return "Сессия истекла, войдите заново";
  return "Ошибка при сохранении данных";
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
  const [authError, setAuthError] = useState(false);

  // 1. Загрузка при старте (как в твоем старом коде)
  useEffect(() => {
    let savedToken = localStorage.getItem("authToken");
    let savedUser = localStorage.getItem("authUser");
    const t = normalizeToken(savedToken);
    if (t) setToken(t);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed && parsed.id ? parsed : null);
      } catch { setUser(null); }
    }
    setLoading(false);
  }, []);

  // 2. Твоя стандартная синхронизация токена (раз в 10 сек)
  useEffect(() => {
    const sync = () => {
      try {
        const t = normalizeToken(localStorage.getItem("authToken"));
        if (t) setToken(t);
      } catch {}
    };
    const id = setInterval(sync, 10000);
    return () => clearInterval(id);
  }, []);

  const hardResetState = useCallback(() => {
    setUser(null);
    setToken(null);
    AUTH_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  }, []);

  // ФУНКЦИЯ ОБНОВЛЕНИЯ СОСТОЯНИЯ (Критически важна для смены имени)
  const updateUserInState = useCallback((updatedUser) => {
    if (!updatedUser) return;
    setUser(updatedUser);
    localStorage.setItem("authUser", JSON.stringify(updatedUser));
  }, []);

  // --- РАБОТА С БЭКЕНДОМ (ИМЯ / ФАМИЛИЯ) ---
  const updateProfile = useCallback(async (data) => {
    try {
      // Отправляем PUT запрос на твой AccountController
      const res = await apiFetch("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      // Если бэк вернул обновленного юзера, сохраняем его
      updateUserInState(res);
      return res;
    } catch (e) {
      throw new Error(getRuError(e));
    }
  }, [updateUserInState]);

  const updateSettings = useCallback(async (settings) => {
    try {
      const res = await apiFetch("/api/settings/me", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      // Обновляем настройки внутри объекта user
      if (user) {
        const newUser = { ...user, settings: res };
        updateUserInState(newUser);
      }
      return res;
    } catch (e) {
      throw new Error(getRuError(e));
    }
  }, [user, updateUserInState]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      return await apiFetch("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (e) {
      throw new Error(getRuError(e));
    }
  }, []);

  const deleteData = useCallback(async (year, month, type = 'all') => {
    try {
      return await apiFetch(`/api/data/me/month/${year}/${month}?type=${type}`, {
        method: "DELETE",
      });
    } catch (e) {
      throw new Error(getRuError(e));
    }
  }, []);

  // --- СТАНДАРТНЫЕ МЕТОДЫ (ЛОГИН/РЕГИСТРАЦИЯ) ---
  const saveAuthData = useCallback((data) => {
    const nextToken = normalizeToken(data?.token || data?.accessToken || data?.jwt);
    const nextUser = data?.user;
    if (nextUser) updateUserInState(nextUser);
    if (nextToken) {
      setToken(nextToken);
      localStorage.setItem("authToken", nextToken);
    }
  }, [updateUserInState]);

  const login = useCallback(async (creds) => {
    const data = await apiFetch(`${API_AUTH_BASE}/login`, { method: "POST", body: JSON.stringify(creds) });
    setAuthError(false);
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}${API_AUTH_BASE}/logout`, { method: "POST", credentials: "include" });
    } catch {} finally {
      hardResetState();
      setAuthError(false);
    }
  }, [hardResetState]);

  const authFetch = useCallback(async (url, opts) => {
    const data = await apiFetch(url, opts);
    return { ok: true, data };
  }, []);

  const value = {
    user, token, login, logout, updateProfile, updateSettings,
    changePassword, deleteData, updateUserInState, authFetch,
    isAuthenticated: !!user && !!token,
    loading, authError
  };

  if (authError) return <AuthErrorScreen />;

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);