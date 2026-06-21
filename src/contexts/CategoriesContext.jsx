import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../api/clientFetch";
import { useAuth } from "./AuthContext";
import { unwrapList } from "../lib/ftUtils";

const CategoriesContext = createContext(null);

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

export function CategoriesProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!isAuthenticated) {
      setIncomeCategories([]);
      setExpenseCategories([]);
      setSynced(false);
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
      setIncomeCategories(normalizeCategories(incData));
      setExpenseCategories(normalizeCategories(expData));
      setSynced(true);
    } catch (e) {
      setIncomeCategories([]);
      setExpenseCategories([]);
      setSynced(false);
      setError(e?.message || "Не удалось загрузить категории");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    loadAll();
  }, [authLoading, isAuthenticated, loadAll]);

  const getCategories = useCallback(
    (type) => (type === "INCOME" ? incomeCategories : expenseCategories),
    [incomeCategories, expenseCategories]
  );

  const getCategoryNames = useCallback(
    (type) => getCategories(type).map((c) => c.name),
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
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ru"));
      };

      if (type === "INCOME") {
        setIncomeCategories(apply);
      } else {
        setExpenseCategories(apply);
      }
      setSynced(true);
      setError(null);
      return created;
    },
    [incomeCategories, expenseCategories]
  );

  const deleteCategory = useCallback(async (type, categoryId) => {
    await apiFetch(`/api/categories/${categoryId}`, { method: "DELETE" });
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

export function useTransactionCategories(type, { onError } = {}) {
  const {
    loading,
    synced,
    error,
    reload,
    getCategories,
    getCategoryNames,
    addCategory,
    deleteCategory,
  } = useCategories();
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!loading && !synced && error && !warnedRef.current) {
      warnedRef.current = true;
      onErrorRef.current?.(error);
    }
    if (synced) warnedRef.current = false;
  }, [loading, synced, error]);

  const categories = useMemo(() => getCategories(type), [getCategories, type]);
  const categoryNames = useMemo(() => getCategoryNames(type), [getCategoryNames, type]);

  return {
    categories,
    categoryNames,
    loading,
    synced,
    error,
    reload,
    addCategory: (name) => addCategory(type, name),
    deleteCategory: (id) => deleteCategory(type, id),
  };
}
