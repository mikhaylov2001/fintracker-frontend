// src/api/summaryApi.js
import { apiFetch } from "./client";

export const getMyMonthlySummary = (year, month) =>
  apiFetch(`/api/summary/me/month/${year}/${month}`);

export const getMyMonthlySummaries = () =>
  apiFetch("/api/summary/me/monthly/all");

export const getMyUsedMonths = () =>
  apiFetch("/api/summary/me/months");

// legacy (если вдруг ещё где-то нужно)
export const getMonthlySummary = (userId, year, month) =>
  apiFetch(`/api/summary/${userId}/month/${year}/${month}`);
