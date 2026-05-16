import React, { useCallback, useEffect, useRef, useState } from "react";
import TransactionsPage from "../../components/ft/TransactionsPage";
import { useExpensesApi } from "../../api/expensesApi";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { mapApiError, mapApiRow, normalizeDateOnly, unwrapList } from "../../lib/ftUtils";
import { defaultPeriod, parseYM, resolvePeriodMonths } from "../../lib/periodUtils";

const CATEGORIES = [
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

export default function ExpensesPage() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { formatAmount } = useCurrency();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const expensesApi = useExpensesApi();
  const expensesRef = useRef(expensesApi);
  expensesRef.current = expensesApi;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(defaultPeriod);
  const hasLoadedOnce = useRef(false);

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
            const res = await expensesRef.current.getMyExpensesByMonth(p.year, p.month, 0, 200);
            return unwrapList(res?.data ?? res).map((x) => mapApiRow(x, "expense"));
          })
        );
        if (!cancelled) {
          setItems(results.flat().sort((a, b) => (a.date < b.date ? 1 : -1)));
        }
      } catch (e) {
        if (!cancelled) toastRef.current.error(mapApiError(e, "Ошибка загрузки расходов"));
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
        const res = await expensesRef.current.getMyExpensesByMonth(p.year, p.month, 0, 200);
        return unwrapList(res?.data ?? res).map((x) => mapApiRow(x, "expense"));
      })
    );
    setItems(results.flat().sort((a, b) => (a.date < b.date ? 1 : -1)));
  };

  const onSave = async (tx, editing) => {
    const payload = {
      amount: String(tx.amount),
      category: tx.category,
      // Бэкенд требует @NotBlank description — подставляем категорию, если поле пустое
      description: (tx.comment || "").trim() || tx.category || "Расход",
      date: normalizeDateOnly(tx.date),
    };
    try {
      if (editing?.id) {
        await expensesRef.current.updateExpense(editing.id, payload);
        toast.success("Расход обновлён");
      } else {
        await expensesRef.current.createExpense(payload);
        toast.success("Расход добавлен");
      }
      await reload();
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка сохранения"));
      throw e;
    }
  };

  const onDelete = async (id) => {
    try {
      await expensesRef.current.deleteExpense(id);
      toast.success("Расход удалён");
      await reload();
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка удаления"));
    }
  };

  if (authLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <TransactionsPage
      title="Расходы"
      subtitle="Контролируйте, на что уходят деньги каждый месяц."
      kind="expense"
      items={items}
      loading={loading}
      categories={CATEGORIES}
      accent="warning"
      formatAmount={fmt}
      onSave={onSave}
      onDelete={onDelete}
      period={period}
      onPeriodChange={setPeriod}
    />
  );
}
