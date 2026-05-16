import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Percent,
  Plus,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useSummaryApi } from "../../api/summaryApi";
import {
  aggregateSummaries,
  defaultPeriod,
  periodDescription,
  resolvePeriodMonths,
  unwrapSummariesList,
} from "../../lib/periodUtils";
import PeriodSelector from "../../components/ft/PeriodSelector";

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const summaryApi = useSummaryApi();
  const summaryRef = useRef(summaryApi);
  summaryRef.current = summaryApi;

  const [period, setPeriod] = useState(defaultPeriod);
  const [loading, setLoading] = useState(true);
  const [allSummaries, setAllSummaries] = useState([]);
  const hasLoadedOnce = useRef(false);

  const todayStr = useMemo(() => new Date().toLocaleDateString("ru-RU"), []);

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

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      hasLoadedOnce.current = false;
      setLoading(false);
      setAllSummaries([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!hasLoadedOnce.current) setLoading(true);
      try {
        const raw = await summaryRef.current.getMyMonthlySummaries();
        if (!cancelled) setAllSummaries(unwrapSummariesList(raw));
      } catch {
        if (!cancelled) setAllSummaries([]);
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

  const incomeSum = agg.income;
  const expenseSum = agg.expenses;
  const balance = incomeSum - expenseSum;
  const savings = agg.savings;
  const savingsRate = agg.rate;

  if (authLoading || (loading && !hasLoadedOnce.current)) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Загрузка…</p>;
  }

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 lg:mb-10">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Состояние финансов
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Привет, <span className="text-foreground font-medium">{displayName}</span>. Сегодня{" "}
            {todayStr}
          </p>
          <p className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-2 font-medium">
            <CalendarDays className="size-4 text-emerald-glow shrink-0" strokeWidth={2} />
            <span className="text-border">|</span>
            <span className="text-foreground/90">{periodDescription(period)}</span>
          </p>
        </div>

        <PeriodSelector period={period} onChange={setPeriod} variant="header" />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8 lg:mb-10">
        <KpiCard label="Баланс" value={formatAmount(balance)} icon={Wallet} accent="info" hint="доходы − расходы за период" />
        <KpiCard
          label="Доходы"
          value={formatAmount(incomeSum)}
          icon={ArrowUpCircle}
          accent="emerald"
          hint="за выбранный период"
        />
        <KpiCard
          label="Расходы"
          value={formatAmount(expenseSum)}
          icon={ArrowDownCircle}
          accent="warning"
          hint="за выбранный период"
        />
        <KpiCard
          label="Норма сбережений"
          value={`${savingsRate}%`}
          icon={Percent}
          accent="violet"
          hint={`Сбережения: ${formatAmount(savings)}`}
        />
      </div>

      <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 max-w-2xl">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Итоги за период</h2>
        </div>
        <div className="flex flex-col divide-y divide-border">
          <SummaryRow color="emerald" label="Доходы" value={formatAmount(incomeSum)} />
          <SummaryRow color="warning" label="Расходы" value={formatAmount(expenseSum)} />
          <SummaryRow color="info" label="Сбережения" value={formatAmount(savings)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 pt-6 border-t border-border">
          <Link
            to="/income"
            className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#22C55E] text-[#05140C] text-sm font-bold hover:brightness-110 transition shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            <Plus className="size-4" />
            Доход
          </Link>
          <Link
            to="/expenses"
            className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#FBBF24] text-[#1a1408] text-sm font-bold hover:brightness-110 transition shadow-[0_0_20px_rgba(251,191,36,0.25)]"
          >
            <Plus className="size-4" />
            Расход
          </Link>
        </div>
      </section>
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
