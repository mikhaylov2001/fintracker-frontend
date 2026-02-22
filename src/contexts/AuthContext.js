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

// --- УЛУЧШЕННАЯ ОБРАБОТКА ОШИБОК ---
const translateError = (err) => {
  const msg = err?.message || String(err);

  // Если бэкенд прислал 409 (обычно это неверный старый пароль или занятый email)
  if (msg.includes("409")) return "Неверный текущий пароль или данные уже заняты";
  if (msg.includes("401") || msg.includes("403")) return "Сессия истекла, войдите заново";
  if (msg.includes("400")) return "Проверьте правильность введенных данных";
  if (msg.includes("404")) return "Запрашиваемые данные не найдены";
  if (msg.includes("500")) return "Ошибка на сервере, мы уже чиним";
  if (msg.includes("Failed to fetch")) return "Нет соединения с интернетом";

  return msg || "Произошла ошибка, попробуйте позже";
};

const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  if (!s) return null;
  return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let savedToken = null;
    let savedUser = null;
    try {
      savedToken = localStorage.getItem("authToken");
      savedUser = localStorage.getItem("authUser");
    } catch {}

    const t = normalizeToken(savedToken);
    if (t) setToken(t);

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed && (parsed.id || parsed.email) ? parsed : null);
      } catch { setUser(null); }
    }
    setLoading(false);
  }, []);

  const hardResetState = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      for (const k of AUTH_STORAGE_KEYS) localStorage.removeItem(k);
      sessionStorage.clear();
    } catch {}
  }, []);

  const saveAuthData = useCallback((data) => {
    const nextTokenRaw = data?.token ?? data?.accessToken ?? data?.jwt ?? null;
    const nextToken = normalizeToken(nextTokenRaw);
    const nextUser = data?.user ?? null;

    setUser((prevUser) => {
      if (prevUser && nextUser && prevUser.id && nextUser.id && prevUser.id !== nextUser.id) {
        hardResetState();
        setAuthError(true);
        return null;
      }
      if (nextUser) {
        localStorage.setItem("authUser", JSON.stringify(nextUser));
        return nextUser;
      }
      return prevUser;
    });

    if (nextToken) {
      setToken(nextToken);
      localStorage.setItem("authToken", nextToken);
    }
  }, [hardResetState]);

  const updateUserInState = useCallback((partialUser) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partialUser || {}) };
      localStorage.setItem("authUser", JSON.stringify(next));
      return next;
    });
  }, []);

  // --- МЕТОДЫ ДЛЯ SETTINGS (С СОХРАНЕНИЕМ В БД И ПЕРЕВОДОМ ОШИБОК) ---

  const updateProfile = useCallback(async (data) => {
    try {
      // Идет в AccountController.java -> @PutMapping("/profile")
      const res = await apiFetch("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      updateUserInState(res);
      return { success: true, data: res };
    } catch (err) {
      throw new Error(translateError(err));
    }
  }, [updateUserInState]);

  const updateSettings = useCallback(async (settings) => {
    try {
      // Идет в UserSettingsController.java -> @PutMapping("/me")
      const res = await apiFetch("/api/settings/me", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      updateUserInState({ settings: res });
      return { success: true, data: res };
    } catch (err) {
      throw new Error(translateError(err));
    }
  }, [updateUserInState]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      // Идет в AccountController.java -> @PostMapping("/change-password")
      await apiFetch("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return { success: true };
    } catch (err) {
      // Вот тут 409 превратится в "Неверный текущий пароль..."
      throw new Error(translateError(err));
    }
  }, []);

  const deleteData = useCallback(async (year, month, type = 'all') => {
    try {
      await apiFetch(`/api/data/me/month/${year}/${month}?type=${type}`, {
        method: "DELETE",
      });
      return { success: true };
    } catch (err) {
      throw new Error(translateError(err));
    }
  }, []);

  // --- ОСТАЛЬНЫЕ СТАНДАРТНЫЕ МЕТОДЫ ---

  const login = useCallback(async ({ email, password }) => {
    try {
      const data = await apiFetch(`${API_AUTH_BASE}/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuthError(false);
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
      setAuthError(false);
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
    isAuthenticated: !!user && !!localStorage.getItem("authToken"),
    loading,
    updateUserInState,
    authError,
  };

  if (authError) return <AuthErrorScreen />;

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);