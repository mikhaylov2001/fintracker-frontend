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
