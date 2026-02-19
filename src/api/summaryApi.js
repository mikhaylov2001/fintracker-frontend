// src/api/summaryApi.js
import { useApiClient } from "./client";

export const useSummaryApi = () => {
  const { asAxios } = useApiClient();

  // Используем только "me" ручки (современный вариант)
  const getMonthlySummary = (_userIdIgnored, year, month) =>
    asAxios(`/api/summary/me/month/${year}/${month}`);

  const getMyMonthlySummary = (year, month) =>
    asAxios(`/api/summary/me/month/${year}/${month}`);

  const getMyMonthlySummaries = () =>
    asAxios("/api/summary/me/monthly/all");

  const getMyUsedMonths = () =>
    asAxios("/api/summary/me/months");

  return {
    getMonthlySummary,
    getMyMonthlySummary,
    getMyMonthlySummaries,
    getMyUsedMonths,
  };
};
