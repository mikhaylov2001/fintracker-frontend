// src/api/summaryApi.js
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

export const getMyMonthlySummary = (year, month) =>
  api.get(API_ENDPOINTS.MY_SUMMARY_MONTH(year, month));

export const getMyMonthlySummaries = () =>
  api.get(API_ENDPOINTS.MY_SUMMARIES_ALL);

export const getMyUsedMonths = () =>
  api.get(API_ENDPOINTS.MY_USED_MONTHS);

// legacy (если вдруг ещё где-то нужно)
export const getMonthlySummary = (userId, year, month) =>
  api.get(`/summary/${userId}/month/${year}/${month}`);
