import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { AuthErrorScreen } from "./AuthErrorScreen";
import { apiFetch, AUTH_LOGOUT_EVENT } from "../api/clientFetch";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEYS = [
  "authToken",
  "token",
  "accessToken",
  "jwt",
  "authUser",
];

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

  const hardResetState = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      AUTH_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
  }, []);

  // 1. Инициализация при загрузке
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("authUser");

      const t = normalizeToken(savedToken);
      if (t) setToken(t);

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.id) setUser(parsed);
        } catch {
          setUser(null);
        }
      }
    } catch (e) {
      console.error("[AUTH] Init error", e);
    }
    setLoading(false);
  }, []);

  // 2. Слушатель принудительного разлогина (от 401 ошибок в apiFetch)
  useEffect(() => {
    const handleForceLogout = () => {
      console.warn("[AUTH] Force logout event received");
      hardResetState();
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
  }, [hardResetState]);

  const saveAuthData = useCallback(
    (data) => {
      const nextTokenRaw = data?.token ?? data?.accessToken ?? data?.jwt ?? null;
      const nextToken = normalizeToken(nextTokenRaw);
      const nextUser = data?.user ?? null;

      // Проверка на подмену пользователя (Security Check)
      setUser((prevUser) => {
        if (prevUser && nextUser && prevUser.id !== nextUser.id) {
          console.error("[AUTH] Security: User ID mismatch!", { prevUser, nextUser });
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

  const login = useCallback(async (credentials) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setAuthError(false);
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const register = useCallback(async (form) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setAuthError(false);
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  // Восстановленный метод Google Auth
  const loginWithGoogle = useCallback(async (idToken) => {
    const data = await apiFetch("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
    setAuthError(false);
    saveAuthData(data);
    return data;
  }, [saveAuthData]);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      hardResetState();
      setAuthError(false);
    }
  }, [hardResetState]);

  const updateUserInState = useCallback((partialUser) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partialUser || {}) };
      try {
        localStorage.setItem("authUser", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Удобная обертка для запросов через контекст
  const authFetch = useCallback(async (url, options = {}) => {
    const data = await apiFetch(url, options);
    return { ok: true, status: 200, json: async () => data, data };
  }, []);

  const value = {
    user,
    token,
    login,
    register,
    loginWithGoogle, // Добавлено обратно
    logout,
    isAuthenticated: !!user && !!token,
    loading,
    authError,
    authFetch,
    updateUserInState,
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