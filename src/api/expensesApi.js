// src/api/expensesApi.js
import { apiFetch } from "./client";

const asAxios = async (path, options) => ({ data: await apiFetch(path, options) });

// ===== NEW (me) =====
export const getMyExpensesByMonth = (year, month, page = 0, size = 50) =>
  asAxios(`/api/expenses/me/month/${year}/${month}?page=${page}&size=${size}`);

export const getMyExpenses = (page = 0, size = 10) =>
  asAxios(`/api/expenses/me?page=${page}&size=${size}`);

// ===== LEGACY (userId) =====
export const getExpensesByMonth = (userId, year, month, page = 0, size = 50) =>
  asAxios(`/api/expenses/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

export const getExpenses = getExpensesByMonth;

// ===== CRUD =====
export const createExpense = (payload) =>
  asAxios("/api/expenses", { method: "POST", body: JSON.stringify(payload) });

export const updateExpense = (expenseId, payload) =>
  asAxios(`/api/expenses/${expenseId}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteExpense = (expenseId) =>
  asAxios(`/api/expenses/${expenseId}`, { method: "DELETE" });
