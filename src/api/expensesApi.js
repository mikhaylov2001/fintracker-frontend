// src/api/expensesApi.js
import { apiFetch } from './client';

export const getExpensesByMonth = (userId, year, month, page = 0, size = 50) =>
  apiFetch(`/api/expenses/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

export const getExpenses = getExpensesByMonth;

export const createExpense = (payload) =>
  apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(payload) });

export const updateExpense = (expenseId, payload) =>
  apiFetch(`/api/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteExpense = (expenseId) =>
  apiFetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
