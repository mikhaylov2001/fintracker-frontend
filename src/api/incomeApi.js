// src/api/incomeApi.js
import { useApiClient } from "./client";

// ===== чистые функции без хуков =====
export const fetchMyIncomesByMonth = (asAxios, year, month, page = 0, size = 50) =>
  asAxios(`/api/incomes/me/month/${year}/${month}?page=${page}&size=${size}`);

export const fetchMyIncomes = (asAxios, page = 0, size = 10) =>
  asAxios(`/api/incomes/me?page=${page}&size=${size}`);

export const fetchIncomesByMonth = (asAxios, userId, year, month, page = 0, size = 50) =>
  asAxios(`/api/incomes/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

export const fetchCreateIncome = (asAxios, payload) =>
  asAxios("/api/incomes", { method: "POST", body: JSON.stringify(payload) });

export const fetchUpdateIncome = (asAxios, incomeId, payload) =>
  asAxios(`/api/incomes/${incomeId}`, { method: "PUT", body: JSON.stringify(payload) });

export const fetchDeleteIncome = (asAxios, incomeId) =>
  asAxios(`/api/incomes/${incomeId}`, { method: "DELETE" });

// ===== хук =====
export const useIncomeApi = () => {
  const { asAxios } = useApiClient();

  const getMyIncomesByMonth = (year, month, page = 0, size = 50) =>
    fetchMyIncomesByMonth(asAxios, year, month, page, size);

  const getMyIncomes = (page = 0, size = 10) =>
    fetchMyIncomes(asAxios, page, size);

  const getIncomesByMonth = (userId, year, month, page = 0, size = 50) =>
    fetchIncomesByMonth(asAxios, userId, year, month, page, size);

  const getIncomes = getIncomesByMonth;

  const createIncome = (payload) => fetchCreateIncome(asAxios, payload);

  const updateIncome = (incomeId, payload) =>
    fetchUpdateIncome(asAxios, incomeId, payload);

  const deleteIncome = (incomeId) =>
    fetchDeleteIncome(asAxios, incomeId);

  return {
    getMyIncomesByMonth,
    getMyIncomes,
    getIncomesByMonth,
    getIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
  };
};
