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

const getHumanError = (err, context = "general") => {
  const raw = err?.message || String(err || "");
  const lower = raw.toLowerCase();

  if (lower.includes("invalid_password")) return "Неверный текущий пароль";
  if (lower.includes("email_taken"))
    return "Этот email уже используется другим пользователем";

  if (lower.includes("401") || lower.includes("unauthorized")) {
    if (context === "email" || context === "password") {
      return "Неверный текущий пароль";
    }
    return "Сессия истекла. Войдите в аккаунт заново";
  }

  if (lower.includes("403") || lower.includes("forbidden")) {
    return "Недостаточно прав для выполнения действия";
  }

  if (lower.includes("409") || lower.includes("conflict")) {
    if (context === "email")
      return "Этот email уже используется другим пользователем";
    return "Указанные данные уже используются";
  }

  if (lower.includes("400") || lower.includes("bad request")) {
    if (context === "password")
      return "Пароль слишком слабый. Минимум 8 символов";
    if (context === "email") return "Неверный формат email";
    if (context === "profile") return "Проверьте правильность заполнения полей";
    return "Некорректные данные. Проверьте введённую информацию";
  }

  if (lower.includes("500") || lower.includes("internal server")) {
    return "Ошибка сервера. Попробуйте позже";
  }

  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Нет связи с сервером. Проверьте интернет-соединение";
  }
  if (lower.includes("timeout")) {
    return "Сервер не ответил вовремя. Попробуйте ещё раз";
  }

  if (lower.includes("incorrect password") || lower.includes("wrong password"))
    return "Неверный текущий пароль";
  if (lower.includes("email already"))
    return "Этот email уже используется другим пользователем";
  if (lower.includes("user not found")) return "Пользователь не найден";
  if (lower.includes("passwords do not match")) return "Пароли не совпадают";

  return "Произошла ошибка. Попробуйте ещё раз";
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

  // синхронизация токена (на случай другой вкладки)
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

  // ВАЖНО: устойчиво к разным форматам ответов бэка
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

      const nextUser =
        data?.user ??
        data?.authUser ??
        data?.data?.user ??
        null;

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

  // -------- Методы профиля --------

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

  // -------- Авторизация --------

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
