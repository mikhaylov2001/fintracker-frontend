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
  const showMonthNav = period.mode !== "all" && period.mode !== "range";

  return (
    <div
      className={`flex flex-col gap-4 sm:gap-5 ${compact ? "mb-8" : "mb-6"}`}
    >
      {showMonthNav && (
        <div className="flex justify-start sm:justify-center lg:justify-start">
          <div className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-2xl p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => shiftAnchor(-1)}
              className="size-9 grid place-items-center rounded-xl hover:bg-white/[0.06] text-muted-foreground transition"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goCurrentMonth}
              className={`px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold min-w-[148px] text-center transition ${
                isCurrentMonth ? "text-emerald-glow" : "text-foreground hover:bg-white/[0.06]"
              }`}
              title="Перейти к текущему месяцу"
            >
              {monthLabel(anchor)}
            </button>
            <button
              type="button"
              onClick={() => shiftAnchor(1)}
              className="size-9 grid place-items-center rounded-xl hover:bg-white/[0.06] text-muted-foreground transition"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1 pb-0.5 scrollbar-none">
        <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1.5 bg-surface p-1.5 rounded-2xl border border-border">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                period.mode === m.id
                  ? "bg-emerald-glow text-primary-foreground shadow-[0_0_16px_oklch(0.72_0.18_162/0.25)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {period.mode === "range" && (
        <div className="flex flex-wrap gap-4 sm:gap-5 items-end p-5 sm:p-6 rounded-2xl border border-border bg-surface/60">
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

      <p
        className={`text-xs sm:text-sm text-muted-foreground flex items-start sm:items-center gap-2 leading-relaxed ${
          compact ? "pt-0.5" : ""
        }`}
      >
        <CalendarDays className="size-4 shrink-0 mt-0.5 sm:mt-0" />
        {periodDescription(period)}
      </p>
    </div>
  );
}
