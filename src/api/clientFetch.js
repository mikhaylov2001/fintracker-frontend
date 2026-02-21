// src/api/clientFetch.js

const TOKEN_KEYS = ["authToken", "token", "accessToken", "jwt"];

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

// ВАЖНО:
// - В проде на Vercel лучше ходить относительным /api/*, чтобы cookie была first-party.
// - Если задан REACT_APP_API_BASE_URL, используем его (удобно для локалки/дебага).
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
    const res = await fetch(buildUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const data = await parseBody(res);
    if (!res.ok) return null;

    const newAccess = data?.token || data?.accessToken || data?.jwt || null;

    if (newAccess) writeToken(newAccess);
    try {
      if (data?.user) localStorage.setItem("authUser", JSON.stringify(data.user));
    } catch {}

    return normalizeToken(newAccess) || null;
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
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

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

  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) ({ res, data } = await doRequest());
  }

  if (res.status === 401) {
    // Если refresh не сработал, значит реально сессии нет
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    } catch {}

    const msg =
      typeof data === "string"
        ? data
        : data?.message || data?.error || res.statusText;

    throw new Error(`${res.status}: ${msg}`);
  }

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : data?.message || data?.error || res.statusText;

    throw new Error(`${res.status}: ${msg}`);
  }

  return data;
}
