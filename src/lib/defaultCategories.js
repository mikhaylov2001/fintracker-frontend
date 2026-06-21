/** Совпадает с CategoryService.java на бэкенде */
export const DEFAULT_INCOME_CATEGORIES = [
  "Работа",
  "Вклады",
  "Рента",
  "Бизнес",
  "Инвестиции",
  "Пассивный доход",
  "Подработка",
  "Продажа вещей",
  "Подарки",
  "Другое",
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Продукты",
  "Коммунальные услуги",
  "Подписка на ИИ",
  "Фитнес",
  "Здоровье",
  "Транспорт",
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

export function defaultCategoryObjects(type) {
  const names = type === "INCOME" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  return names.map((name) => ({ id: null, name, system: true }));
}

function defaultOrderFor(type) {
  return type === "INCOME" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
}

function isDefaultName(type, name) {
  const key = String(name || "").trim().toLowerCase();
  return defaultOrderFor(type).some((d) => d.toLowerCase() === key);
}

export function defaultCategoryNames(type) {
  return type === "INCOME" ? [...DEFAULT_INCOME_CATEGORIES] : [...DEFAULT_EXPENSE_CATEGORIES];
}

/** Стандартные категории — в порядке бэкенда, свои — в конце */
export function mergeCategoriesInOrder(type, ...lists) {
  const defaultOrder = defaultOrderFor(type);
  const map = new Map();

  for (const list of lists) {
    for (const item of list || []) {
      const name = String(item?.name || item || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(
          key,
          typeof item === "string"
            ? { id: null, name, system: isDefaultName(type, name) }
            : item
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
      const name = String(item?.name || item || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!used.has(key)) {
        result.push(map.get(key));
        used.add(key);
      }
    }
  }

  return result;
}
