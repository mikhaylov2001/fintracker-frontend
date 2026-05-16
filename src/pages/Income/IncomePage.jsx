import React, { useCallback, useEffect, useMemo, useState } from "react";
import TransactionsPage from "../../components/ft/TransactionsPage";
import { useIncomeApi } from "../../api/incomeApi";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { mapApiError, mapApiRow, normalizeDateOnly, unwrapList } from "../../lib/ftUtils";

const CATEGORIES = [
  "Работа",
  "Подработка",
  "Вклады",
  "Бизнес",
  "Рента",
  "Инвестиции",
  "Продажа вещей",
  "Подарки",
  "Налоги",
  "Другое",
];
const SOURCES = ["Зарплата", "Премия", "Проценты", "Дивиденды", "Бизнес", "Другое"];

export default function IncomePage() {
  const toast = useToast();
  const { formatAmount } = useCurrency();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const incomeApi = useIncomeApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const now = new Date();
      const res = await incomeApi.getMyIncomesByMonth(now.getFullYear(), now.getMonth() + 1, 0, 200);
      const raw = unwrapList(res?.data ?? res);
      setItems(raw.map((x) => mapApiRow(x, "income")));
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка загрузки доходов"));
    } finally {
      setLoading(false);
    }
  }, [incomeApi, isAuthenticated, toast]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const fmt = useCallback((n) => formatAmount(n), [formatAmount]);

  const onSave = async (tx, editing) => {
    const payload = {
      amount: String(tx.amount),
      category: tx.category,
      source: tx.source || "Другое",
      date: normalizeDateOnly(tx.date),
    };
    try {
      if (editing?.id) {
        await incomeApi.updateIncome(editing.id, payload);
        toast.success("Доход обновлён");
      } else {
        await incomeApi.createIncome(payload);
        toast.success("Доход добавлен");
      }
      await load();
    } catch (e) {
      toast.error(mapApiError(e, "Ошибка сохранения"));
      throw e;
    }
  };

  const onDelete = async (id) => {
    try {
      await incomeApi.deleteIncome(id);
      toast.success("Доход удалён");
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
      title="Доходы"
      subtitle="Учёт всех поступлений: зарплата, бизнес, инвестиции."
      kind="income"
      items={rows}
      loading={loading}
      categories={CATEGORIES}
      sources={SOURCES}
      accent="emerald"
      formatAmount={fmt}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}
