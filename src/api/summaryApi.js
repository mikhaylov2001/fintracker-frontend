// src/api/summaryApi.js
import { useApiClient } from "./client";

export const fetchMyMonthlySummaries = (apiFetch) =>
  apiFetch("/api/summary/me/monthly/all");

export const fetchMyUsedMonths = (apiFetch) =>
  apiFetch("/api/summary/me/months");

export const fetchMyMonthlySummary = (apiFetch, year, month) =>
  apiFetch(`/api/summary/me/month/${year}/${month}`);

export const fetchMonthlySummary = (apiFetch, _userIdIgnored, year, month) =>
  apiFetch(`/api/summary/me/month/${year}/${month}`);

export const getMyMonthlySummaries = (apiFetch) =>
  fetchMyMonthlySummaries(apiFetch);

export const getMyUsedMonths = (apiFetch) =>
  fetchMyUsedMonths(apiFetch);

export const getMyMonthlySummary = (apiFetch, year, month) =>
  fetchMyMonthlySummary(apiFetch, year, month);

export const useSummaryApi = () => {
  const { apiFetch } = useApiClient();

  const getMonthlySummary = (_userIdIgnored, year, month) =>
    fetchMonthlySummary(apiFetch, _userIdIgnored, year, month);

  const getMyMonthlySummaryHook = (year, month) =>
    fetchMyMonthlySummary(apiFetch, year, month);

  const getMyMonthlySummariesHook = () =>
    fetchMyMonthlySummaries(apiFetch);

  const getMyUsedMonthsHook = () =>
    fetchMyUsedMonths(apiFetch);

  return {
    getMonthlySummary,
    getMyMonthlySummary: getMyMonthlySummaryHook,
    getMyMonthlySummaries: getMyMonthlySummariesHook,
    getMyUsedMonths: getMyUsedMonthsHook,
  };
};
