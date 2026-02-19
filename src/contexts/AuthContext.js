import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://fintrackerpro-production.up.railway.app";
const API_AUTH_BASE = "/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // стартовое чтение auth из localStorage
  useEffect(() => {
    let savedToken = null;
    let savedUser = null;

    try {
      savedToken = localStorage.getItem("authToken");
      savedUser = localStorage.getItem("authUser");
    } catch {}

    if (savedToken) {
      setToken(savedToken);
    }

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const saveAuthData = useCallback((data) => {
    const nextToken = data?.token ?? data?.accessToken ?? data?.jwt ?? null;
    const nextUser = data?.user ?? null;

    setUser((prevUser) => {
      // защита: если пытаются подменить пользователя в одной вкладке
      if (prevUser && nextUser && prevUser.id !== nextUser.id) {
        console.warn(
          "Detected user switch in one session:",
          prevUser.id,
          "->",
          nextUser.id
        );

        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {}

        setToken(null);
        window.location.href = "/login";
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
  }, []);

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
      const res = await fetch(`${API_BASE_URL}${API_AUTH_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Login failed");

      saveAuthData(data);
      return data;
    },
    [saveAuthData]
  );

  const register = useCallback(
    async ({ firstName, lastName, email, password }) => {
      const res = await fetch(`${API_BASE_URL}${API_AUTH_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || data.message || "Registration failed"
        );

      saveAuthData(data);
      return data;
    },
    [saveAuthData]
  );

  const loginWithGoogle = useCallback(
    async (idToken) => {
      const res = await fetch(`${API_BASE_URL}${API_AUTH_BASE}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Google authentication failed"
        );
      }

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
      setUser(null);
      setToken(null);

      try {
        localStorage.clear();
      } catch {}
      try {
        sessionStorage.clear();
      } catch {}

      try {
        document.cookie
          .split(";")
          .map((c) => c.trim())
          .forEach((c) => {
            if (!c) return;
            const eq = c.indexOf("=");
            const name = eq > -1 ? c.substring(0, eq) : c;
            document.cookie =
              name +
              "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
            document.cookie =
              name +
              "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/api;";
          });
      } catch (e) {
        console.warn("Cookie clear failed:", e);
      }

      try {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      } catch {}

      window.location.href = "/login";
    }
  }, []);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const finalUrl = url.startsWith("http")
        ? url
        : `${API_BASE_URL}${url}`;

      const doRequest = async () => {
        const headers = {
          ...(options.headers || {}),
        };

        if (options.body && !headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }

        const hadToken = !!token;

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(finalUrl, {
          ...options,
          headers,
          credentials: "include",
        });

        return { res, hadToken };
      };

      // первый запрос
      let { res, hadToken } = await doRequest();

      // если не было токена или статус не 401 — просто возвращаем
      if (!hadToken || res.status !== 401) {
        return res;
      }

      // был токен и получили 401 → пробуем refresh
      try {
        const refreshRes = await fetch(
          `${API_BASE_URL}${API_AUTH_BASE}/refresh`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!refreshRes.ok) {
          await logout();
          return res;
        }

        const data = await refreshRes.json().catch(() => ({}));

        if (data.token || data.accessToken || data.jwt || data.user) {
          saveAuthData(data);
        }

        ({ res } = await doRequest());
        return res;
      } catch {
        await logout();
        return res;
      }
    },
    [token, logout, saveAuthData]
  );

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
