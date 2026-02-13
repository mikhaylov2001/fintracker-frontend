// src/api/summaryApi.js
import { apiFetch } from "./client";

const asAxios = async (p) => ({ data: await apiFetch(p) });

export const getMyMonthlySummary = (year, month) =>
  asAxios(`/api/summary/me/month/${year}/${month}`);

export const getMyMonthlySummaries = () =>
  asAxios("/api/summary/me/monthly/all");

export const getMyUsedMonths = () =>
  asAxios("/api/summary/me/months");

// legacy
export const getMonthlySummary = (userId, year, month) =>
  asAxios(`/api/summary/${userId}/month/${year}/${month}`);
