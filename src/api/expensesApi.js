// src/api/expensesApi.js
import { useApiClient } from "./client";

export const useExpensesApi = () => {
  const { asAxios } = useApiClient();

  // ===== NEW (me) =====
  const getMyExpensesByMonth = (year, month, page = 0, size = 50) =>
    asAxios(`/api/expenses/me/month/${year}/${month}?page=${page}&size=${size}`);

  const getMyExpenses = (page = 0, size = 10) =>
    asAxios(`/api/expenses/me?page=${page}&size=${size}`);

  // ===== LEGACY (userId) =====
  const getExpensesByMonth = (userId, year, month, page = 0, size = 50) =>
    asAxios(`/api/expenses/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

  const getExpenses = getExpensesByMonth;

  // ===== CRUD =====
  const createExpense = (payload) =>
    asAxios("/api/expenses", { method: "POST", body: JSON.stringify(payload) });

  const updateExpense = (expenseId, payload) =>
    asAxios(`/api/expenses/${expenseId}`, { method: "PUT", body: JSON.stringify(payload) });

  const deleteExpense = (expenseId) =>
    asAxios(`/api/expenses/${expenseId}`, { method: "DELETE" });

  return {
    getMyExpensesByMonth,
    getMyExpenses,
    getExpensesByMonth,
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
