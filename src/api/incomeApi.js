// src/api/incomeApi.js
import { useApiClient } from "./client";

export const fetchMyIncomesByMonth = (apiFetch, year, month, page = 0, size = 50) =>
  apiFetch(`/api/incomes/me/month/${year}/${month}?page=${page}&size=${size}`);

export const fetchMyIncomes = (apiFetch, page = 0, size = 10) =>
  apiFetch(`/api/incomes/me?page=${page}&size=${size}`);

export const fetchIncomesByMonth = (apiFetch, userId, year, month, page = 0, size = 50) =>
  apiFetch(`/api/incomes/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

export const fetchCreateIncome = (apiFetch, payload) =>
  apiFetch("/api/incomes", { method: "POST", body: JSON.stringify(payload) });

export const fetchUpdateIncome = (apiFetch, incomeId, payload) =>
  apiFetch(`/api/incomes/${incomeId}`, { method: "PUT", body: JSON.stringify(payload) });

export const fetchDeleteIncome = (apiFetch, incomeId) =>
  apiFetch(`/api/incomes/${incomeId}`, { method: "DELETE" });

export const useIncomeApi = () => {
  const { apiFetch } = useApiClient();

  const getMyIncomesByMonth = (year, month, page = 0, size = 50) =>
    fetchMyIncomesByMonth(apiFetch, year, month, page, size);

  const getMyIncomes = (page = 0, size = 10) =>
    fetchMyIncomes(apiFetch, page, size);

  const getIncomesByMonth = (userId, year, month, page = 0, size = 50) =>
    fetchIncomesByMonth(apiFetch, userId, year, month, page, size);

  const getIncomes = getIncomesByMonth;

  const createIncome = (payload) => fetchCreateIncome(apiFetch, payload);
  const updateIncome = (incomeId, payload) => fetchUpdateIncome(apiFetch, incomeId, payload);
  const deleteIncome = (incomeId) => fetchDeleteIncome(apiFetch, incomeId);

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
