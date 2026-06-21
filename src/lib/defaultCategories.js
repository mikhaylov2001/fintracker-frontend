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

function defaultOrderFor(type) {
  return type === "INCOME" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
}

function isDefaultName(type, name) {
  const canonical = canonicalCategoryName(type, name);
  const key = canonical.toLowerCase();
  return defaultOrderFor(type).some((d) => d.toLowerCase() === key);
}

export function defaultCategoryNames(type) {
  return type === "INCOME" ? [...DEFAULT_INCOME_CATEGORIES] : [...DEFAULT_EXPENSE_CATEGORIES];
}

/** Стандартные категории — в оригинальном порядке UI, свои — в конце */
export function mergeCategoriesInOrder(type, ...lists) {
  const defaultOrder = defaultOrderFor(type);
  const map = new Map();

  for (const list of lists) {
    for (const item of list || []) {
      const raw = String(item?.name || item || "").trim();
      if (!raw) continue;
      const name = canonicalCategoryName(type, raw);
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(
          key,
          typeof item === "string"
            ? { id: null, name, system: isDefaultName(type, name) }
            : { ...item, name, system: item.system || isDefaultName(type, name) }
        );
      }
    }
  }

  const result = [];
  const used = new Set();

  for (const name of defaultOrder) {
    const key = name.toLowerCase();
    if (map.has(key)) {
      result.push(map.get(key));
      used.add(key);
    }
  }

  for (const list of lists) {
    for (const item of list || []) {
      const raw = String(item?.name || item || "").trim();
      if (!raw) continue;
      const name = canonicalCategoryName(type, raw);
      const key = name.toLowerCase();
      if (!used.has(key)) {
        result.push(map.get(key));
        used.add(key);
      }
    }
  }

  return result;
}
