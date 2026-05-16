import React, { useMemo } from "react";
import { monthLabel } from "../../lib/ftUtils";

const COLOR_INCOME = "#3ecf8e";
const COLOR_EXPENSE = "#f5a623";
const COLOR_GRID = "rgba(255,255,255,0.08)";

function shortMonth(ym) {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return "";
  return new Date(y, m - 1, 1)
    .toLocaleDateString("ru-RU", { month: "short" })
    .replace(".", "");
}

/**
 * Столбчатый график: доходы (зелёный) и расходы (оранжевый) по месяцам.
 */
export default function CashflowChart({ rows = [], formatAmount }) {
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
      m = Math.max(m, r.totalIncome || 0, r.totalExpenses || 0);
    });
    return m;
  }, [data]);

  const chartH = 200;
  const n = data.length;

  if (n === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Нет данных для графика за выбранный период.
      </p>
    );
  }

  const barSlot = Math.min(72, Math.max(40, Math.floor(600 / n)));
  const groupW = barSlot * 2 + 8;

  return (
    <div className="w-full">
      {/* Сетка и подписи оси Y */}
      <div className="flex gap-3">
        <div className="hidden sm:flex flex-col justify-between h-[200px] text-[10px] text-muted-foreground tabular-nums w-12 shrink-0 py-0.5">
          <span>{formatAxis(maxVal, formatAmount)}</span>
          <span>{formatAxis(maxVal / 2, formatAmount)}</span>
          <span>0</span>
        </div>

        <div className="flex-1 min-w-0 overflow-x-auto pb-1">
          <div
            className="flex items-end justify-center sm:justify-around gap-3 sm:gap-4 min-w-min mx-auto px-2"
            style={{ minHeight: chartH + 48 }}
          >
            {data.map((row) => {
              const incH = Math.max(6, Math.round((row.totalIncome / maxVal) * chartH));
              const expH = Math.max(6, Math.round((row.totalExpenses / maxVal) * chartH));
              return (
                <div
                  key={row.ym}
                  className="flex flex-col items-center shrink-0"
                  style={{ width: groupW }}
                >
                  <div
                    className="relative flex items-end justify-center gap-2 w-full rounded-t-lg"
                    style={{ height: chartH }}
                  >
                    <div
                      className="absolute inset-x-0 border-t border-dashed pointer-events-none"
                      style={{ bottom: "50%", borderColor: COLOR_GRID }}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 border-t pointer-events-none"
                      style={{ borderColor: COLOR_GRID }}
                    />

                    <Bar
                      height={incH}
                      color={COLOR_INCOME}
                      label="Доходы"
                      value={formatAmount(row.totalIncome)}
                    />
                    <Bar
                      height={expH}
                      color={COLOR_EXPENSE}
                      label="Расходы"
                      value={formatAmount(row.totalExpenses)}
                    />
                  </div>

                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-3 text-center capitalize leading-tight">
                    {shortMonth(row.ym)}
                  </p>
                  <p className="text-[9px] text-muted-foreground/70 mt-0.5 hidden sm:block">
                    {String(row.ym).slice(0, 4)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-5 mt-6 pt-4 border-t border-border text-xs">
        <Legend color={COLOR_INCOME} label="Доходы" />
        <Legend color={COLOR_EXPENSE} label="Расходы" />
      </div>

      {/* Сводка под графиком */}
      <ul className="mt-5 space-y-2 sm:hidden">
        {data.map((row) => (
          <li key={`m-${row.ym}`} className="flex justify-between text-xs gap-2">
            <span className="capitalize text-muted-foreground">{monthLabel(row.ym)}</span>
            <span className="tabular-nums shrink-0">
              <span style={{ color: COLOR_INCOME }}>+{formatAmount(row.totalIncome)}</span>
              {" / "}
              <span style={{ color: COLOR_EXPENSE }}>−{formatAmount(row.totalExpenses)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bar({ height, color, label, value }) {
  return (
    <div
      className="group relative w-6 sm:w-8 rounded-t-md transition-all hover:brightness-110 cursor-default shadow-[0_-4px_20px_rgba(0,0,0,0.25)]"
      style={{ height, backgroundColor: color, minHeight: 6 }}
      title={`${label}: ${value}`}
    >
      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition bg-black/80 text-white z-10">
        {value}
      </span>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-2 font-medium text-foreground">
      <span className="size-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function formatAxis(val, formatAmount) {
  const n = Number(val) || 0;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  try {
    return formatAmount(n).replace(/\s/g, "");
  } catch {
    return String(Math.round(n));
  }
}
