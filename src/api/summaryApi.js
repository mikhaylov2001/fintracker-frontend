// src/api/summaryApi.js
import { apiFetch } from './client';

export const getMonthlySummary = (userId, year, month) =>
  apiFetch(`/api/summary/${userId}/month/${year}/${month}`);
