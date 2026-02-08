// Базовый URL твоего backend API
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8082";

// Все эндпоинты в одном месте (чтобы не писать строки руками везде)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GOOGLE_AUTH: '/auth/google',

  // Users
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,

  // Expenses
  EXPENSES: '/expenses',
  EXPENSE_BY_ID: (id) => `/expenses/${id}`,
  USER_EXPENSES: (userId) => `/expenses/user/${userId}`,
  USER_EXPENSES_BY_MONTH: (userId, year, month) =>
    `/expenses/user/${userId}/month/${year}/${month}`,

  // Incomes
  INCOMES: '/incomes',
  INCOME_BY_ID: (id) => `/incomes/${id}`,
  USER_INCOMES: (userId) => `/incomes/user/${userId}`,
  USER_INCOMES_BY_MONTH: (userId, year, month) =>
    `/incomes/user/${userId}/month/${year}/${month}`,

  // Summary
  USER_SUMMARY: (userId) => `/summary/user/${userId}`,
  USER_SUMMARY_MONTH: (userId, year, month) =>
    `/summary/user/${userId}/month/${year}/${month}`,
  USER_SUMMARY_YEAR: (userId, year) =>
    `/summary/user/${userId}/year/${year}`,
};

// Ключи для localStorage (храним токен и юзера)
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};
