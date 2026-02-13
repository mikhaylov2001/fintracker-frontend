// src/utils/constants.js

// Базовый путь всегда относительный.
// Dev: CRA proxy проксирует /api -> http://localhost:8082
// Prod: vercel.json перепишет /api -> Railway
export const API_BASE_URL = "/api";

// выровнено с твоим AuthContext (authToken/authUser)
export const STORAGE_KEYS = {
  TOKEN: "authToken",
  USER: "authUser",
};

export const API_ENDPOINTS = {
  // Auth (swagger: /api/auth/...)
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  GOOGLE_AUTH: "/auth/google",

  // Users
  ME: "/users/me",

  // Expenses
  EXPENSES: "/expenses",
  EXPENSE_BY_ID: (id) => `/expenses/${id}`,
  MY_EXPENSES_BY_MONTH: (year, month) => `/expenses/me/month/${year}/${month}`,

  // Incomes
  INCOMES: "/incomes",
  INCOME_BY_ID: (id) => `/incomes/${id}`,
  MY_INCOMES_BY_MONTH: (year, month) => `/incomes/me/month/${year}/${month}`,

  // Summary
  MY_USED_MONTHS: "/summary/me/months",
  MY_SUMMARIES_ALL: "/summary/me/monthly/all",
  MY_SUMMARY_MONTH: (year, month) => `/summary/me/month/${year}/${month}`,
};
