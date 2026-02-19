// src/api/expensesApi.js
import { useApiClient } from "./client";

// ===== чистые функции без хуков (для прямого вызова с asAxios) =====
export const fetchMyExpensesByMonth = (asAxios, year, month, page = 0, size = 50) =>
  asAxios(`/api/expenses/me/month/${year}/${month}?page=${page}&size=${size}`);

export const fetchMyExpenses = (asAxios, page = 0, size = 10) =>
  asAxios(`/api/expenses/me?page=${page}&size=${size}`);

export const fetchExpensesByMonth = (asAxios, userId, year, month, page = 0, size = 50) =>
  asAxios(`/api/expenses/user/${userId}/month/${year}/${month}?page=${page}&size=${size}`);

export const fetchCreateExpense = (asAxios, payload) =>
  asAxios("/api/expenses", { method: "POST", body: JSON.stringify(payload) });

export const fetchUpdateExpense = (asAxios, expenseId, payload) =>
  asAxios(`/api/expenses/${expenseId}`, { method: "PUT", body: JSON.stringify(payload) });

export const fetchDeleteExpense = (asAxios, expenseId) =>
  asAxios(`/api/expenses/${expenseId}`, { method: "DELETE" });

// ===== хук для использования в React‑компонентах =====
export const useExpensesApi = () => {
  const { asAxios } = useApiClient();

  const getMyExpensesByMonth = (year, month, page = 0, size = 50) =>
    fetchMyExpensesByMonth(asAxios, year, month, page, size);

  const getMyExpenses = (page = 0, size = 10) =>
    fetchMyExpenses(asAxios, page, size);

  const getExpensesByMonth = (userId, year, month, page = 0, size = 50) =>
    fetchExpensesByMonth(asAxios, userId, year, month, page, size);

  const getExpenses = getExpensesByMonth;

  const createExpense = (payload) => fetchCreateExpense(asAxios, payload);

  const updateExpense = (expenseId, payload) =>
    fetchUpdateExpense(asAxios, expenseId, payload);

  const deleteExpense = (expenseId) =>
    fetchDeleteExpense(asAxios, expenseId);

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
