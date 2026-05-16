import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDateRu, monthLabelLong, pluralMonthsRu } from "../../lib/ftUtils";

function savingsRate(row) {
  if (row.totalIncome > 0) {
    return Math.round(
      Number(row.savingsRatePercent) ||
        (Number(row.savings) / Number(row.totalIncome)) * 100
    );
  }
  return 0;
}

/**
 * История месяцев: норма сбережений %, раскрывающиеся детали.
 * rows — нормализованные summary из periodUtils (ym, totalIncome, …).
 */
export default function MonthHistoryPanel({
  rows = [],
  formatAmount,
  updatedAt,
  className = "",
  defaultOpenYm = null,
}) {
  const sorted = useMemo(
    () =>
      [...rows]
        .filter((r) => r?.ym && (r.totalIncome > 0 || r.totalExpenses > 0))
        .sort((a, b) => b.ym.localeCompare(a.ym)),
    [rows]
  );

  const [expandedYm, setExpandedYm] = useState(defaultOpenYm);

  const updatedLabel = !updatedAt
    ? new Date().toLocaleDateString("ru-RU")
    : /^\d{4}-\d{2}-\d{2}/.test(String(updatedAt))
      ? formatDateRu(updatedAt)
      : String(updatedAt);

  if (sorted.length === 0) {
    return (
      <section
        className={`bg-surface rounded-3xl border border-border p-6 sm:p-8 ${className}`}
      >
        <h2 className="text-lg font-bold mb-2">История месяцев</h2>
        <p className="text-sm text-muted-foreground">
          Пока нет сохранённых месяцев. Добавьте доходы или расходы — они появятся здесь.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`bg-surface rounded-3xl border border-border overflow-hidden ${className}`}
    >
      <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-border/80">
        <h2 className="text-lg font-bold tracking-tight mb-3">История месяцев</h2>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>История сохранена: {pluralMonthsRu(sorted.length)}</span>
          <span>Обновлено: {updatedLabel}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
          Процент — <span className="text-foreground/80">норма сбережений</span>: сколько дохода
          осталось после расходов. Чем выше, тем больше удалось отложить.
        </p>
      </div>

      <ul className="divide-y divide-border">
        {sorted.map((row) => {
          const rate = savingsRate(row);
          const open = expandedYm === row.ym;

          return (
            <li key={row.ym}>
              <button
                type="button"
                onClick={() => setExpandedYm(open ? null : row.ym)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-7 py-4 text-left hover:bg-white/[0.03] active:bg-white/[0.05] transition"
                aria-expanded={open}
              >
                <span className="text-sm sm:text-base font-semibold text-foreground capitalize">
                  {monthLabelLong(row.ym)}
                </span>
                <span className="flex items-center gap-2.5 shrink-0 ml-2">
                  <span
                    className="text-sm sm:text-base font-bold tabular-nums min-w-[3.5rem] text-right"
                    style={{
                      color:
                        rate >= 40
                          ? "#3ecf8e"
                          : rate > 0
                            ? "#f5a623"
                            : "var(--ft-muted-foreground)",
                    }}
                  >
                    ({rate}%)
                  </span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {open && (
                <div className="px-5 sm:px-7 pb-5 -mt-1">
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, rate))}%`,
                        backgroundColor:
                          rate >= 40 ? "#3ecf8e" : rate > 0 ? "#f5a623" : "rgba(255,255,255,0.2)",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <Detail label="Доходы" value={formatAmount(row.totalIncome)} valueClass="text-emerald-glow" />
                    <Detail label="Расходы" value={formatAmount(row.totalExpenses)} valueClass="text-warning" />
                    <Detail
                      label="Сбережения"
                      value={formatAmount(row.savings ?? row.totalIncome - row.totalExpenses)}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                    {rate >= 70
                      ? "Отличный месяц: большая часть дохода сохранена."
                      : rate >= 40
                        ? "Хороший баланс между тратами и накоплением."
                        : rate > 0
                          ? "Расходы съели заметную долю дохода — есть куда подтянуть."
                          : "Доходов не было или расходы превысили поступления."}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Detail({ label, value, valueClass = "text-foreground" }) {
  return (
    <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">{label}</p>
      <p className={`font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
