const TOKEN_KEYS = ["authToken", "token", "accessToken", "jwt"];

const normalizeToken = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  if (!s) return null;
  return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
};

const readToken = () => {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    const t = normalizeToken(v);
    if (t) return t;
  }
  return null;
};

const writeToken = (token) => {
  const t = normalizeToken(token);
  if (!t) return;
  localStorage.setItem("authToken", t);
};

const API_BASE = String(process.env.REACT_APP_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, ""); // "" в prod

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
    if (data?.user) localStorage.setItem("authUser", JSON.stringify(data.user));

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

    const headers = { ...(options.headers || {}) };

    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    if (!isFormData && options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (token) headers.Authorization = `Bearer ${token}`;

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
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
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
