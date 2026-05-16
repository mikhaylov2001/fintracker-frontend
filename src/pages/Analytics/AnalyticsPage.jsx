import React, { useEffect, useMemo, useRef, useState } from "react";
import { TrendingDown, TrendingUp, Wallet, Percent } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useSummaryApi } from "../../api/summaryApi";
import { useExpensesApi } from "../../api/expensesApi";
import { mapApiRow, unwrapList } from "../../lib/ftUtils";
import {
  aggregateSummaries,
  defaultPeriod,
  parseYM,
  periodDescription,
  resolvePeriodMonths,
  unwrapSummariesList,
} from "../../lib/periodUtils";
import PeriodSelector from "../../components/ft/PeriodSelector";
import MonthHistoryPanel from "../../components/ft/MonthHistoryPanel";
import CashflowChart from "../../components/ft/CashflowChart";

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const summaryApi = useSummaryApi();
  const expensesApi = useExpensesApi();
  const summaryRef = useRef(summaryApi);
  const expensesRef = useRef(expensesApi);
  summaryRef.current = summaryApi;
  expensesRef.current = expensesApi;

  const [period, setPeriod] = useState(defaultPeriod);
  const [summaries, setSummaries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setSummaries([]);
      setCategories([]);
      setLoading(false);
      hasLoadedOnce.current = false;
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!hasLoadedOnce.current) setLoading(true);
      try {
        const raw = await summaryRef.current.getMyMonthlySummaries();
        if (cancelled) return;
        setSummaries(unwrapSummariesList(raw));
      } catch {
        if (!cancelled) setSummaries([]);
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
  }, [authLoading, isAuthenticated]);

  const monthList = useMemo(
    () => resolvePeriodMonths(period, summaries),
    [period, summaries]
  );

  const agg = useMemo(
    () => aggregateSummaries(summaries, monthList),
    [summaries, monthList]
  );

  /** График: последние 6 месяцев с данными (нагляднее, чем один месяц) */
  const chartRows = useMemo(
    () =>
      summaries
        .filter((s) => s.totalIncome > 0 || s.totalExpenses > 0)
        .sort((a, b) => a.ym.localeCompare(b.ym))
        .slice(-6),
    [summaries]
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated || monthList.length === 0) {
      setCategories([]);
      return;
    }

    let cancelled = false;

    const loadCats = async () => {
      try {
        const monthsToLoad = monthList.slice(-6);
        const results = await Promise.all(
          monthsToLoad.map(async (ym) => {
            const p = parseYM(ym);
            if (!p) return [];
            const res = await expensesRef.current.getMyExpensesByMonth(
              p.year,
              p.month,
              0,
              300
            );
            return unwrapList(res?.data ?? res).map((x) => mapApiRow(x, "expense"));
          })
        );
        if (cancelled) return;

        const map = new Map();
        results.flat().forEach((e) => {
          const key = e.category || "Другое";
          map.set(key, (map.get(key) || 0) + e.amount);
        });
        const sorted = [...map.entries()]
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 8);
        setCategories(sorted);
      } catch {
        if (!cancelled) setCategories([]);
      }
    };

    loadCats();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, monthList]);

  const maxCat = categories[0]?.amount || 1;
  const todayStr = new Date().toLocaleDateString("ru-RU");

  if (authLoading || (loading && !hasLoadedOnce.current)) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Загрузка…</p>;
  }

  const hasData = agg.income > 0 || agg.expenses > 0 || summaries.length > 0;

  return (
    <>
      <header className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Аналитика</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Динамика и категории за выбранный период. Обновлено: {todayStr}
        </p>
      </header>

      <PeriodSelector period={period} onChange={setPeriod} />

      {!hasData ? (
        <section className="bg-surface rounded-3xl border border-border p-10 sm:p-14 text-center mt-6">
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Нет данных за выбранный период. Добавьте операции в «Доходы» и «Расходы» или выберите другой месяц.
          </p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 mb-8">
            <Kpi label="Доходы" hint="за период" value={formatAmount(agg.income)} icon={TrendingUp} color="emerald" />
            <Kpi label="Расходы" hint="за период" value={formatAmount(agg.expenses)} icon={TrendingDown} color="warning" />
            <Kpi label="Сбережения" hint="доходы − расходы" value={formatAmount(agg.savings)} icon={Wallet} color="info" />
            <Kpi
              label="Норма сбережений"
              hint="% от дохода"
              value={`${agg.rate}%`}
              icon={Percent}
              color="violet"
            />
          </div>

          <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-bold mb-1">Динамика по месяцам</h2>
            <p className="text-xs text-muted-foreground mb-6">
              {chartRows.length > 0
                ? `Последние ${chartRows.length} ${
                    chartRows.length === 1 ? "месяц" : chartRows.length < 5 ? "месяца" : "месяцев"
                  } с операциями · KPI: ${periodDescription(period)}`
                : periodDescription(period)}
            </p>
            <CashflowChart rows={chartRows} formatAmount={formatAmount} />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8">
              <h2 className="text-lg font-bold mb-1">Топ категорий расходов</h2>
              <p className="text-xs text-muted-foreground mb-5">за выбранный период</p>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет расходов за период.</p>
              ) : (
                <ul className="space-y-3">
                  {categories.map((c) => (
                    <li key={c.name}>
                      <div className="flex justify-between text-sm mb-1 gap-2">
                        <span className="font-medium truncate">{c.name}</span>
                        <span className="font-semibold tabular-nums shrink-0" style={{ color: "#f5a623" }}>
                          {formatAmount(c.amount)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(c.amount / maxCat) * 100}%`,
                            backgroundColor: "#f5a623",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <MonthHistoryPanel
              rows={summaries}
              formatAmount={formatAmount}
              updatedAt={todayStr}
              className="h-full"
            />
          </div>
        </>
      )}
    </>
  );
}

function Kpi({ label, hint, value, icon: Icon, color }) {
  const iconClass =
    color === "emerald"
      ? "text-emerald-glow"
      : color === "warning"
        ? "text-warning"
        : color === "violet"
          ? "text-violet"
          : "text-info";
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <div className="size-8 rounded-lg bg-white/[0.04] border border-border grid place-items-center">
          <Icon className={`size-4 ${iconClass}`} />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums mb-1">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
