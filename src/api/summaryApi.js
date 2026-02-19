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

// ===== хук для React‑компонентов =====
export const useSummaryApi = () => {
  const { asAxios } = useApiClient();

  const getMonthlySummary = (_userIdIgnored, year, month) =>
    fetchMonthlySummary(asAxios, _userIdIgnored, year, month);

  const getMyMonthlySummary = (year, month) =>
    fetchMyMonthlySummary(asAxios, year, month);

  const getMyMonthlySummaries = () =>
    fetchMyMonthlySummaries(asAxios);

  const getMyUsedMonths = () =>
    fetchMyUsedMonths(asAxios);

  return {
    getMonthlySummary,
    getMyMonthlySummary,
    getMyMonthlySummaries,
    getMyUsedMonths,
  };
};

/**
 * ===== совместимость со старыми импортами =====
 * Поддерживаются старые импорты:
 *   import {
 *     getMyMonthlySummary,
 *     getMyMonthlySummaries,
 *     getMyUsedMonths,
 *   } from "../../api/summaryApi";
 *
 * Эти функции теперь — заглушки, чтобы сборка не падала.
 * В рабочем коде переходи на:
 *   const { getMyMonthlySummary, getMyMonthlySummaries, getMyUsedMonths } = useSummaryApi();
 */

export const getMyMonthlySummary = () => {
  throw new Error(
    'getMyMonthlySummary больше не вызывается напрямую. Используйте useSummaryApi(): const { getMyMonthlySummary } = useSummaryApi();'
  );
};

export const getMyMonthlySummaries = () => {
  throw new Error(
    'getMyMonthlySummaries больше не вызывается напрямую. Используйте useSummaryApi(): const { getMyMonthlySummaries } = useSummaryApi();'
  );
};

export const getMyUsedMonths = () => {
  throw new Error(
    'getMyUsedMonths больше не вызывается напрямую. Используйте useSummaryApi(): const { getMyUsedMonths } = useSummaryApi();'
  );
};
