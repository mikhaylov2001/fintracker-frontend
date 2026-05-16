import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "../../lib/ftUtils";
import { parseYM, toYM } from "../../lib/periodUtils";

const MONTHS_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export default function FtMonthPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const parsed = parseYM(value);
  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear());

  useEffect(() => {
    if (parsed?.year) setViewYear(parsed.year);
  }, [value, parsed?.year]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (month) => {
    onChange(toYM({ year: viewYear, month }));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative flex-1 min-w-[140px]">
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5 block">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ft-input w-full flex items-center justify-between gap-2 text-left text-sm"
      >
        <span>{value ? monthLabel(value) : "—"}</span>
        <CalendarDays className="size-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div
          className="absolute z-[60] left-0 mt-2 p-4 rounded-2xl border border-border bg-surface shadow-2xl w-[260px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/[0.06]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-bold">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/[0.06]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS_SHORT.map((name, idx) => {
              const m = idx + 1;
              const ym = toYM({ year: viewYear, month: m });
              const active = value === ym;
              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => pick(m)}
                  className={`py-2 rounded-lg text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-glow text-primary-foreground"
                      : "hover:bg-white/[0.06] text-foreground"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
