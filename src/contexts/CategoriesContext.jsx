import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCategoriesApi } from "../api/categoriesApi";
import { useAuth } from "./AuthContext";
import { unwrapList } from "../lib/ftUtils";

const CategoriesContext = createContext(null);

function normalizeCategories(raw) {
  const list = unwrapList(raw?.data ?? raw);
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      id: item.id ?? null,
      name: String(item.name || "").trim(),
      system: !!item.system,
    }))
    .filter((item) => item.name);
}

function mergeNames(categories, extraNames = []) {
  const map = new Map();
  categories.forEach((c) => map.set(c.name.toLowerCase(), c));
  extraNames.forEach((name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { id: null, name: trimmed, system: false });
    }
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export function CategoriesProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const categoriesApi = useCategoriesApi();
  const apiRef = useRef(categoriesApi);
  apiRef.current = categoriesApi;

  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  const loadAll = useCallback(async () => {
    if (!isAuthenticated) {
      setIncomeCategories([]);
      setExpenseCategories([]);
      setSynced(false);
      return;
    }

    setLoading(true);
    try {
      const [incRes, expRes] = await Promise.all([
        apiRef.current.getMyCategories("INCOME"),
        apiRef.current.getMyCategories("EXPENSE"),
      ]);
      setIncomeCategories(normalizeCategories(incRes));
      setExpenseCategories(normalizeCategories(expRes));
      setSynced(true);
    } catch {
      setIncomeCategories([]);
      setExpenseCategories([]);
      setSynced(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    loadAll();
  }, [authLoading, isAuthenticated, loadAll]);

  const getCategories = useCallback(
    (type, extraNames = []) => {
      const base = type === "INCOME" ? incomeCategories : expenseCategories;
      return mergeNames(base, extraNames);
    },
    [incomeCategories, expenseCategories]
  );

  const getCategoryNames = useCallback(
    (type, extraNames = []) => getCategories(type, extraNames).map((c) => c.name),
    [getCategories]
  );

  const addCategory = useCallback(async (type, name) => {
    const trimmed = String(name || "").trim().replace(/\s+/g, " ");
    if (!trimmed) throw new Error("Введите название категории");

    const base = type === "INCOME" ? incomeCategories : expenseCategories;
    const existing = base.find(
      (c) => c.name.localeCompare(trimmed, "ru", { sensitivity: "accent" }) === 0
    );
    if (existing) return existing;

    const res = await apiRef.current.createCategory({ name: trimmed, type });
    const created = {
      id: res?.data?.id ?? res?.id ?? null,
      name: res?.data?.name ?? res?.name ?? trimmed,
      system: !!(res?.data?.system ?? res?.system),
    };

    const apply = (prev) => {
      if (prev.some((c) => c.name.toLowerCase() === created.name.toLowerCase())) return prev;
      return [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    };

    if (type === "INCOME") {
      setIncomeCategories(apply);
    } else {
      setExpenseCategories(apply);
    }
    setSynced(true);
    return created;
  }, [incomeCategories, expenseCategories]);

  const deleteCategory = useCallback(async (type, categoryId) => {
    await apiRef.current.deleteCategory(categoryId);
    const filter = (prev) => prev.filter((c) => c.id !== categoryId);
    if (type === "INCOME") {
      setIncomeCategories(filter);
    } else {
      setExpenseCategories(filter);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading: loading || authLoading,
      synced,
      reload: loadAll,
      getCategories,
      getCategoryNames,
      addCategory,
      deleteCategory,
    }),
    [loading, authLoading, synced, loadAll, getCategories, getCategoryNames, addCategory, deleteCategory]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}

export function useTransactionCategories(type, { extraNames = [], onError } = {}) {
  const { loading, synced, reload, getCategories, getCategoryNames, addCategory, deleteCategory } =
    useCategories();
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!loading && !synced && !warnedRef.current) {
      warnedRef.current = true;
      onErrorRef.current?.("Не удалось загрузить категории с сервера. Показаны категории из ваших операций.");
    }
    if (synced) warnedRef.current = false;
  }, [loading, synced]);

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
    reload,
    addCategory: (name) => addCategory(type, name),
    deleteCategory: (id) => deleteCategory(type, id),
  };
}
