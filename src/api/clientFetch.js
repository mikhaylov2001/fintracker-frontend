const TOKEN_KEYS = ["authToken", "token", "accessToken", "jwt"];
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
    TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem("authUser");
    sessionStorage.clear();
  } catch {}
};

// ВАЖНО: В настройках Vercel оставь REACT_APP_API_BASE_URL ПУСТЫМ
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
        credentials: "include",
        headers: new Headers({ "Content-Type": "application/json" }),
      });

      const data = await parseBody(res);
      if (!res.ok) return null;

      const newAccess = data?.token || data?.accessToken || data?.jwt || null;
      if (newAccess) writeToken(newAccess);

      return normalizeToken(newAccess) || null;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function isAuthEndpoint(url) {
  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/google") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout")
  );
}

const isEmailEndpoint = (url) => url.includes("/api/account/email");

const isInvalidPasswordEmail401 = (url, resStatus, data) => {
  if (!isEmailEndpoint(url)) return false;
  if (resStatus !== 401) return false;

  const msg =
    (typeof data === "string" ? data : data?.message || data?.error || "") || "";
  const lower = String(msg).toLowerCase();

  // сюда можно добавить data?.code === "INVALID_PASSWORD", если сделаешь на бэке
  return (
    lower.includes("invalid password") ||
    lower.includes("wrong password") ||
    lower.includes("incorrect password") ||
    lower.includes("неверный пароль")
  );
};

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

    const res = await fetch(url, { ...options, credentials: "include", headers });
    const data = await parseBody(res);
    return { res, data };
  };

  let { res, data } = await doRequest();

  // 1) refresh только для НЕ-auth endpoints
  if (!isAuthEndpoint(url) && (res.status === 401 || res.status === 403)) {
    const newToken = await refreshToken();
    if (newToken) {
      ({ res, data } = await doRequest());
    }
  }

  // ✅ спец-кейс: /api/account/email + неверный пароль = НЕ логаутим
  if (isInvalidPasswordEmail401(url, res.status, data)) {
    const msg =
      typeof data === "string"
        ? data
        : data?.message || data?.error || "Неверный пароль";

    const err = new Error(msg);
    err.status = res.status;
    err.code = "INVALID_PASSWORD";
    err.data = data;
    throw err;
  }

  // 2) форс-логаут только если это НЕ login/register/google
  if (!isAuthEndpoint(url) && (res.status === 401 || res.status === 403)) {
    clearAuthData();
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));

    const isLoginPage = window.location.pathname.includes("/login");
    if (!isLoginPage) window.location.replace("/login?expired=true");

    const err = new Error("Session expired");
    err.status = res.status;
    err.code = "SESSION_EXPIRED";
    err.data = data;
    throw err;
  }

  // 3) остальные ошибки — наверх
  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : data?.message || data?.error || res.statusText || `HTTP ${res.status}`;

    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
