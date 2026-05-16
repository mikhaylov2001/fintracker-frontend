import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Percent,
  CalendarDays,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useSummaryApi } from "../../api/summaryApi";
import { useIncomeApi } from "../../api/incomeApi";
import { useExpensesApi } from "../../api/expensesApi";
import { formatDateRu, mapApiRow, monthLabel, unwrapList } from "../../lib/ftUtils";

const periods = ["Месяц", "Год", "Всё"];

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const unwrap = (raw) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === "object") return raw.data;
  return raw;
};

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const summaryApi = useSummaryApi();
  const incomeApi = useIncomeApi();
  const expensesApi = useExpensesApi();

  const [period, setPeriod] = useState("Месяц");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);

  const now = useMemo(() => new Date(), []);
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayStr = now.toLocaleDateString("ru-RU");

  const displayName = useMemo(() => {
    if (user?.firstName) return user.firstName;
    return user?.userName || "пользователь";
  }, [user]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const [sumRes, incRes, expRes] = await Promise.all([
        summaryApi.getMyMonthlySummary(year, month),
        incomeApi.getMyIncomesByMonth(year, month, 0, 50),
        expensesApi.getMyExpensesByMonth(year, month, 0, 50),
      ]);

      setSummary(unwrap(sumRes));

      const incomes = unwrapList(incRes?.data ?? incRes).map((x) => ({
        ...mapApiRow(x, "income"),
        kind: "income",
      }));
      const expenses = unwrapList(expRes?.data ?? expRes).map((x) => ({
        ...mapApiRow(x, "expense"),
        kind: "expense",
      }));
      const merged = [...incomes, ...expenses]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 6);
      setRecent(merged);
    } catch {
      setSummary(null);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [expensesApi, incomeApi, isAuthenticated, now, summaryApi]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const incomeSum = n(summary?.total_income ?? summary?.totalIncome);
  const expenseSum = n(summary?.total_expenses ?? summary?.totalExpenses);
  const balance = n(summary?.balance ?? incomeSum - expenseSum);
  const savings = Math.max(0, incomeSum - expenseSum);
  const savingsRate =
    summary?.savings_rate_percent != null
      ? Math.round(n(summary.savings_rate_percent))
      : incomeSum > 0
        ? Math.round((savings / incomeSum) * 100)
        : 0;

  if (authLoading || loading) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Загрузка…</p>;
  }

  return (
    <>
      <header className="flex justify-between items-end mb-8 lg:mb-10 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-glow/10 border border-emerald-glow/20 text-emerald-glow text-[10px] font-semibold uppercase tracking-[0.15em]">
              <CheckCircle2 className="size-3" />
              Актуально
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Состояние финансов
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Привет, <span className="text-foreground font-medium">{displayName}</span>. Сегодня{" "}
            {todayStr} · {monthLabel(ym)}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Режим: {period}
          </div>
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  p === period
                    ? "bg-emerald-glow text-primary-foreground shadow-[0_0_20px_oklch(0.72_0.18_162/0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8 lg:mb-10">
        <KpiCard label="Баланс" value={formatAmount(balance)} icon={Wallet} accent="info" hint="на конец месяца" />
        <KpiCard
          label="Доходы"
          value={formatAmount(incomeSum)}
          icon={ArrowUpCircle}
          accent="emerald"
          hint={`${recent.filter((r) => r.kind === "income").length} операций`}
        />
        <KpiCard
          label="Расходы"
          value={formatAmount(expenseSum)}
          icon={ArrowDownCircle}
          accent="warning"
          hint={`${recent.filter((r) => r.kind === "expense").length} операций`}
        />
        <KpiCard
          label="Норма сбережений"
          value={`${savingsRate}%`}
          icon={Percent}
          accent="violet"
          hint={`Сбережения: ${formatAmount(savings)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 lg:col-span-2">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Итоги месяца</h2>
              <p className="text-xs text-muted-foreground mt-1">Обновлено: {todayStr}</p>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.18em]">
              {monthLabel(ym)}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-border">
            <SummaryRow color="emerald" label="Доходы" value={formatAmount(incomeSum)} />
            <SummaryRow color="warning" label="Расходы" value={formatAmount(expenseSum)} />
            <SummaryRow color="info" label="Сбережения" value={formatAmount(savings)} />
          </div>
          {incomeSum === 0 && expenseSum === 0 && (
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">Пока нет операций в этом месяце.</p>
              <div className="flex gap-2 justify-center mt-3">
                <Link
                  to="/income"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-glow/10 text-emerald-glow text-xs font-semibold hover:bg-emerald-glow/20 transition"
                >
                  <Plus className="size-3.5" /> Доход
                </Link>
                <Link
                  to="/expenses"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-semibold hover:bg-warning/20 transition"
                >
                  <Plus className="size-3.5" /> Расход
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 lg:col-span-3">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-6">Последние операции</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Операций пока нет.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t) => (
                <li key={`${t.kind}-${t.id}`} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl grid place-items-center shrink-0 ${
                        t.kind === "income" ? "bg-emerald-glow/10 text-emerald-glow" : "bg-warning/10 text-warning"
                      }`}
                    >
                      {t.kind === "income" ? (
                        <ArrowUpCircle className="size-4" />
                      ) : (
                        <ArrowDownCircle className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.category}</p>
                      <p className="text-xs text-muted-foreground">{formatDateRu(t.date)}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      t.kind === "income" ? "text-emerald-glow" : "text-warning"
                    }`}
                  >
                    {t.kind === "income" ? "+" : "−"}
                    {formatAmount(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

const accentMap = {
  info: { dot: "bg-info", glow: "bg-info/10", ring: "hover:border-info/30", text: "text-info" },
  emerald: { dot: "bg-emerald-glow", glow: "bg-emerald-glow/10", ring: "hover:border-emerald-glow/40", text: "text-emerald-glow" },
  warning: { dot: "bg-warning", glow: "bg-warning/10", ring: "hover:border-warning/30", text: "text-warning" },
  violet: { dot: "bg-violet", glow: "bg-violet/10", ring: "hover:border-violet/30", text: "text-violet" },
};

function KpiCard({ label, value, icon: Icon, accent, hint }) {
  const a = accentMap[accent];
  return (
    <div className={`relative overflow-hidden bg-surface p-5 sm:p-6 rounded-3xl border border-border ${a.ring} transition-all`}>
      <div className={`absolute -right-8 -top-8 size-32 ${a.glow} blur-3xl rounded-full pointer-events-none`} />
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
          <span className={`size-1.5 rounded-full ${a.dot}`} />
          {label}
        </p>
        <div className="size-8 rounded-lg bg-white/[0.04] border border-border grid place-items-center">
          <Icon className={`size-4 ${a.text}`} strokeWidth={2} />
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5 tabular-nums break-all">{value}</h2>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function SummaryRow({ color, label, value }) {
  const dot = color === "emerald" ? "bg-emerald-glow" : color === "warning" ? "bg-warning" : "bg-info";
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
