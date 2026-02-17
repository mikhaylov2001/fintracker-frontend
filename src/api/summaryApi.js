import { apiFetch } from "./client";

const asAxios = async (path, options) => ({ data: await apiFetch(path, options) });

// Используем только "me" ручки (современный вариант)
export const getMonthlySummary = (_userIdIgnored, year, month) =>
  asAxios(`/api/summary/me/month/${year}/${month}`);

export const getMyMonthlySummary = (year, month) =>
  asAxios(`/api/summary/me/month/${year}/${month}`);

export const getMyMonthlySummaries = () =>
  asAxios("/api/summary/me/monthly/all");

export const getMyUsedMonths = () =>
  asAxios("/api/summary/me/months");
