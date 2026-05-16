import React from "react";
import { CalendarDays } from "lucide-react";
import { currentYM } from "../../lib/periodUtils";

const MODES = [
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "all", label: "Всё" },
];

const MODE_CHIP = {
  month: "Месяц",
  year: "Год",
  all: "Всё",
  range: "Период",
};

/**
 * Переключатель периода в шапке дашборда — как в Lovable.
 */
export default function DashboardPeriodBar({ period, onChange }) {
  const setMode = (mode) => {
    const next = { ...period, mode };
    if ((mode === "month" || mode === "year") && !next.anchorYM) {
      next.anchorYM = currentYM();
    }
    onChange(next);
  };

  const chipLabel = MODE_CHIP[period.mode] || "Месяц";
  const activeMode =
    period.mode === "range" || period.mode === "3m" || period.mode === "6m"
      ? "month"
      : MODES.some((m) => m.id === period.mode)
        ? period.mode
        : "month";

  return (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-muted-foreground">
        <CalendarDays className="size-3.5 text-emerald-glow" strokeWidth={2} />
        Режим: {chipLabel}
      </div>
      <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === m.id
                ? "bg-emerald-glow text-primary-foreground shadow-[0_0_20px_oklch(0.72_0.18_162/0.35)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
