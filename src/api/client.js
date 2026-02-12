// src/api/client.js

const readToken = () =>
  localStorage.getItem('authToken') ||
  localStorage.getItem('token') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('jwt');

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) ||
  ''; // если пусто — будет относительный запрос как у тебя сейчас

const buildUrl = (path) => {
  // если передали уже абсолютный URL — не трогаем
  if (/^https?:\/\//i.test(path)) return path;

  // нормализуем, чтобы не было //api
  const base = String(API_BASE || '').replace(/\/+$/, '');
  const p = String(path || '').startsWith('/') ? String(path) : `/${path}`;
  return base ? `${base}${p}` : p;
};

export async function apiFetch(path, options = {}) {
  const token = readToken();
  const url = buildUrl(path);

  const res = await fetch(url, {
    ...options,
    // Важно: если ты НЕ используешь cookie-auth — можно оставить omit.
    // Если у тебя refresh-token в cookie или сессия — поставь 'include'.
    credentials: options.credentials ?? 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;

  if (!res.ok) {
    const msg =
      typeof data === 'string'
        ? data
        : (data?.message || data?.error || res.statusText);

    // добавим полезные детали в ошибку (очень помогает понять iOS проблемы)
    const hint = token ? '' : ' (нет токена в localStorage)';
    throw new Error(`${res.status}: ${msg}${hint}`);
  }

  return data;
}
