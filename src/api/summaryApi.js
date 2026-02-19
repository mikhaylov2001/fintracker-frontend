// src/api/summaryApi.js
import { useApiClient } from "./client";

// ===== чистые функции без хуков (для прямого вызова с asAxios) =====
export const fetchMyMonthlySummaries = (asAxios) =>
  asAxios("/api/summary/me/monthly/all");

export const fetchMyUsedMonths = (asAxios) =>
  asAxios("/api/summary/me/months");

export const fetchMyMonthlySummary = (asAxios, year, month) =>
  asAxios(`/api/summary/me/month/${year}/${month}`);

// старый сигнатурой по userId (userId игнорируется, чтобы не ломать существующий код)
export const fetchMonthlySummary = (asAxios, _userIdIgnored, year, month) =>
  asAxios(`/api/summary/me/month/${year}/${month}`);

// ===== чистые «get*» для совместимости с существующими импортами =====
// Используются в не‑React коде: передаём asAxios явно
export const getMyMonthlySummaries = (asAxios) =>
  fetchMyMonthlySummaries(asAxios);

export const getMyUsedMonths = (asAxios) =>
  fetchMyUsedMonths(asAxios);

export const getMyMonthlySummary = (asAxios, year, month) =>
  fetchMyMonthlySummary(asAxios, year, month);

// ===== хук для React‑компонентов =====
export const useSummaryApi = () => {
  const { asAxios } = useApiClient();

  const getMonthlySummary = (_userIdIgnored, year, month) =>
    fetchMonthlySummary(asAxios, _userIdIgnored, year, month);

  const getMyMonthlySummaryHook = (year, month) =>
    fetchMyMonthlySummary(asAxios, year, month);

  const getMyMonthlySummariesHook = () =>
    fetchMyMonthlySummaries(asAxios);

  const getMyUsedMonthsHook = () =>
    fetchMyUsedMonths(asAxios);

  return {
    getMonthlySummary,
    getMyMonthlySummary: getMyMonthlySummaryHook,
    getMyMonthlySummaries: getMyMonthlySummariesHook,
    getMyUsedMonths: getMyUsedMonthsHook,
  };
};
