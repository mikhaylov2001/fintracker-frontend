import React from "react";
import { currentYM } from "../../lib/periodUtils";
import FtPeriodCalendar from "./FtPeriodCalendar";
import SegmentToggle from "./SegmentToggle";

const SEGMENTS = [
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "all", label: "Всё" },
];

const SEGMENT_ACTIVE = "ft-segment-active";

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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:flex-wrap sm:justify-end">
      <FtPeriodCalendar period={period} onChange={onChange} />
      <SegmentToggle
        stretch
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
    return <div className="w-full min-w-0 sm:w-auto sm:shrink-0">{controls}</div>;
  }

  return <div className="mb-6 lg:mb-8">{controls}</div>;
}
