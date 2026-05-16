import React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { monthLabel } from "../../lib/ftUtils";
import { addMonthsYM, currentYM, periodDescription } from "../../lib/periodUtils";
import FtMonthPicker from "./FtMonthPicker";

const MODES = [
  { id: "month", label: "Месяц" },
  { id: "3m", label: "3 мес" },
  { id: "6m", label: "6 мес" },
  { id: "year", label: "Год" },
  { id: "all", label: "Всё" },
  { id: "range", label: "Период" },
];

export default function PeriodSelector({ period, onChange, compact = false }) {
  const setMode = (mode) => onChange({ ...period, mode });
  const anchor = period.anchorYM || currentYM();

  const shiftAnchor = (delta) => {
    onChange({ ...period, anchorYM: addMonthsYM(anchor, delta) });
  };

  const goCurrentMonth = () => {
    onChange({ ...period, anchorYM: currentYM(), mode: period.mode === "all" ? "month" : period.mode });
  };

  const isCurrentMonth = anchor === currentYM();

  return (
    <div className={`flex flex-col gap-3 ${compact ? "" : "mb-2"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {period.mode !== "all" && period.mode !== "range" && (
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
            <button
              type="button"
              onClick={() => shiftAnchor(-1)}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/[0.06] text-muted-foreground"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goCurrentMonth}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-w-[120px] text-center transition ${
                isCurrentMonth ? "text-emerald-glow" : "text-foreground hover:bg-white/[0.06]"
              }`}
              title="Перейти к текущему месяцу"
            >
              {monthLabel(anchor)}
            </button>
            <button
              type="button"
              onClick={() => shiftAnchor(1)}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/[0.06] text-muted-foreground"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border flex-wrap">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period.mode === m.id
                  ? "bg-emerald-glow text-primary-foreground shadow-[0_0_16px_oklch(0.72_0.18_162/0.25)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {period.mode === "range" && (
        <div className="flex flex-wrap gap-3 items-end p-4 rounded-2xl border border-border bg-surface/60">
          <FtMonthPicker
            label="С"
            value={period.fromYM}
            onChange={(fromYM) => onChange({ ...period, fromYM })}
          />
          <FtMonthPicker
            label="По"
            value={period.toYM}
            onChange={(toYM) => onChange({ ...period, toYM })}
          />
        </div>
      )}

      {!compact && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          {periodDescription(period)}
        </p>
      )}
    </div>
  );
}
