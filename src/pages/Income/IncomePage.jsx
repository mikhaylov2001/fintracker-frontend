import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TransactionsPage from "../../components/ft/TransactionsPage";
import { useIncomeApi } from "../../api/incomeApi";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useTransactionCategories } from "../../hooks/useTransactionCategories";
import { mapApiError, mapApiRow, normalizeDateOnly, unwrapList } from "../../lib/ftUtils";
import { defaultPeriod, parseYM, resolvePeriodMonths } from "../../lib/periodUtils";

/** Источник поступления — детализация для отчётов */
const SOURCES = [
  "Зарплата",
  "Премия",
  "Рента",
  "Бизнес",
  "Дивиденды",
  "Проценты",
  "Пассивный доход",
  "Другое",
];

export default function IncomePage() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { formatAmount } = useCurrency();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const incomeApi = useIncomeApi();
  const incomeRef = useRef(incomeApi);
  incomeRef.current = incomeApi;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(defaultPeriod);
  const hasLoadedOnce = useRef(false);

  const usedCategoryNames = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))],
    [items]
  );

  const {
    categoryNames,
    loading: categoriesLoading,
    addCategory,
    reload: reloadCategories,
  } = useTransactionCategories("INCOME", {
    extraNames: usedCategoryNames,
    onError: (msg) => toastRef.current.error(msg),
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      hasLoadedOnce.current = false;
      setLoading(false);
      setItems([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!hasLoadedOnce.current) setLoading(true);
      try {
        const months = resolvePeriodMonths(period);
        const results = await Promise.all(
          months.map(async (ym) => {
            const p = parseYM(ym);
            if (!p) return [];
            const res = await incomeRef.current.getMyIncomesByMonth(p.year, p.month, 0, 200);
            return unwrapList(res?.data ?? res).map((x) => mapApiRow(x, "income"));
          })
        );
        if (!cancelled) {
          setItems(results.flat().sort((a, b) => (a.date < b.date ? 1 : -1)));
        }
      } catch (e) {
        if (!cancelled) toastRef.current.error(mapApiError(e, "Ошибка загрузки доходов"));
      } finally {
        if (!cancelled) {
          hasLoadedOnce.current = true;
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, period]);

  const fmt = useCallback((n) => formatAmount(n), [formatAmount]);

  const reload = async () => {
    const months = resolvePeriodMonths(period);
    const results = await Promise.all(
      months.map(async (ym) => {
        const p = parseYM(ym);
        if (!p) return [];
        const res = await incomeRef.current.getMyIncomesByMonth(p.year, p.month, 0, 200);
        return unwrapList(res?.data ?? res).map((x) => mapApiRow(x, "income"));
      })
    );
    setItems(results.flat().sort((a, b) => (a.date < b.date ? 1 : -1)));
  };

  const onSave = async (tx, editing) => {
    const payload = {
      amount: String(tx.amount),
      category: tx.category,
      source: tx.source || "Другое",
      date: normalizeDateOnly(tx.date),
    };
    try {
      if (editing?.id) {
        await incomeRef.current.updateIncome(editing.id, payload);
        toast.success("Доход обновлён");
      } else {
        await incomeRef.current.createIncome(payload);
        toast.success("Доход добавлен");
      }
      await reload();
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка сохранения"));
      throw e;
    }
  };

  const onDelete = async (id) => {
    try {
      await incomeRef.current.deleteIncome(id);
      toast.success("Доход удалён");
      await reload();
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка удаления"));
    }
  };

  if (authLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <TransactionsPage
      title="Доходы"
      subtitle="Учёт всех поступлений: зарплата, бизнес, инвестиции."
      kind="income"
      items={items}
      loading={loading}
      categories={categoryNames}
      categoriesLoading={categoriesLoading}
      onAddCategory={addCategory}
      onCategoriesReload={reloadCategories}
      sources={SOURCES}
      accent="emerald"
      formatAmount={fmt}
      onSave={onSave}
      onDelete={onDelete}
      period={period}
      onPeriodChange={setPeriod}
    />
  );
}