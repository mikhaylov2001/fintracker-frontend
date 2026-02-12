// src/api/client.js

const TOKEN_KEYS = ['authToken', 'token', 'accessToken', 'jwt'];

const readToken = () => {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
};

const writeToken = (token) => {
  if (!token) return;
  // пиши в одно место, чтобы не было путаницы
  localStorage.setItem('authToken', token);
};

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) ||
  '';

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = String(API_BASE || '').replace(/\/+$/, '');
  const p = String(path || '').startsWith('/') ? String(path) : `/${path}`;
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
  // чтобы 10 запросов не делали 10 refresh одновременно
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const url = buildUrl('/api/auth/refresh');

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include', // важно: refreshToken/refreshId лежат в cookie [file:7210]
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await parseBody(res);

    if (!res.ok) {
      return null;
    }

    // под разные варианты ответа
    const newAccess =
      data?.accessToken || data?.token || data?.jwt || data?.access_token || data?.access_token_value;

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
      credentials: options.credentials ?? 'include', // куки тоже отправляем (нужно для refresh и часто для logout) [file:7210]
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await parseBody(res);
    return { res, data };
  };

  // 1-я попытка
  let { res, data } = await doRequest();

  // если access истёк — обновляем и повторяем 1 раз
  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      ({ res, data } = await doRequest());
    }
  }

  if (!res.ok) {
    const msg = typeof data === 'string' ? data : (data?.message || data?.error || res.statusText);
    const hint = readToken() ? '' : ' (нет access token в localStorage)';
    throw new Error(`${res.status}: ${msg}${hint}`);
  }

  return data;
}
