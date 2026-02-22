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
const AUTH_STORAGE_KEYS = [
  "authToken",
  "token",
  "accessToken",
  "jwt",
  "authUser",
];

// Хелпер для нормализации ошибок
const getRuError = (err) => {
  const msg = err?.message || String(err);
  if (msg.includes("409")) return "Ошибка: Неверный текущий пароль или данные уже заняты.";
  if (msg.includes("401") || msg.includes("403")) return "Сессия истекла. Войдите заново.";
  if (msg.includes("Failed to fetch")) return "Нет связи с сервером.";
  return "Произошла ошибка. Попробуйте еще раз.";
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
        setUser(parsed && parsed.id ? parsed : null);
      } catch {
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  // Твоя старая синхронизация токена
  useEffect(() => {
    const sync = () => {
      try {
        const savedToken = localStorage.getItem("authToken");
        const t = normalizeToken(savedToken);
        setToken(t);
      } catch {}
    };

    sync();
    const id = setInterval(sync, 10000);
    return () => clearInterval(id);
  }, []);

  const hardResetState = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      for (const k of AUTH_STORAGE_KEYS) localStorage.removeItem(k);
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
  }, []);

  const saveAuthData = useCallback(
    (data) => {
      const nextTokenRaw = data?.token ?? data?.accessToken ?? data?.jwt ?? null;
      const nextToken = normalizeToken(nextTokenRaw);
      const nextUser = data?.user ?? null;

      setUser((prevUser) => {
        if (prevUser && nextUser && prevUser.id !== nextUser.id) {
          hardResetState();
          setAuthError(true);
          return null;
        }
        if (nextUser) {
          try {
            localStorage.setItem("authUser", JSON.stringify(nextUser));
          } catch {}
          return nextUser;
        }
        return prevUser;
      });

      if (nextToken) {
        setToken(nextToken);
        try {
          localStorage.setItem("authToken", nextToken);
        } catch {}
      }
    },
    [hardResetState]
  );

  const updateUserInState = useCallback((partialUser) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partialUser || {}) };
      try {
        localStorage.setItem("authUser", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // --- ДОБАВЛЕННЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ ВАШЕГО БЭКЕНДА ---

  const updateProfile = useCallback(async (data) => {
    try {
      const res = await apiFetch("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
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
      updateUserInState({ settings: res });
      return res;
    } catch (e) {
      throw new Error(getRuError(e));
    }
  }, [updateUserInState]);

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

  // --- ОРИГИНАЛЬНЫЕ МЕТОДЫ ---

  const login = useCallback(
    async ({ email, password }) => {
      const data = await apiFetch(`${API_AUTH_BASE}/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuthError(false);
      saveAuthData(data);
      return data;
    },
    [saveAuthData]
  );

  const register = useCallback(
    async ({ firstName, lastName, email, password }) => {
      const data = await apiFetch(`${API_AUTH_BASE}/register`, {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      setAuthError(false);
      saveAuthData(data);
      return data;
    },
    [saveAuthData]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}${API_AUTH_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      hardResetState();
      setAuthError(false);
    }
  }, [hardResetState]);

  const authFetch = useCallback(async (url, options = {}) => {
    const data = await apiFetch(url, options);
    return { ok: true, status: 200, json: async () => data, data };
  }, []);

  const hasStoredToken = (() => {
    try {
      return Boolean(localStorage.getItem("authToken"));
    } catch {
      return false;
    }
  })();

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    updateSettings,
    changePassword,
    deleteData,
    isAuthenticated: !!user && hasStoredToken,
    loading,
    updateUserInState,
    authFetch,
    authError,
  };

  if (authError) {
    return (
      <AuthContext.Provider value={value}>
        <AuthErrorScreen />
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};