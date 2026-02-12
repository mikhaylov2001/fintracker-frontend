// src/utils/constants.js

// Локальный backend (только для разработки)
const DEV_API_BASE_URL = "http://localhost:8082";

// Базовый URL твоего backend API
// В production (Vercel) ОБЯЗАТЕЛЬНО должен быть задан REACT_APP_API_BASE_URL.
// Если не задан — оставляем пусто, чтобы сразу было видно ошибку, а не уходить на localhost.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? DEV_API_BASE_URL : "");

// Если переменная не задана — выводим понятную подсказку в консоль
if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.error(
    "REACT_APP_API_BASE_URL is missing for this deployment. " +
      "Set it in Vercel Environment Variables (Production + Preview) and redeploy."
  );
}

// Все эндпоинты в одном месте
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  GOOGLE_AUTH: "/auth/google",

  // Users
  USERS: "/users",
  USER_BY_ID: (id) => `/users/${id}`,

  // Expenses
  EXPENSES: "/expenses",
  EXPENSE_BY_ID: (id) => `/expenses/${id}`,
  USER_EXPENSES: (userId) => `/expenses/user/${userId}`,
  USER_EXPENSES_BY_MONTH: (userId, year, month) =>
    `/expenses/user/${userId}/month/${year}/${month}`,

  // Incomes
  INCOMES: "/incomes",
  INCOME_BY_ID: (id) => `/incomes/${id}`,
  USER_INCOMES: (userId) => `/incomes/user/${userId}`,
  USER_INCOMES_BY_MONTH: (userId, year, month) =>
    `/incomes/user/${userId}/month/${year}/${month}`,

  // Summary
  USER_SUMMARY: (userId) => `/summary/user/${userId}`,
  USER_SUMMARY_MONTH: (userId, year, month) =>
    `/summary/user/${userId}/month/${year}/${month}`,
  USER_SUMMARY_YEAR: (userId, year) => `/summary/user/${userId}/year/${year}`,
};

// Ключи для localStorage
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
};
