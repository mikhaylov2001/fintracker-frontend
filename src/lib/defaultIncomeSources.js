import { buildOptionList } from "./optionList";

/** Источник поступления — как на странице «Доходы» (commit 4728742, «Рента» вместо «Аренда недвижимости») */
export const DEFAULT_INCOME_SOURCES = [
  "Зарплата",
  "Премия",
  "Бизнес",
  "Рента",
  "Дивиденды",
  "Проценты",
  "Пассивный доход",
  "Другое",
];

const SOURCE_NAME_ALIASES = {
  "аренда недвижимости": "Рента",
};

export function canonicalSourceName(name) {
  const trimmed = String(name || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return SOURCE_NAME_ALIASES[trimmed.toLowerCase()] || trimmed;
}

export function buildSourceList(...nameSources) {
  const canonicalExtras = nameSources.map((list) => {
    const items = Array.isArray(list) ? list : [list];
    return items.map((item) => canonicalSourceName(item));
  });
  return buildOptionList(DEFAULT_INCOME_SOURCES, ...canonicalExtras);
}

export function isDefaultSource(name) {
  const canonical = canonicalSourceName(name);
  const key = canonical.toLowerCase();
  return DEFAULT_INCOME_SOURCES.some((s) => s.toLowerCase() === key);
}
