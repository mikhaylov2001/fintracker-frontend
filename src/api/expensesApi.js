// src/api/expensesApi.js
import { apiFetch } from './client';

// ===== NEW (me) =====
export const getMyExpensesByMonth = (year, month, page = 0, size = 50) =>
  apiFetch(`/api/expenses/me/month/${year}/${month}?page=${page}&size=${size}`);

export const getMyExpenses = (page = 0, size = 10) =>
  apiFetch(`/api/expenses/me?page=${page}&size=${size}`);

// ===== LEGACY (userId) =====
export const getExpensesByMonth = (userId, year, month, page = 0, size = 50) =>
  apiFetch(`/api/expenses/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

export const getExpenses = getExpensesByMonth;

// ===== CRUD =====
export const createExpense = (payload) =>
  apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(payload) });

export const updateExpense = (expenseId, payload) =>
  apiFetch(`/api/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteExpense = (expenseId) =>
  apiFetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
