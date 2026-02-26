// src/contexts/AuthContext.jsx
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
  "refreshTokenBackup",
];

const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  if (!s) return null;
  return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
};

const getHumanError = (err, context = "general") => {
  const status = err?.status;
  const code = err?.code;
  const raw = err?.message || String(err || "");
  const lower = raw.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Нет связи с сервером. Проверьте интернет-соединение";
  }
  if (lower.includes("timeout")) {
    return "Сервер не ответил вовремя. Попробуйте ещё раз";
  }

  if (code === "SESSION_EXPIRED") {
    return "Сессия истекла. Войдите в аккаунт заново";
  }

  if (context === "email") {
    if (status === 401) return "Неверный пароль";
    if (
      status === 400 &&
      (lower.includes("password") ||
        lower.includes("invalid") ||
        lower.includes("wrong") ||
        lower.includes("incorrect"))
    ) {
      return "Неверный пароль";
    }
    if (status === 409) return "Этот email уже используется другим пользователем";
    if (lower.includes("email_taken")) {
      return "Этот email уже используется другим пользователем";
    }
    return "Не удалось изменить email. Проверьте пароль и попробуйте ещё раз";
  }

  if (context === "password") {
    if (status === 401) return "Текущий пароль неверен";
    if (status === 400) return "Пароль слишком слабый. Минимум 8 символов";
    return "Не удалось изменить пароль. Попробуйте ещё раз";
  }

  if (status === 401) {
    if (context === "login" || context === "register") {
      return "Неверный email или пароль";
    }
    return "Сессия истекла. Войдите в аккаунт заново";
  }

  if (status === 403) return "Недостаточно прав для выполнения действия";

  if (status === 409) {
    if (context === "register") return "Этот email уже используется другим пользователем";
    return "Указанные данные уже используются";
  }

  if (status === 400) {
    if (context === "profile") return "Проверьте правильность заполнения полей";
    return "Некорректные данные. Проверьте введённую информацию";
  }

  if (status >= 500) return "Ошибка сервера. Попробуйте позже";

  if (lower.includes("invalid_password")) return "Неверный пароль";
  if (lower.includes("user not found")) return "Пользователь не найден";

  return "Произошла ошибка. Попробуйте ещё раз";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    try {
      const savedToken = normalizeToken(localStorage.getItem("authToken"));
      if (savedToken) setToken(savedToken);

      const savedUserRaw = localStorage.getItem("authUser");
      if (savedUserRaw) {
        try {
          const parsed = JSON.parse(savedUserRaw);
          setUser(parsed && parsed.id ? parsed : null);
        } catch {
          setUser(null);
        }
      }
    } catch {}

    setLoading(false);
  }, []);

  useEffect(() => {
    const sync = () => {
      try {
        const savedToken = normalizeToken(localStorage.getItem("authToken"));
        setToken(savedToken);
      } catch {}
    };
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
      const nextTokenRaw =
        data?.token ??
        data?.accessToken ??
        data?.jwt ??
        data?.authToken ??
        data?.data?.token ??
        data?.data?.accessToken ??
        null;

      const nextToken = normalizeToken(nextTokenRaw);

      const nextUser = data?.user ?? data?.authUser ?? data?.data?.user ?? null;

      if (nextUser) {
        setUser((prevUser) => {
          if (
            prevUser &&
            nextUser &&
            prevUser.id &&
            nextUser.id &&
            prevUser.id !== nextUser.id
          ) {
            hardResetState();
            setAuthError(true);
            return null;
          }
          try {
            localStorage.setItem("authUser", JSON.stringify(nextUser));
          } catch {}
          return nextUser;
        });
      }

      if (nextToken) {
        setToken(nextToken);
        try {
          localStorage.setItem("authToken", nextToken);
        } catch {}
      }

      // если когда‑то начнёшь возвращать refreshToken в login/refresh — сохраним
      const ref =
        data?.refreshToken || data?.refresh || data?.data?.refreshToken || null;
      if (ref) {
        try {
          localStorage.setItem("refreshTokenBackup", ref);
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

  const updateProfile = useCallback(
    async (data) => {
      try {
        const res = await apiFetch("/api/account/profile", {
          method: "PUT",
          body: JSON.stringify(data),
        });
        saveAuthData(res);
        return res;
      } catch (e) {
        throw new Error(getHumanError(e, "profile"));
      }
    },
    [saveAuthData]
  );

  const updateEmail = useCallback(
    async (newEmail, password) => {
      try {
        const res = await apiFetch("/api/account/email", {
          method: "PUT",
          body: JSON.stringify({ newEmail, password }),
        });
        saveAuthData(res);
        return res;
      } catch (e) {
        throw new Error(getHumanError(e, "email"));
      }
    },
    [saveAuthData]
  );

  const updateSettings = useCallback(
    async (settings) => {
      try {
        const res = await apiFetch("/api/settings/me", {
          method: "PUT",
          body: JSON.stringify(settings),
        });
        updateUserInState({ settings: res });
        return res;
      } catch (e) {
        throw new Error(getHumanError(e, "settings"));
      }
    },
    [updateUserInState]
  );

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      return await apiFetch("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (e) {
      throw new Error(getHumanError(e, "password"));
    }
  }, []);

  const deleteData = useCallback(async (year, month, type = "all") => {
    try {
      return await apiFetch(`/api/data/me/month/${year}/${month}?type=${type}`, {
        method: "DELETE",
      });
    } catch (e) {
      throw new Error(getHumanError(e, "delete"));
    }
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      try {
        const data = await apiFetch(`${API_AUTH_BASE}/login`, {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setAuthError(false);
        saveAuthData(data);
        return data;
      } catch (e) {
        throw new Error(getHumanError(e, "login"));
      }
    },
    [saveAuthData]
  );

  const loginWithGoogle = useCallback(
    async (idToken) => {
      try {
        const data = await apiFetch(`${API_AUTH_BASE}/google`, {
          method: "POST",
          body: JSON.stringify({ idToken }),
        });
        setAuthError(false);
        saveAuthData(data);
        return data;
      } catch (e) {
        throw new Error(getHumanError(e, "login"));
      }
    },
    [saveAuthData]
  );

  const register = useCallback(
    async ({ firstName, lastName, email, password }) => {
      try {
        const data = await apiFetch(`${API_AUTH_BASE}/register`, {
          method: "POST",
          body: JSON.stringify({ firstName, lastName, email, password }),
        });
        setAuthError(false);
        saveAuthData(data);
        return data;
      } catch (e) {
        throw new Error(getHumanError(e, "register"));
      }
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

  const value = {
    user,
    token,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    updateEmail,
    updateSettings,
    changePassword,
    deleteData,
    isAuthenticated: Boolean(user && token),
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
