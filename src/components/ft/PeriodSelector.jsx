import React from "react";
import { currentYM } from "../../lib/periodUtils";
import FtPeriodCalendar from "./FtPeriodCalendar";
import SegmentToggle from "./SegmentToggle";

const SEGMENTS = [
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "all", label: "Всё" },
];

const SEGMENT_ACTIVE = "bg-[#22C55E] text-[#05140C]";

/**
 * Период: chip-календарь + Месяц | Год | Всё (как Lovable).
 * variant="header" — только контролы, для правой части шапки.
 */
export default function PeriodSelector({ period, onChange, variant = "default" }) {
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

  const controls = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
      <FtPeriodCalendar period={period} onChange={onChange} />
      <SegmentToggle
        value={segmentValue}
        onChange={setMode}
        options={SEGMENTS.map((s) => ({
          id: s.id,
          label: s.label,
          activeClass: SEGMENT_ACTIVE,
        }))}
      />
    </div>
  );

  if (variant === "header") {
    return <div className="shrink-0 w-full sm:w-auto">{controls}</div>;
  }

  return <div className="mb-6 lg:mb-8">{controls}</div>;
}
