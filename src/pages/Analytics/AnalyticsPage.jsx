import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useSummaryApi } from "../../api/summaryApi";
import { useExpensesApi } from "../../api/expensesApi";
import { useIncomeApi } from "../../api/incomeApi";
import { mapApiRow, unwrapList } from "../../lib/ftUtils";
import {
  aggregateSummaries,
  defaultPeriod,
  parseYM,
  periodDescription,
  resolvePeriodMonths,
  unwrapSummariesList,
} from "../../lib/periodUtils";
import {
  CHART_EXPENSE,
  CHART_GRID,
  CHART_INCOME,
  CHART_SAVINGS,
  CHART_TICK,
  PIE_COLORS,
  chartTick,
  chartTooltipStyle,
  monthShortRu,
} from "../../lib/analyticsCharts";
import PeriodSelector from "../../components/ft/PeriodSelector";
import AnalyticsCard from "../../components/ft/AnalyticsCard";
import SegmentToggle from "../../components/ft/SegmentToggle";

const SEGMENT_ACTIVE = "bg-[#22C55E] text-[#05140C]";

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const summaryApi = useSummaryApi();
  const expensesApi = useExpensesApi();
  const incomeApi = useIncomeApi();
  const summaryRef = useRef(summaryApi);
  const expensesRef = useRef(expensesApi);
  const incomeRef = useRef(incomeApi);
  summaryRef.current = summaryApi;
  expensesRef.current = expensesApi;
  incomeRef.current = incomeApi;

  const [period, setPeriod] = useState(defaultPeriod);
  const [summaries, setSummaries] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [catKind, setCatKind] = useState("expense");
  const [catsLoading, setCatsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setSummaries([]);
      setExpenseCategories([]);
      setIncomeCategories([]);
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

  const chartRows = useMemo(
    () =>
      summaries
        .filter((s) => s.totalIncome > 0 || s.totalExpenses > 0)
        .sort((a, b) => a.ym.localeCompare(b.ym))
        .slice(-6),
    [summaries]
  );

  const monthlyData = useMemo(
    () =>
      chartRows.map((r) => ({
        month: monthShortRu(r.ym),
        Доходы: r.totalIncome || 0,
        Расходы: r.totalExpenses || 0,
        Сбережения: Math.max(0, (r.totalIncome || 0) - (r.totalExpenses || 0)),
      })),
    [chartRows]
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated || monthList.length === 0) {
      setExpenseCategories([]);
      setIncomeCategories([]);
      setCatsLoading(false);
      return;
    }

    let cancelled = false;

    const aggregate = (items, field) => {
      const map = new Map();
      items.forEach((e) => {
        const key = (field === "source" ? e.source : e.category) || "Другое";
        map.set(key, (map.get(key) || 0) + e.amount);
      });
      return [...map.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    };

    const loadCats = async () => {
      setCatsLoading(true);
      try {
        const monthsToLoad = monthList.slice(-6);
        const [expResults, incResults] = await Promise.all([
          Promise.all(
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
          ),
          Promise.all(
            monthsToLoad.map(async (ym) => {
              const p = parseYM(ym);
              if (!p) return [];
              const res = await incomeRef.current.getMyIncomesByMonth(
                p.year,
                p.month,
                0,
                300
              );
              return unwrapList(res?.data ?? res).map((x) => mapApiRow(x, "income"));
            })
          ),
        ]);
        if (cancelled) return;
        setExpenseCategories(aggregate(expResults.flat(), "category"));
        setIncomeCategories(aggregate(incResults.flat(), "source"));
      } catch {
        if (!cancelled) {
          setExpenseCategories([]);
          setIncomeCategories([]);
        }
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    };

    loadCats();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, monthList]);

  const isExpense = catKind === "expense";
  const categories = isExpense ? expenseCategories : incomeCategories;
  const catTotal = useMemo(
    () => categories.reduce((s, c) => s + c.value, 0),
    [categories]
  );

  const todayStr = new Date().toLocaleDateString("ru-RU");

  if (authLoading || (loading && !hasLoadedOnce.current)) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Загрузка…</p>;
  }

  const hasData = agg.income > 0 || agg.expenses > 0 || summaries.length > 0;

  const tooltipFmt = (v) => formatAmount(Number(v) || 0);

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Аналитика
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Динамика за {chartRows.length || 6} месяцев и распределение по категориям ·{" "}
            {periodDescription(period)} · обновлено {todayStr}
          </p>
        </div>
        <PeriodSelector period={period} onChange={setPeriod} variant="header" />
      </header>

      {!hasData ? (
        <div className="bg-surface rounded-3xl border border-border p-10 sm:p-14 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Пока нет данных для аналитики. Добавьте операции на вкладках «Доходы» и «Расходы».
          </p>
        </div>
      ) : (
        <motionless className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnalyticsCard
            title="Доходы vs Расходы"
            subtitle={`по месяцам · ${periodDescription(period)}`}
          >
            {monthlyData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ChartBox>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="month" tick={chartTick} />
                  <YAxis tick={chartTick} width={48} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={tooltipFmt}
                    labelStyle={{ color: CHART_TICK }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: CHART_TICK }} />
                  <Bar dataKey="Доходы" fill={CHART_INCOME} radius={[6, 6, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="Расходы" fill={CHART_EXPENSE} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ChartBox>
            )}
          </AnalyticsCard>

          <AnalyticsCard title="Динамика сбережений" subtitle="чистый остаток по месяцам">
            {monthlyData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ChartBox>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="month" tick={chartTick} />
                  <YAxis tick={chartTick} width={48} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={tooltipFmt}
                    labelStyle={{ color: CHART_TICK }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Сбережения"
                    stroke={CHART_SAVINGS}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: CHART_SAVINGS }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartBox>
            )}
          </AnalyticsCard>

          <AnalyticsCard
            title={isExpense ? "Расходы по категориям" : "Доходы по источникам"}
            subtitle={periodDescription(period)}
            className="lg:col-span-2"
            action={
              <SegmentToggle
                value={catKind}
                onChange={setCatKind}
                options={[
                  { id: "expense", label: "Расходы", activeClass: SEGMENT_ACTIVE },
                  { id: "income", label: "Доходы", activeClass: SEGMENT_ACTIVE },
                ]}
              />
            }
          >
            {catsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-12">Загрузка категорий…</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {isExpense ? "Нет расходов за период." : "Нет доходов за период."}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <ChartBox>
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {categories.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={tooltipFmt}
                    />
                  </PieChart>
                </ChartBox>
                <ul className="space-y-2.5 min-w-0">
                  {categories.map((c, i) => {
                    const pct = catTotal ? Math.round((c.value / catTotal) * 100) : 0;
                    return (
                      <li key={c.name} className="flex items-center gap-3 min-w-0">
                        <span
                          className="size-3 rounded-sm shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-sm flex-1 truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {pct}%
                        </span>
                        <span className="text-sm font-semibold tabular-nums shrink-0 text-right min-w-[5.5rem]">
                          {formatAmount(c.value)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </AnalyticsCard>
        </motionless>
      )}
    </>
  );
}

function ChartBox({ children }) {
  return (
    <div className="w-full min-w-0" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart() {
  return (
    <p className="text-sm text-muted-foreground text-center py-16">
      Нет данных за выбранный период.
    </p>
  );
}
