import { useCallback, useEffect, useRef, useState } from "react";
import { useCategoriesApi } from "../api/categoriesApi";
import { mapApiError, unwrapList } from "../lib/ftUtils";

const FALLBACK_EXPENSE = [
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

const FALLBACK_INCOME = [
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

function normalizeCategories(raw, fallback) {
  const list = unwrapList(raw?.data ?? raw);
  if (!Array.isArray(list) || list.length === 0) {
    return fallback.map((name) => ({ id: null, name, system: true }));
  }
  return list
    .map((item) => ({
      id: item.id ?? null,
      name: String(item.name || "").trim(),
      system: !!item.system,
    }))
    .filter((item) => item.name);
}

export function useTransactionCategories(type, { enabled = true, onError } = {}) {
  const categoriesApi = useCategoriesApi();
  const apiRef = useRef(categoriesApi);
  apiRef.current = categoriesApi;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const fallback = type === "INCOME" ? FALLBACK_INCOME : FALLBACK_EXPENSE;
  const [categories, setCategories] = useState(() =>
    fallback.map((name) => ({ id: null, name, system: true }))
  );
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) return [];
    try {
      const res = await apiRef.current.getMyCategories(type);
      const next = normalizeCategories(res, fallback);
      setCategories(next);
      return next;
    } catch (e) {
      onErrorRef.current?.(mapApiError(e, "Ошибка загрузки категорий"));
      return [];
    }
  }, [enabled, type, fallback]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await apiRef.current.getMyCategories(type);
        if (!cancelled) {
          setCategories(normalizeCategories(res, fallback));
        }
      } catch (e) {
        if (!cancelled) {
          onErrorRef.current?.(mapApiError(e, "Ошибка загрузки категорий"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, type, fallback]);

  const addCategory = useCallback(
    async (name) => {
      const trimmed = String(name || "").trim().replace(/\s+/g, " ");
      if (!trimmed) {
        throw new Error("Введите название категории");
      }

      const existing = categories.find(
        (c) => c.name.localeCompare(trimmed, "ru", { sensitivity: "accent" }) === 0
      );
      if (existing) return existing;

      const res = await apiRef.current.createCategory({ name: trimmed, type });
      const created = {
        id: res?.data?.id ?? res?.id ?? null,
        name: res?.data?.name ?? res?.name ?? trimmed,
        system: !!(res?.data?.system ?? res?.system),
      };

      setCategories((prev) => {
        const names = new Set(prev.map((c) => c.name.toLowerCase()));
        if (names.has(created.name.toLowerCase())) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ru"));
      });

      return created;
    },
    [categories, type]
  );

  const deleteCategory = useCallback(async (categoryId) => {
    await apiRef.current.deleteCategory(categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  }, []);

  const categoryNames = categories.map((c) => c.name);

  return {
    categories,
    categoryNames,
    loading,
    reload,
    addCategory,
    deleteCategory,
  };
}

export { FALLBACK_EXPENSE, FALLBACK_INCOME };
