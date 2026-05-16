import React from "react";
import { CalendarDays } from "lucide-react";
import { currentYM, periodDescription } from "../../lib/periodUtils";
import FtPeriodCalendar from "./FtPeriodCalendar";
import SegmentToggle from "./SegmentToggle";

const SEGMENTS = [
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "all", label: "Всё" },
];

export default function PeriodSelector({ period, onChange, compact = false }) {
  const setMode = (mode) => {
    const next = { ...period, mode };
    if (mode === "month" && !next.anchorYM) next.anchorYM = currentYM();
    if (mode === "year" && !next.anchorYM) next.anchorYM = currentYM();
    onChange(next);
  };

  const segmentValue =
    period.mode === "range" || period.mode === "3m" || period.mode === "6m"
      ? "month"
      : SEGMENTS.some((s) => s.id === period.mode)
        ? period.mode
        : "month";

  return (
    <div className={`flex flex-col gap-3 ${compact ? "mb-8" : "mb-6"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <FtPeriodCalendar period={period} onChange={onChange} />

        <SegmentToggle
          value={segmentValue}
          onChange={setMode}
          className="w-full sm:w-auto"
          options={SEGMENTS.map((s) => ({
            id: s.id,
            label: s.label,
            activeClass:
              "bg-emerald-glow text-black shadow-[0_0_20px_rgba(62,207,142,0.35)]",
          }))}
        />
      </div>

      <p
        className={`text-xs text-muted-foreground flex items-start sm:items-center gap-2 leading-relaxed ${
          compact ? "" : ""
        }`}
      >
        <CalendarDays className="size-4 shrink-0 mt-0.5 sm:mt-0" />
        {periodDescription(period)}
      </p>
    </div>
  );
}
