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

// ===== именованные функции для старых импортов (БЕЗ заглушек) =====

// !!! ВАЖНО: здесь мы создаём СВОЙ useApiClient, а не используем хук.
// Предполагается, что useApiClient под капотом экспортирует и «сырое» apiClient.
// Если такого нет — эти функции можно совсем удалить, и тогда надо починить импорты в коде.

import { apiClient } from "./client"; // если у тебя нет такого экспорта, УДАЛИ блок ниже целиком

export const getMyMonthlySummary = (year, month) =>
  fetchMyMonthlySummary(apiClient, year, month);

export const getMyMonthlySummaries = () =>
  fetchMyMonthlySummaries(apiClient);

export const getMyUsedMonths = () =>
  fetchMyUsedMonths(apiClient);
