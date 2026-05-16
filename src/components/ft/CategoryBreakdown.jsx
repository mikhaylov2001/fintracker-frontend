import React, { useMemo } from "react";
import SegmentToggle from "./SegmentToggle";

const COLOR_EXPENSE = "#f5a623";
const COLOR_INCOME = "#3ecf8e";

export default function CategoryBreakdown({
  expenseCategories = [],
  incomeCategories = [],
  formatAmount,
  kind,
  onKindChange,
  loading = false,
}) {
  const isExpense = kind === "expense";
  const categories = isExpense ? expenseCategories : incomeCategories;
  const color = isExpense ? COLOR_EXPENSE : COLOR_INCOME;
  const max = categories[0]?.amount || 1;

  const total = useMemo(
    () => categories.reduce((s, c) => s + c.amount, 0),
    [categories]
  );

  return (
    <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold mb-1">Топ категорий</h2>
          <p className="text-xs text-muted-foreground">
            {isExpense ? "Куда уходят деньги" : "Откуда приходят"} за выбранный период
          </p>
        </div>
        <SegmentToggle
          value={kind}
          onChange={onKindChange}
          options={[
            {
              id: "expense",
              label: "Расходы",
              activeClass:
                "bg-[#f5a623] text-black shadow-[0_0_20px_rgba(245,166,35,0.4)]",
            },
            {
              id: "income",
              label: "Доходы",
              activeClass:
                "bg-[#3ecf8e] text-black shadow-[0_0_20px_rgba(62,207,142,0.4)]",
            },
          ]}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Загрузка категорий…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {isExpense ? "Нет расходов за период." : "Нет доходов за период."}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-4">
            Всего:{" "}
            <span className="font-semibold tabular-nums" style={{ color }}>
              {formatAmount(total)}
            </span>
            {" · "}
            {categories.length}{" "}
            {categories.length === 1 ? "категория" : categories.length < 5 ? "категории" : "категорий"}
          </p>
          <ul className="space-y-4 flex-1">
            {categories.map((c, i) => (
              <li key={c.name}>
                <div className="flex justify-between text-sm mb-1.5 gap-3">
                  <span className="font-medium truncate flex items-center gap-2 min-w-0">
                    <span
                      className="size-5 rounded-md grid place-items-center text-[10px] font-bold shrink-0 text-black/80"
                      style={{ backgroundColor: color, opacity: 1 - i * 0.06 }}
                    >
                      {i + 1}
                    </span>
                    {c.name}
                  </span>
                  <span className="font-semibold tabular-nums shrink-0" style={{ color }}>
                    {formatAmount(c.amount)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(c.amount / max) * 100}%`,
                      backgroundColor: color,
                      opacity: Math.max(0.45, 1 - i * 0.08),
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
