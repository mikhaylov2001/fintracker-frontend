/** Оригинальный порядок категорий в UI FinTrackerPro (доходы — от активного к пассивному) */
export const DEFAULT_INCOME_CATEGORIES = [
  "Работа",
  "Подработка",
  "Бизнес",
  "Аренда недвижимости",
  "Инвестиции",
  "Пассивный доход",
  "Вклады",
  "Продажа вещей",
  "Подарки",
  "Другое",
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Продукты",
  "Коммунальные услуги",
  "Транспорт",
  "Фитнес",
  "Здоровье",
  "Подписка на ИИ",
  "Образование",
  "Ипотека",
  "Кредит",
  "Рестораны",
  "Дом",
  "Кафе",
  "Налоги",
  "Развлечения",
  "Другое",
];

/** Старые названия с бэкенда → каноническое имя из UI */
const INCOME_NAME_ALIASES = {
  рента: "Аренда недвижимости",
};

export function canonicalCategoryName(type, name) {
  const trimmed = String(name || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (type === "INCOME") {
    return INCOME_NAME_ALIASES[trimmed.toLowerCase()] || trimmed;
  }
  return trimmed;
}

export function defaultCategoryObjects(type) {
  const names = type === "INCOME" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  return names.map((name) => ({ id: null, name, system: true }));
}

export function defaultCategoryNames(type) {
  return type === "INCOME" ? [...DEFAULT_INCOME_CATEGORIES] : [...DEFAULT_EXPENSE_CATEGORIES];
}

function isDefaultName(type, name) {
  const canonical = canonicalCategoryName(type, name);
  const key = canonical.toLowerCase();
  return defaultCategoryNames(type).some((d) => d.toLowerCase() === key);
}

/**
 * Список для UI: сначала стандартные в фиксированном порядке, затем остальные.
 * Источники (API, кэш, операции) не меняют порядок стандартных категорий.
 */
export function buildCategoryList(type, ...nameSources) {
  const defaults = defaultCategoryNames(type);
  const seen = new Set(defaults.map((n) => n.toLowerCase()));
  const result = [...defaults];

  for (const source of nameSources) {
    const list = Array.isArray(source) ? source : [source];
    for (const raw of list) {
      const name = canonicalCategoryName(type, String(raw || "").trim());
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(name);
    }
  }

  return result;
}

export function buildCategoryObjects(type, ...sources) {
  const objectSources = sources.map((source) => {
    const list = Array.isArray(source) ? source : [source];
    return list.map((item) => {
      if (item && typeof item === "object" && item.name) {
        const name = canonicalCategoryName(type, item.name);
        return {
          id: item.id ?? null,
          name,
          system: !!item.system || isDefaultName(type, name),
        };
      }
      const name = canonicalCategoryName(type, String(item || "").trim());
      return { id: null, name, system: isDefaultName(type, name) };
    });
  });

  const names = buildCategoryList(
    type,
    ...objectSources.map((list) => list.map((item) => item.name))
  );

  const byName = new Map();
  for (const list of objectSources) {
    for (const item of list) {
      if (!item?.name) continue;
      const key = item.name.toLowerCase();
      if (!byName.has(key)) byName.set(key, item);
    }
  }

  return names.map((name) => {
    const existing = byName.get(name.toLowerCase());
    if (existing) return existing;
    return { id: null, name, system: isDefaultName(type, name) };
  });
}

/** @deprecated используйте buildCategoryList / buildCategoryObjects */
export function mergeCategoriesInOrder(type, ...lists) {
  return buildCategoryObjects(type, ...lists);
}
