import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const incomeRef = useRef(incomeApi);
  incomeRef.current = incomeApi;

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
        const res = await incomeRef.current.getMyIncomesByMonth(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          200
        );
        if (!cancelled) {
          const raw = unwrapList(res?.data ?? res);
          setItems(raw.map((x) => mapApiRow(x, "income")));
        }
      } catch (e) {
        if (!cancelled) toast.error(mapApiError(e, "Ошибка загрузки доходов"));
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
    const res = await incomeRef.current.getMyIncomesByMonth(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      200
    );
    const raw = unwrapList(res?.data ?? res);
    setItems(raw.map((x) => mapApiRow(x, "income")));
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
      categories={CATEGORIES}
      sources={SOURCES}
      accent="emerald"
      formatAmount={fmt}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}