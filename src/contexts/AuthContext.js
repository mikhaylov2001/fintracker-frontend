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

// В prod на Vercel оставляем пустым, чтобы был same-origin /api/...
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").trim();
const API_AUTH_BASE = "/api/auth";

const AUTH_STORAGE_KEYS = [
  "authToken",
  "token",
  "accessToken",
  "jwt",
  "authUser",
];

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

    if (savedToken) setToken(savedToken);

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
      const nextToken = data?.token ?? data?.accessToken ?? data?.jwt ?? null;
      const nextUser = data?.user ?? null;

      setUser((prevUser) => {
        if (prevUser && nextUser && prevUser.id !== nextUser.id) {
          console.error("[AUTH] User switch detected in one session", {
            prevUser,
            nextUser,
            time: new Date().toISOString(),
          });
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

  const loginWithGoogle = useCallback(
    async (idToken) => {
      const data = await apiFetch(`${API_AUTH_BASE}/google`, {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      setAuthError(false);
      saveAuthData(data);
      return data;
    },
    [saveAuthData]
  );

  const logout = useCallback(async () => {
    try {
      // этот запрос не критичен — даже если 401, мы всё равно чистим локально
      await fetch(`${API_BASE_URL}${API_AUTH_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      hardResetState();
      setAuthError(false);
      // редирект пусть делает AppLayout
    }
  }, [hardResetState]);

  // Совместимость со старым кодом страниц: они ожидают authFetch -> Response
  const authFetch = useCallback(async (url, options = {}) => {
    const path = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
    const data = await apiFetch(path, options);
    // делаем Response-подобный объект: минимум .ok/.status/.json()
    return {
      ok: true,
      status: 200,
      json: async () => data,
      data,
    };
  }, []);

  const value = {
    user,
    token,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!token,
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

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
