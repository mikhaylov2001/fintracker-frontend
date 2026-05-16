import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const now = new Date();
      const res = await expensesApi.getMyExpensesByMonth(now.getFullYear(), now.getMonth() + 1, 0, 200);
      const raw = unwrapList(res?.data ?? res);
      setItems(raw.map((x) => mapApiRow(x, "expense")));
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка загрузки расходов"));
    } finally {
      setLoading(false);
    }
  }, [expensesApi, isAuthenticated, toast]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const fmt = useCallback((n) => formatAmount(n), [formatAmount]);

  const onSave = async (tx, editing) => {
    const payload = {
      amount: String(tx.amount),
      category: tx.category,
      description: tx.comment || "",
      date: normalizeDateOnly(tx.date),
    };
    try {
      if (editing?.id) {
        await expensesApi.updateExpense(editing.id, payload);
        toast.success("Расход обновлён");
      } else {
        await expensesApi.createExpense(payload);
        toast.success("Расход добавлен");
      }
      await load();
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка сохранения"));
      throw e;
    }
  };

  const onDelete = async (id) => {
    try {
      await expensesApi.deleteExpense(id);
      toast.success("Расход удалён");
      await load();
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка удаления"));
    }
  };

  const rows = useMemo(() => items, [items]);

  if (authLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <TransactionsPage
      title="Расходы"
      subtitle="Контролируйте, на что уходят деньги каждый месяц."
      kind="expense"
      items={rows}
      loading={loading}
      categories={CATEGORIES}
      accent="warning"
      formatAmount={fmt}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}
