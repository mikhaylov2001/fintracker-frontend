// src/api/summaryApi.js
import { apiFetch } from './client';

// NEW: брать summary для текущего пользователя (user берётся из JWT на бэке)
export const getMyMonthlySummary = (year, month) =>
  apiFetch(`/api/summary/me/month/${year}/${month}`);

// NEW: история/все доступные месяцы (те, где у пользователя есть данные)
export const getMyMonthlySummaries = () =>
  apiFetch(`/api/summary/me/monthly/all`);

// (опционально) если тебе нужен только список месяцев строками
export const getMyUsedMonths = () =>
  apiFetch(`/api/summary/me/months`);

// Старое можно оставить на время миграции, но лучше потом удалить
export const getMonthlySummary = (userId, year, month) =>
  apiFetch(`/api/summary/${userId}/month/${year}/${month}`);
