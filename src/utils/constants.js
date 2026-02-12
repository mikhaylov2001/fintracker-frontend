// src/utils/constants.js

const DEV_ORIGIN = "http://localhost:8082";
const normalizeOrigin = (v) => String(v || "").replace(/\/+$/, "");

const origin =
  process.env.REACT_APP_API_BASE_URL
    ? normalizeOrigin(process.env.REACT_APP_API_BASE_URL)
    : (process.env.NODE_ENV === "development" ? DEV_ORIGIN : "");

export const API_BASE_URL = origin ? `${origin}/api` : "";

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.error(
    "REACT_APP_API_BASE_URL is missing for this deployment. " +
      "Set it in Vercel Environment Variables (Production + Preview) and redeploy."
  );
}

// выровнено с твоим AuthContext (authToken/authUser)
export const STORAGE_KEYS = {
  TOKEN: "authToken",
  USER: "authUser",
};

export const API_ENDPOINTS = {
  // Auth (swagger: /api/auth/...) [file:7210]
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
