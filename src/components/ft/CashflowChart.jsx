import React, { useMemo, useState } from "react";
import { monthLabel } from "../../lib/ftUtils";
import SegmentToggle from "./SegmentToggle";

const COLOR_INCOME = "#3ecf8e";
const COLOR_EXPENSE = "#f5a623";
const COLOR_GRID = "rgba(255,255,255,0.1)";

function shortMonth(ym) {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return "";
  const raw = new Date(y, m - 1, 1).toLocaleDateString("ru-RU", { month: "short" });
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(".", "");
}

/**
 * Столбчатый график доходов и расходов — равномерная сетка, без пустот между месяцами.
 */
export default function CashflowChart({ rows = [], formatAmount }) {
  const [view, setView] = useState("all");

  const data = useMemo(
    () =>
      [...rows]
        .filter((r) => r?.ym && (r.totalIncome > 0 || r.totalExpenses > 0))
        .sort((a, b) => a.ym.localeCompare(b.ym)),
    [rows]
  );

  const maxVal = useMemo(() => {
    let m = 1;
    data.forEach((r) => {
      if (view === "all" || view === "income") m = Math.max(m, r.totalIncome || 0);
      if (view === "all" || view === "expense") m = Math.max(m, r.totalExpenses || 0);
    });
    return m;
  }, [data, view]);

  const chartH = 220;
  const n = data.length;

  if (n === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Нет данных для графика.
      </p>
    );
  }

  const showIncome = view === "all" || view === "income";
  const showExpense = view === "all" || view === "expense";

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <SegmentToggle
          value={view}
          onChange={setView}
          options={[
            { id: "all", label: "Всё", activeClass: "bg-white/10 text-foreground border border-border" },
            {
              id: "income",
              label: "Доходы",
              activeClass: "bg-[#3ecf8e] text-black shadow-[0_0_20px_rgba(62,207,142,0.35)]",
            },
            {
              id: "expense",
              label: "Расходы",
              activeClass: "bg-[#f5a623] text-black shadow-[0_0_20px_rgba(245,166,35,0.35)]",
            },
          ]}
        />
        <div className="flex gap-4 text-[11px] text-muted-foreground">
          {showIncome && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: COLOR_INCOME }} />
              Доходы
            </span>
          )}
          {showExpense && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: COLOR_EXPENSE }} />
              Расходы
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="hidden sm:flex flex-col justify-between shrink-0 w-11 text-[10px] text-muted-foreground tabular-nums py-1" style={{ height: chartH }}>
          <span>{formatAxis(maxVal, formatAmount)}</span>
          <span>{formatAxis(maxVal * 0.5, formatAmount)}</span>
          <span>0</span>
        </div>

        <div className="flex-1 min-w-0 relative rounded-2xl border border-border/60 bg-black/15 px-2 sm:px-4 pt-3 sm:pt-4 pb-2">
          <div
            className="absolute left-2 right-2 sm:left-4 sm:right-4 top-3 sm:top-4 pointer-events-none flex flex-col justify-between"
            style={{ height: chartH }}
          >
            <div className="border-t border-dashed" style={{ borderColor: COLOR_GRID }} />
            <div className="border-t border-dashed" style={{ borderColor: COLOR_GRID }} />
            <div className="border-t border-dashed" style={{ borderColor: COLOR_GRID }} />
          </div>

          <div
            className="grid gap-2 sm:gap-4 w-full relative z-[1]"
            style={{
              gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
              height: chartH,
            }}
          >
            {data.map((row) => {
              const incH = showIncome
                ? Math.max(8, Math.round((row.totalIncome / maxVal) * chartH))
                : 0;
              const expH = showExpense
                ? Math.max(8, Math.round((row.totalExpenses / maxVal) * chartH))
                : 0;

              return (
                <div
                  key={row.ym}
                  className="flex flex-col items-stretch justify-end min-w-0"
                  style={{ height: chartH }}
                >
                  <div
                    className="flex items-end justify-center w-full gap-1.5 sm:gap-2.5"
                    style={{ height: chartH }}
                  >
                    {showIncome && (
                      <Bar
                        height={incH}
                        color={COLOR_INCOME}
                        label="Доходы"
                        value={formatAmount(row.totalIncome)}
                        wide={view !== "all"}
                      />
                    )}
                    {showExpense && (
                      <Bar
                        height={expH}
                        color={COLOR_EXPENSE}
                        label="Расходы"
                        value={formatAmount(row.totalExpenses)}
                        wide={view !== "all"}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="grid gap-2 sm:gap-3 mt-4 w-full"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
          >
            {data.map((row) => {
              const balance = row.totalIncome - row.totalExpenses;
              return (
                <div
                  key={`lbl-${row.ym}`}
                  className="rounded-xl border border-border bg-white/[0.03] p-2 sm:p-3 text-center min-w-0"
                >
                  <p className="text-xs sm:text-sm font-semibold capitalize truncate">
                    {shortMonth(row.ym)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-1.5">{String(row.ym).slice(0, 4)}</p>
                  {showIncome && (
                    <p className="text-[10px] sm:text-xs tabular-nums" style={{ color: COLOR_INCOME }}>
                      +{formatAmount(row.totalIncome)}
                    </p>
                  )}
                  {showExpense && (
                    <p className="text-[10px] sm:text-xs tabular-nums" style={{ color: COLOR_EXPENSE }}>
                      −{formatAmount(row.totalExpenses)}
                    </p>
                  )}
                  {view === "all" && (
                    <p
                      className="text-[10px] font-medium mt-1 tabular-nums"
                      style={{ color: balance >= 0 ? COLOR_INCOME : COLOR_EXPENSE }}
                    >
                      {balance >= 0 ? "+" : ""}
                      {formatAmount(balance)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2 lg:hidden border-t border-border pt-4">
        {data.map((row) => (
          <li key={`m-${row.ym}`} className="flex justify-between text-xs gap-2 py-1">
            <span className="text-muted-foreground capitalize">{monthLabel(row.ym)}</span>
            <span className="tabular-nums shrink-0 text-right">
              {showIncome && (
                <span style={{ color: COLOR_INCOME }}>+{formatAmount(row.totalIncome)} </span>
              )}
              {showExpense && (
                <span style={{ color: COLOR_EXPENSE }}>−{formatAmount(row.totalExpenses)}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bar({ height, color, label, value, wide }) {
  return (
    <div
      className={`group relative rounded-t-lg transition-all hover:brightness-110 cursor-default ${
        wide ? "w-full max-w-[72px] mx-auto" : "w-5 sm:w-7 md:w-9"
      }`}
      style={{
        height,
        backgroundColor: color,
        minHeight: 8,
        boxShadow: `0 0 24px ${color}55`,
      }}
      title={`${label}: ${value}`}
    >
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition bg-black/90 text-white z-10 border border-white/10">
        {value}
      </span>
    </div>
  );
}

function formatAxis(val, formatAmount) {
  const num = Number(val) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}k`;
  try {
    const s = formatAmount(num);
    return s.length > 8 ? s.replace(/\s/g, "") : s;
  } catch {
    return String(Math.round(num));
  }
}
