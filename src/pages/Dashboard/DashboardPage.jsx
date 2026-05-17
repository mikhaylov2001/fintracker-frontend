import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Percent,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useSummaryApi } from "../../api/summaryApi";
import { useIncomeApi } from "../../api/incomeApi";
import { useExpensesApi } from "../../api/expensesApi";
import { formatDateRu, mapApiRow, monthLabel, unwrapList } from "../../lib/ftUtils";
import {
  aggregateSummaries,
  currentYM,
  defaultPeriod,
  parseYM,
  resolvePeriodMonths,
  unwrapSummariesList,
} from "../../lib/periodUtils";
import PeriodSelector from "../../components/ft/PeriodSelector";
import KpiStat from "../../components/ft/KpiStat";

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const summaryApi = useSummaryApi();
  const incomeApi = useIncomeApi();
  const expensesApi = useExpensesApi();

  const summaryRef = useRef(summaryApi);
  const incomeRef = useRef(incomeApi);
  const expensesRef = useRef(expensesApi);
  summaryRef.current = summaryApi;
  incomeRef.current = incomeApi;
  expensesRef.current = expensesApi;

  const [period, setPeriod] = useState(defaultPeriod);
  const [loading, setLoading] = useState(true);
  const [allSummaries, setAllSummaries] = useState([]);
  const [recent, setRecent] = useState([]);
  const hasLoadedOnce = useRef(false);

  const todayStr = useMemo(() => new Date().toLocaleDateString("ru-RU"), []);
  const anchorYm = period.anchorYM || currentYM();

  const monthList = useMemo(
    () => resolvePeriodMonths(period, allSummaries),
    [period, allSummaries]
  );

  const agg = useMemo(
    () => aggregateSummaries(allSummaries, monthList),
    [allSummaries, monthList]
  );

  const displayName = useMemo(() => {
    if (user?.firstName) return user.firstName;
    return user?.userName || "пользователь";
  }, [user]);

  const periodHint =
    period.mode === "year"
      ? "на конец года"
      : period.mode === "all"
        ? "за всё время"
        : "на конец месяца";

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      hasLoadedOnce.current = false;
      setLoading(false);
      setAllSummaries([]);
      setRecent([]);
      return;
    }

    let cancelled = false;
    const anchor = parseYM(anchorYm);
    if (!anchor) return;

    const run = async () => {
      if (!hasLoadedOnce.current) setLoading(true);
      try {
        const [sumSettled, incSettled, expSettled] = await Promise.allSettled([
          summaryRef.current.getMyMonthlySummaries(),
          incomeRef.current.getMyIncomesByMonth(anchor.year, anchor.month, 0, 50),
          expensesRef.current.getMyExpensesByMonth(anchor.year, anchor.month, 0, 50),
        ]);

        if (cancelled) return;

        if (sumSettled.status === "fulfilled") {
          setAllSummaries(unwrapSummariesList(sumSettled.value));
        }

        const incRes = incSettled.status === "fulfilled" ? incSettled.value : null;
        const expRes = expSettled.status === "fulfilled" ? expSettled.value : null;

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
        if (!cancelled) {
          setAllSummaries([]);
          setRecent([]);
        }
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
  }, [authLoading, isAuthenticated, anchorYm, period]);

  const incomeSum = agg.income;
  const expenseSum = agg.expenses;
  const balance = incomeSum - expenseSum;
  const savings = agg.savings;
  const savingsRate = agg.rate;

  const incomeOpCount = recent.filter((r) => r.kind === "income").length;
  const expenseOpCount = recent.filter((r) => r.kind === "expense").length;

  if (authLoading || (loading && !hasLoadedOnce.current)) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Загрузка…</p>;
  }

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 sm:mb-8 lg:mb-10 lg:flex-row lg:justify-between lg:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-glow/10 border border-emerald-glow/20 text-emerald-glow text-[10px] font-semibold uppercase tracking-[0.15em]">
              <CheckCircle2 className="size-3" />
              Актуально
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
            Состояние финансов
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Привет, <span className="text-foreground font-medium">{displayName}</span>. Сегодня{" "}
            {todayStr} · {monthLabel(anchorYm)}
          </p>
        </div>

        <PeriodSelector period={period} onChange={setPeriod} variant="header" />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 lg:mb-10">
        <KpiStat
          label="Баланс"
          value={formatAmount(balance)}
          icon={Wallet}
          iconAccent="info"
          highlight
          hint={periodHint}
        />
        <KpiStat
          label="Доходы"
          value={formatAmount(incomeSum)}
          icon={ArrowUpCircle}
          iconAccent="emerald"
          hint={`${incomeOpCount} операций`}
        />
        <KpiStat
          label="Расходы"
          value={formatAmount(expenseSum)}
          icon={ArrowDownCircle}
          iconAccent="warning"
          hint={`${expenseOpCount} операций`}
        />
        <KpiStat
          label="Норма сбережений"
          value={`${savingsRate}%`}
          icon={Percent}
          iconAccent="violet"
          hint={`Сбережения: ${formatAmount(savings)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 lg:col-span-2">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Итоги месяца
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Обновлено: {todayStr}</p>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.18em]">
              {monthLabel(anchorYm)}
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
          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Последние операции
              </h2>
              <p className="text-xs text-muted-foreground mt-1">за {monthLabel(anchorYm)}</p>
            </div>
          </div>

          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Операций пока нет.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t) => (
                <li key={`${t.kind}-${t.id}`} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl grid place-items-center shrink-0 ${
                        t.kind === "income"
                          ? "bg-emerald-glow/10 text-emerald-glow"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {t.kind === "income" ? (
                        <ArrowUpCircle className="size-4" />
                      ) : (
                        <ArrowDownCircle className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.category}</p>
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

function SummaryRow({ color, label, value }) {
  const dot = color === "emerald" ? "bg-emerald-glow" : color === "warning" ? "bg-warning" : "bg-info";
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}
