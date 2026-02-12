// src/api/incomeApi.js
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

// ===== NEW (me) =====
export const getMyIncomesByMonth = (year, month, page = 0, size = 50) =>
  api.get(API_ENDPOINTS.MY_INCOMES_BY_MONTH(year, month), { params: { page, size } });

export const getMyIncomes = (page = 0, size = 10) =>
  api.get(API_ENDPOINTS.MY_INCOMES, { params: { page, size } });

// ===== LEGACY (userId) =====
export const getIncomesByMonth = (userId, year, month, page = 0, size = 50) =>
  api.get(API_ENDPOINTS.USER_INCOMES_BY_MONTH(userId, year, month), { params: { page, size } });

export const getIncomes = getIncomesByMonth;

// ===== CRUD =====
export const createIncome = (payload) => api.post(API_ENDPOINTS.INCOMES, payload);

export const updateIncome = (incomeId, payload) =>
  api.put(API_ENDPOINTS.INCOME_BY_ID(incomeId), payload);

export const deleteIncome = (incomeId) =>
  api.delete(API_ENDPOINTS.INCOME_BY_ID(incomeId));
