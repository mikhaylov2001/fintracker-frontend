import React, { useEffect, useMemo, useRef, useState } from "react";
import { TrendingDown, TrendingUp, Wallet, Percent } from "lucide-react";
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
  resolveTrendChartMonths,
  trendChartSubtitle,
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
  chartTooltipProps,
  monthShortRu,
} from "../../lib/analyticsCharts";
import PeriodSelector from "../../components/ft/PeriodSelector";
import AnalyticsCard from "../../components/ft/AnalyticsCard";
import ChartTooltip from "../../components/ft/ChartTooltip";
import MonthHistoryPanel from "../../components/ft/MonthHistoryPanel";
import SegmentToggle from "../../components/ft/SegmentToggle";
import KpiStat from "../../components/ft/KpiStat";
import { useIsMobile } from "../../hooks/useIsMobile";

const SEGMENT_ACTIVE = "ft-segment-active";

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
  const isMobile = useIsMobile();
  const axisTick = isMobile ? { fill: CHART_TICK, fontSize: 9 } : chartTick;
  const yAxisWidth = isMobile ? 36 : 48;
  const xAxisMobile = isMobile
    ? { angle: -35, textAnchor: "end", height: 52, interval: "preserveStartEnd" }
    : {};

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

  const chartRows = useMemo(() => {
    const inPeriod = new Set(monthList);
    return summaries
      .filter(
        (s) =>
          inPeriod.has(s.ym) && (s.totalIncome > 0 || s.totalExpenses > 0)
      )
      .sort((a, b) => a.ym.localeCompare(b.ym));
  }, [summaries, monthList]);

  const monthsForCategories = useMemo(() => {
    if (period.mode === "year" || period.mode === "range" || period.mode === "all") {
      return monthList;
    }
    return monthList.slice(-6);
  }, [monthList, period.mode]);

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

  const trendMonths = useMemo(
    () => resolveTrendChartMonths(period, summaries),
    [period, summaries]
  );

  const savingsTrendData = useMemo(() => {
    const byYm = new Map(summaries.map((s) => [s.ym, s]));
    return trendMonths.map((ym) => {
      const s = byYm.get(ym);
      const income = s?.totalIncome || 0;
      const expenses = s?.totalExpenses || 0;
      return {
        month: monthShortRu(ym),
        Сбережения: Math.max(0, income - expenses),
      };
    });
  }, [summaries, trendMonths]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || monthsForCategories.length === 0) {
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
        const monthsToLoad = monthsForCategories;
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
  }, [authLoading, isAuthenticated, monthsForCategories]);

  const isExpense = catKind === "expense";
  const categories = isExpense ? expenseCategories : incomeCategories;
  const catTotal = useMemo(
    () => categories.reduce((s, c) => s + c.value, 0),
    [categories]
  );

  if (authLoading || (loading && !hasLoadedOnce.current)) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Загрузка…</p>;
  }

  const hasData = agg.income > 0 || agg.expenses > 0 || summaries.length > 0;

  const tooltipFmt = (v) => formatAmount(Number(v) || 0);
  const todayStr = new Date().toLocaleDateString("ru-RU");

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 sm:mb-8 sm:flex-row sm:justify-between sm:items-end">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Аналитика</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Динамика за {chartRows.length || 6} месяцев и распределение по категориям. Сегодня —{" "}
            {periodDescription(period)}.
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
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <KpiStat
              label="Доходы"
              hint="за период"
              value={formatAmount(agg.income)}
              icon={TrendingUp}
              highlight
            />
            <KpiStat
              label="Расходы"
              hint="за период"
              value={formatAmount(agg.expenses)}
              icon={TrendingDown}
            />
            <KpiStat
              label="Сбережения"
              hint="доходы − расходы"
              value={formatAmount(agg.savings)}
              icon={Wallet}
            />
            <KpiStat
              label="Норма сбережений"
              hint="% от дохода"
              value={`${agg.rate}%`}
              icon={Percent}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
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
                  <XAxis dataKey="month" tick={axisTick} {...xAxisMobile} />
                  <YAxis tick={axisTick} width={yAxisWidth} />
                  <Tooltip
                    content={<ChartTooltip formatter={tooltipFmt} />}
                    {...chartTooltipProps}
                  />
                  <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12, color: CHART_TICK }} />
                  <Bar dataKey="Доходы" fill={CHART_INCOME} radius={[6, 6, 0, 0]} maxBarSize={isMobile ? 28 : 48} />
                  <Bar dataKey="Расходы" fill={CHART_EXPENSE} radius={[6, 6, 0, 0]} maxBarSize={isMobile ? 28 : 48} />
                </BarChart>
              </ChartBox>
            )}
          </AnalyticsCard>

          <AnalyticsCard
            title="Динамика сбережений"
            subtitle={trendChartSubtitle(period)}
          >
            {savingsTrendData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ChartBox>
                <LineChart data={savingsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="month" tick={axisTick} {...xAxisMobile} />
                  <YAxis tick={axisTick} width={yAxisWidth} />
                  <Tooltip
                    content={<ChartTooltip formatter={tooltipFmt} />}
                    {...chartTooltipProps}
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            <AnalyticsCard
              title={isExpense ? "Расходы по категориям" : "Доходы по источникам"}
              subtitle={periodDescription(period)}
              className="h-full"
              action={
              <SegmentToggle
                stretch
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                <ChartBox height={240}>
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {categories.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip formatter={tooltipFmt} />}
                      {...chartTooltipProps}
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

            <MonthHistoryPanel
              rows={summaries}
              formatAmount={formatAmount}
              updatedAt={todayStr}
              className="h-full min-h-0"
            />
          </div>
        </>
      )}
    </>
  );
}

function ChartBox({ children, height = 280 }) {
  const isMobile = useIsMobile();
  const h = isMobile ? Math.min(height, 220) : height;
  return (
    <div className="w-full min-w-0" style={{ height: h }}>
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
