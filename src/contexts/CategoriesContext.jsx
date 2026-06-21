import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/clientFetch";
import { useAuth } from "./AuthContext";
import { defaultCategoryObjects, mergeCategoriesInOrder } from "../lib/defaultCategories";
import { unwrapList } from "../lib/ftUtils";

const CategoriesContext = createContext(null);

function cacheKey(userId) {
  return userId ? `ft_categories_v4_${userId}` : null;
}

function readCache(userId) {
  const key = cacheKey(userId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      income: Array.isArray(parsed.income) ? parsed.income : [],
      expense: Array.isArray(parsed.expense) ? parsed.expense : [],
    };
  } catch {
    return null;
  }
}

function writeCache(userId, income, expense) {
  const key = cacheKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ income, expense, ts: Date.now() }));
  } catch {}
}

function normalizeCategories(raw) {
  const list = unwrapList(raw);
  if (!Array.isArray(list) || list.length === 0) return [];
  return list
    .map((item) => ({
      id: item.id ?? null,
      name: String(item.name || "").trim(),
      system: !!item.system,
    }))
    .filter((item) => item.name);
}

function friendlyError(err) {
  const status = err?.status;
  const msg = String(err?.message || "");
  if (status === 503 || msg.includes("503") || msg.toLowerCase().includes("suspended")) {
    return "Сервер FinTrackerPro недоступен. Включите бэкенд на Render или запустите локально.";
  }
  if (status === 404) {
    return "API категорий не найден. Обновите бэкенд (миграция V11).";
  }
  if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
    return "Нет связи с сервером. Проверьте интернет или запустите бэкенд.";
  }
  return msg || "Не удалось загрузить категории с сервера";
}

