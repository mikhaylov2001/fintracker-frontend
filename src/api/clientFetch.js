// src/api/clientFetch.js

const TOKEN_KEYS = ["authToken", "token", "accessToken", "jwt"];

// Ключ события для уведомления AuthContext о потере авторизации
export const AUTH_LOGOUT_EVENT = "app_force_logout";

const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  if (!s) return null;
  return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
};

const readToken = () => {
  try {
    for (const k of TOKEN_KEYS) {
      const v = localStorage.getItem(k);
      const t = normalizeToken(v);
      if (t) return t;
    }
  } catch {}
  return null;
};

const writeToken = (token) => {
  const t = normalizeToken(token);
  if (!t) return;
  try {
    localStorage.setItem("authToken", t);
  } catch {}
};

// Если REACT_APP_API_BASE_URL пустой, запросы идут на текущий домен (для Rewrites)
const API_BASE = String(process.env.REACT_APP_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const p = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
};

const parseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

let refreshPromise = null;

async function refreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(buildUrl("/api/auth/refresh"), {
        method: "POST",
        credentials: "include", // Обязательно для HttpOnly cookies
        headers: new Headers({ "Content-Type": "application/json" }),
      });

      const data = await parseBody(res);
      if (!res.ok) return null;

      const newAccess = data?.token || data?.accessToken || data?.jwt || null;

      if (newAccess) writeToken(newAccess);
      if (data?.user) {
        try {
          localStorage.setItem("authUser", JSON.stringify(data.user));
        } catch {}
      }

      return normalizeToken(newAccess) || null;
    } catch (e) {
      console.error("[AUTH] Refresh fetch error:", e);
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);

  const doRequest = async () => {
    const token = readToken();
    const headers = new Headers(options.headers || {});
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

    if (!isFormData && options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(url, {
      ...options,
      credentials: options.credentials ?? "include",
      headers,
    });

    const data = await parseBody(res);
    return { res, data };
  };

  let { res, data } = await doRequest();

  // Если 401 — пытаемся обновить токен
  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      ({ res, data } = await doRequest());
    }
  }

  // Если все еще 401 — сессия окончательно мертва
  if (res.status === 401) {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      // Сообщаем контексту, что нужно разлогинить пользователя
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    } catch {}

    const msg = typeof data === "string" ? data : data?.message || data?.error || res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || data?.error || res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }

  return data;
}