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

const clearAuthData = () => {
  try {
    TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem("authUser");
  } catch {}
};

// Если REACT_APP_API_BASE_URL пустой, запросы идут на текущий домен (через Vercel Rewrites)
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
        credentials: "include", // Обязательно для передачи refresh-кук
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

  // 1. Если 401 или 403 — пробуем один раз обновить токен
  if (res.status === 401 || res.status === 403) {
    const newToken = await refreshToken();
    if (newToken) {
      ({ res, data } = await doRequest());
    }
  }

  // 2. Если после попытки рефреша всё еще 401/403 — сессия мертва
  if (res.status === 401 || res.status === 403) {
    console.warn(`[AUTH] Session expired or forbidden (${res.status}). Forcing logout...`);

    clearAuthData();

    // Уведомляем React-контекст
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));

    // Если мы не на логине — принудительно перекидываем
    if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login');
    }

    const msg = typeof data === "string" ? data : data?.message || data?.error || res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }

  // Обработка остальных ошибок (500, 400 и т.д.)
  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || data?.error || res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }

  return data;
}