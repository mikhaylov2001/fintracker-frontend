import { buildOptionList } from "./ftUtils";

/** Источник поступления — детализация для отчётов (страница доходов) */
export const DEFAULT_INCOME_SOURCES = [
  "Зарплата",
  "Премия",
  "Рента",
  "Бизнес",
  "Дивиденды",
  "Проценты",
  "Пассивный доход",
  "Другое",
];

export function buildSourceList(...nameSources) {
  return buildOptionList(DEFAULT_INCOME_SOURCES, ...nameSources);
}

export function isDefaultSource(name) {
  const key = String(name || "").trim().toLowerCase();
  return DEFAULT_INCOME_SOURCES.some((s) => s.toLowerCase() === key);
}
