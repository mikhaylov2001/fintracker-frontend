// src/api/incomeApi.js
import { useApiClient } from "./client";

export const useIncomeApi = () => {
  const { asAxios } = useApiClient();

  // ===== NEW (me) =====
  const getMyIncomesByMonth = (year, month, page = 0, size = 50) =>
    asAxios(`/api/incomes/me/month/${year}/${month}?page=${page}&size=${size}`);

  const getMyIncomes = (page = 0, size = 10) =>
    asAxios(`/api/incomes/me?page=${page}&size=${size}`);

  // ===== LEGACY (userId) =====
  const getIncomesByMonth = (userId, year, month, page = 0, size = 50) =>
    asAxios(`/api/incomes/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

  const getIncomes = getIncomesByMonth;

  // ===== CRUD =====
  const createIncome = (payload) =>
    asAxios("/api/incomes", { method: "POST", body: JSON.stringify(payload) });

  const updateIncome = (incomeId, payload) =>
    asAxios(`/api/incomes/${incomeId}`, { method: "PUT", body: JSON.stringify(payload) });

  const deleteIncome = (incomeId) =>
    asAxios(`/api/incomes/${incomeId}`, { method: "DELETE" });

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
