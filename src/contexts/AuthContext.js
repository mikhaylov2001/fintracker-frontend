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

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");

    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const saveAuthData = useCallback((data) => {
    const nextToken = data?.token ?? data?.accessToken ?? data?.jwt ?? null;
    const nextUser = data?.user ?? null;

    if (nextToken) {
      setToken(nextToken);
      localStorage.setItem("authToken", nextToken);
    }
    if (nextUser) {
      setUser(nextUser);
      localStorage.setItem("authUser", JSON.stringify(nextUser));
    }
  }, []);

  const updateUserInState = useCallback((partialUser) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partialUser || {}) };
      localStorage.setItem("authUser", JSON.stringify(next));
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
      // сбрасываем стейт
      setUser(null);
      setToken(null);

      // чистим localStorage / sessionStorage
      try {
        localStorage.clear();
      } catch {}
      try {
        sessionStorage.clear();
      } catch {}

      // удаляем доступные JS-куки для домена
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

      // на всякий случай ещё раз удаляем ключи авторизации
      try {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      } catch {}
    }
  }, []);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const finalUrl = url.startsWith("http")
        ? url
        : `${API_BASE_URL}${url}`;

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

      // Логаут только если мы реально отправляли токен
      if (hadToken && (res.status === 401 || res.status === 403)) {
        await logout();
      }

      return res;
    },
    [token, logout]
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