export function CategoriesProvider({ children }) {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const userId = user?.id ?? null;

  const [incomeCategories, setIncomeCategories] = useState(() =>
    defaultCategoryObjects("INCOME")
  );
  const [expenseCategories, setExpenseCategories] = useState(() =>
    defaultCategoryObjects("EXPENSE")
  );
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState(null);

  const applyFallback = useCallback((uid) => {
    const defaultsIncome = defaultCategoryObjects("INCOME");
    const defaultsExpense = defaultCategoryObjects("EXPENSE");
    const cached = uid ? readCache(uid) : null;
    if (cached && (cached.income.length || cached.expense.length)) {
      setIncomeCategories(mergeCategoriesInOrder("INCOME", defaultsIncome, cached.income));
      setExpenseCategories(mergeCategoriesInOrder("EXPENSE", defaultsExpense, cached.expense));
      setFromCache(true);
    } else {
      setIncomeCategories(defaultsIncome);
      setExpenseCategories(defaultsExpense);
      setFromCache(false);
    }
    setSynced(false);
  }, []);

  const loadAll = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setIncomeCategories(defaultCategoryObjects("INCOME"));
      setExpenseCategories(defaultCategoryObjects("EXPENSE"));
      setSynced(false);
      setFromCache(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [incData, expData] = await Promise.all([
        apiFetch("/api/categories/me?type=INCOME"),
        apiFetch("/api/categories/me?type=EXPENSE"),
      ]);
      const income = mergeCategoriesInOrder(
        "INCOME",
        defaultCategoryObjects("INCOME"),
        normalizeCategories(incData)
      );
      const expense = mergeCategoriesInOrder(
        "EXPENSE",
        defaultCategoryObjects("EXPENSE"),
        normalizeCategories(expData)
      );
      setIncomeCategories(income);
      setExpenseCategories(expense);
      setSynced(true);
      setFromCache(false);
      writeCache(userId, income, expense);
    } catch (e) {
      applyFallback(userId);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId, applyFallback]);

  useEffect(() => {
    if (authLoading) return;
    loadAll();
  }, [authLoading, isAuthenticated, userId, loadAll]);

  const getCategories = useCallback(
    (type, extraNames = []) => {
      const defaults = defaultCategoryObjects(type);
      const base = type === "INCOME" ? incomeCategories : expenseCategories;
      const extras = (extraNames || []).map((name) => ({ id: null, name, system: false }));
      return mergeCategoriesInOrder(type, defaults, base, extras);
    },
    [incomeCategories, expenseCategories]
  );

  const getCategoryNames = useCallback(
    (type, extraNames = []) => getCategories(type, extraNames).map((c) => c.name),
    [getCategories]
  );

  const addCategory = useCallback(
    async (type, name) => {
      const trimmed = String(name || "").trim().replace(/\s+/g, " ");
      if (!trimmed) throw new Error("Введите название категории");

      const base = type === "INCOME" ? incomeCategories : expenseCategories;
      const existing = base.find(
        (c) => c.name.localeCompare(trimmed, "ru", { sensitivity: "accent" }) === 0
      );
      if (existing) return existing;

      try {
        const data = await apiFetch("/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: trimmed, type }),
        });
        const created = {
          id: data?.id ?? null,
          name: data?.name ?? trimmed,
          system: !!data?.system,
        };
        const apply = (prev) => {
          if (prev.some((c) => c.name.toLowerCase() === created.name.toLowerCase())) return prev;
          return mergeCategoriesInOrder(type, prev, [created]);
        };
        if (type === "INCOME") {
          setIncomeCategories((prev) => {
            const next = apply(prev);
            writeCache(userId, next, expenseCategories);
            return next;
          });
        } else {
          setExpenseCategories((prev) => {
            const next = apply(prev);
            writeCache(userId, incomeCategories, next);
            return next;
          });
        }
        setSynced(true);
        setFromCache(false);
        setError(null);
        return created;
      } catch (e) {
        const created = { id: null, name: trimmed, system: false };
        const apply = (prev) => {
          if (prev.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return prev;
          return mergeCategoriesInOrder(type, prev, [created]);
        };
        if (type === "INCOME") {
          setIncomeCategories(apply);
        } else {
          setExpenseCategories(apply);
        }
        throw new Error(friendlyError(e));
      }
    },
    [incomeCategories, expenseCategories, userId]
  );

  const deleteCategory = useCallback(
    async (type, categoryId) => {
      await apiFetch(`/api/categories/${categoryId}`, { method: "DELETE" });
      const filter = (prev) => prev.filter((c) => c.id !== categoryId);
      if (type === "INCOME") {
        setIncomeCategories((prev) => {
          const next = filter(prev);
          writeCache(userId, next, expenseCategories);
          return next;
        });
      } else {
        setExpenseCategories((prev) => {
          const next = filter(prev);
          writeCache(userId, incomeCategories, next);
          return next;
        });
      }
    },
    [userId, incomeCategories, expenseCategories]
  );

  const value = useMemo(
    () => ({
      loading: loading || authLoading,
      synced,
      fromCache,
      error,
      reload: loadAll,
      getCategories,
      getCategoryNames,
      addCategory,
      deleteCategory,
    }),
    [
      loading,
      authLoading,
      synced,
      fromCache,
      error,
      loadAll,
      getCategories,
      getCategoryNames,
      addCategory,
      deleteCategory,
    ]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}

export function useTransactionCategories(type, { extraNames = [] } = {}) {
  const {
    loading,
    synced,
    fromCache,
    reload,
    getCategories,
    getCategoryNames,
    addCategory,
    deleteCategory,
  } = useCategories();

  const categories = useMemo(
    () => getCategories(type, extraNames),
    [getCategories, type, extraNames]
  );

  const categoryNames = useMemo(
    () => getCategoryNames(type, extraNames),
    [getCategoryNames, type, extraNames]
  );

  return {
    categories,
    categoryNames,
    loading,
    synced,
    fromCache,
    reload,
    addCategory: (name) => addCategory(type, name),
    deleteCategory: (id) => deleteCategory(type, id),
  };
}
