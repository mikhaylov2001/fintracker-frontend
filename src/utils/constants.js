// src/utils/constants.js

// Локальный backend (только для разработки)
const DEV_ORIGIN = "http://localhost:8082";

// В prod/preview на Vercel задай REACT_APP_API_BASE_URL = "https://<your-domain>"
// Здесь мы всегда добавляем "/api", потому что swagger у бэка начинается с /api/... [file:7210]
const normalizeOrigin = (v) => String(v || "").replace(/\/+$/, "");
const origin =
  process.env.REACT_APP_API_BASE_URL
    ? normalizeOrigin(process.env.REACT_APP_API_BASE_URL)
    : (process.env.NODE_ENV === "development" ? DEV_ORIGIN : "");

// Базовый URL backend API (включая /api)
export const API_BASE_URL = origin ? `${origin}/api` : "";

// Если переменная не задана — выводим понятную подсказку в консоль
if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.error(
    "REACT_APP_API_BASE_URL is missing for this deployment. " +
      "Set it in Vercel Environment Variables (Production + Preview) and redeploy."
  );
}

// Ключи для localStorage — выровнены с твоим AuthContext (authToken/authUser). [file:7228]
export const STORAGE_KEYS = {
  TOKEN: "authToken",
  USER: "authUser",
};

// Все эндпоинты в одном месте (предпочтительно /me)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  GOOGLE_AUTH: "/auth/google",

  // Users
  ME: "/users/me",
  USERS: "/users",
  USER_BY_ID: (id) => `/users/${id}`,

  // Expenses (new /me)
  EXPENSES: "/expenses",
  EXPENSE_BY_ID: (id) => `/expenses/${id}`,
  MY_EXPENSES: "/expenses/me",
  MY_EXPENSES_BY_MONTH: (year, month) => `/expenses/me/month/${year}/${month}`,

  // Incomes (new /me)
  INCOMES: "/incomes",
  INCOME_BY_ID: (id) => `/incomes/${id}`,
  MY_INCOMES: "/incomes/me",
  MY_INCOMES_BY_MONTH: (year, month) => `/incomes/me/month/${year}/${month}`,

  // Summary (new /me)
  MY_USED_MONTHS: "/summary/me/months",
  MY_SUMMARIES_ALL: "/summary/me/monthly/all",
  MY_SUMMARY_MONTH: (year, month) => `/summary/me/month/${year}/${month}`,

  // Legacy (если где-то осталось в коде; можно удалить позже)
  USER_EXPENSES: (userId) => `/expenses/user/${userId}`,
  USER_EXPENSES_BY_MONTH: (userId, year, month) =>
    `/expenses/user/${userId}/month/${year}/${month}`,
  USER_INCOMES: (userId) => `/incomes/user/${userId}`,
  USER_INCOMES_BY_MONTH: (userId, year, month) =>
    `/incomes/user/${userId}/month/${year}/${month}`,
  USER_SUMMARY_MONTH: (userId, year, month) =>
    `/summary/${userId}/month/${year}/${month}`,
  USER_SUMMARIES_ALL: (userId) => `/summary/${userId}/monthly/all`,
  USER_USED_MONTHS: (userId) => `/summary/${userId}/months`,
};
