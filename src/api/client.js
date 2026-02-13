// src/api/client.js

const TOKEN_KEYS = ["authToken", "token", "accessToken", "jwt"];

const readToken = () => {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
};

const writeToken = (token) => {
  if (!token) return;
  localStorage.setItem("authToken", token);
};

// По умолчанию пусто => все запросы относительные (/api/...)
// Если надо — можно задать REACT_APP_API_BASE_URL вручную (например https://xxx.up.railway.app)
const API_BASE = (process.env.REACT_APP_API_BASE_URL || "").trim();

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  return base ? `${base}${p}` : p;
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
    const url = buildUrl("/api/auth/refresh");

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    const data = await parseBody(res);
    if (!res.ok) return null;

    const newAccess =
      data?.accessToken ||
      data?.token ||
      data?.jwt ||
      data?.access_token ||
      data?.access_token_value;

    if (newAccess) writeToken(newAccess);
    return newAccess || null;
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

    const res = await fetch(url, {
      ...options,
      credentials: options.credentials ?? "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
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
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.href = "/login";
    return;
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
