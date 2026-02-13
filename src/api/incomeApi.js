// src/api/incomeApi.js
import { apiFetch } from "./client";

const asAxios = async (path, options) => ({ data: await apiFetch(path, options) });

// ===== NEW (me) =====
export const getMyIncomesByMonth = (year, month, page = 0, size = 50) =>
  asAxios(`/api/incomes/me/month/${year}/${month}?page=${page}&size=${size}`);

export const getMyIncomes = (page = 0, size = 10) =>
  asAxios(`/api/incomes/me?page=${page}&size=${size}`);

// ===== LEGACY (userId) =====
export const getIncomesByMonth = (userId, year, month, page = 0, size = 50) =>
  asAxios(`/api/incomes/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

export const getIncomes = getIncomesByMonth;

// ===== CRUD =====
export const createIncome = (payload) =>
  asAxios("/api/incomes", { method: "POST", body: JSON.stringify(payload) });

export const updateIncome = (incomeId, payload) =>
  asAxios(`/api/incomes/${incomeId}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteIncome = (incomeId) =>
  asAxios(`/api/incomes/${incomeId}`, { method: "DELETE" });
