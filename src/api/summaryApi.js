// src/api/summaryApi.js
import { apiFetch } from "./client";

const asAxios = async (path, options) => ({ data: await apiFetch(path, options) });

export const getMyMonthlySummary = (year, month) =>
  asAxios(`/api/summary/me/month/${year}/${month}`);

export const getMyMonthlySummaries = () =>
  asAxios("/api/summary/me/monthly/all");

export const getMyUsedMonths = () =>
  asAxios("/api/summary/me/months");

// legacy (если вдруг ещё где-то нужно)
export const getMonthlySummary = (userId, year, month) =>
  asAxios(`/api/summary/${userId}/month/${year}/${month}`);
