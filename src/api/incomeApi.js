// src/api/incomeApi.js
import { apiFetch } from './client';


export const getIncomesByMonth = (userId, year, month, page = 0, size = 50) =>
  apiFetch(`/api/incomes/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

export const getIncomes = getIncomesByMonth;

export const createIncome = (payload) =>
  apiFetch('/api/incomes', { method: 'POST', body: JSON.stringify(payload) });

export const updateIncome = (incomeId, payload) =>
  apiFetch(`/api/incomes/${incomeId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteIncome = (incomeId) =>
  apiFetch(`/api/incomes/${incomeId}`, { method: 'DELETE' });
