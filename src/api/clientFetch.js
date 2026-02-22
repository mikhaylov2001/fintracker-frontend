const TOKEN_KEYS = ["authToken", "token", "accessToken", "jwt"];
export const AUTH_LOGOUT_EVENT = "app_force_logout";

const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
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
    sessionStorage.clear();
  } catch {}
};

// ВАЖНО: В настройках Vercel оставь REACT_APP_API_BASE_URL ПУСТЫМ
const API_BASE = String(process.env.REACT_APP_API_BASE_URL || "").trim().replace(/\/+$/, "");

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const p = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  // Если API_BASE пустой, вернет относительный путь (например, "/api/auth/login")
  return API_BASE ? `${API_BASE}${p}` : p;
};

const parseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
};

let refreshPromise = null;

async function refreshToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      // Запрос идет на "/api/auth/refresh", который Vercel проксирует на Railway
      const res = await fetch(buildUrl("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: new Headers({ "Content-Type": "application/json" }),
      });

      const data = await parseBody(res);

      if (!res.ok) return null;

      const newAccess = data?.token || data?.accessToken || data?.jwt || null;
      if (newAccess) {
        writeToken(newAccess);
      }
      return normalizeToken(newAccess) || null;
    } catch (e) {
      return null;
    }
  })();
  try { return await refreshPromise; } finally { refreshPromise = null; }
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);
  const doRequest = async () => {
    if (refreshPromise) await refreshPromise;

    const token = readToken();
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData) && options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // credentials: "include" заставляет браузер отправлять куки
    const res = await fetch(url, { ...options, credentials: "include", headers });
    const data = await parseBody(res);
    return { res, data };
  };

  let { res, data } = await doRequest();

  // Если получили 401/403, пробуем обновить токен один раз
  if (res.status === 401 || res.status === 403) {
    const newToken = await refreshToken();
    if (newToken) {
      ({ res, data } = await doRequest());
    }
  }

  // Если всё еще 401/403 — разлогиниваем
  if (res.status === 401 || res.status === 403) {
    clearAuthData();
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login?expired=true');
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || data?.error || res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }
  return data;
}