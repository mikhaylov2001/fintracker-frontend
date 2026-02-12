// src/utils/monthHistoryStorage.js
// История месяцев теперь живёт на бэке (/api/summary/me/monthly/all)
// Этот файл оставлен как совместимость, чтобы старые импорты не ломали сборку.

export const MONTH_HISTORY_EVENT_NAME = 'fintracker:monthHistoryUpdated';

export const loadMonthHistory = () => [];
export const syncMonthHistory = async () => [];
export const refreshMonthSnapshot = async () => [];
