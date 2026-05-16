import React, { useCallback, useEffect, useRef, useState } from "react";
import TransactionsPage from "../../components/ft/TransactionsPage";
import { useExpensesApi } from "../../api/expensesApi";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { mapApiError, mapApiRow, normalizeDateOnly, unwrapList } from "../../lib/ftUtils";

const CATEGORIES = [
  "Продукты",
  "Коммунальные услуги",
  "Транспорт",
  "Фитнес",
  "Здоровье",
  "Подписки",
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
  const { formatAmount } = useCurrency();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const expensesApi = useExpensesApi();
  const expensesRef = useRef(expensesApi);
  expensesRef.current = expensesApi;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      setItems([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const res = await expensesRef.current.getMyExpensesByMonth(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          200
        );
        if (!cancelled) {
          const raw = unwrapList(res?.data ?? res);
          setItems(raw.map((x) => mapApiRow(x, "expense")));
        }
      } catch (e) {
        if (!cancelled) toast.error(mapApiError(e, "Ошибка загрузки расходов"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, toast]);

  const fmt = useCallback((n) => formatAmount(n), [formatAmount]);

  const reload = async () => {
    const now = new Date();
    const res = await expensesRef.current.getMyExpensesByMonth(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      200
    );
    const raw = unwrapList(res?.data ?? res);
    setItems(raw.map((x) => mapApiRow(x, "expense")));
  };

  const onSave = async (tx, editing) => {
    const payload = {
      amount: String(tx.amount),
      category: tx.category,
      description: tx.comment || "",
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
    />
  );
}
