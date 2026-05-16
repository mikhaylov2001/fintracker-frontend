import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "../../lib/ftUtils";
import {
  addMonthsYM,
  currentYM,
  orderYM,
  parseYM,
  periodDescription,
  toYM,
  ymToNum,
} from "../../lib/periodUtils";

const MONTHS_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

const MODE_LABELS = {
  month: "Месяц",
  year: "Год",
  all: "Всё",
  range: "Период",
  "3m": "3 мес",
  "6m": "6 мес",
};

function shortMonth(ym) {
  const p = parseYM(ym);
  if (!p) return "—";
  return new Date(p.year, p.month - 1, 1).toLocaleDateString("ru-RU", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Календарь периода: месяц или диапазон «с — по» в современном popover.
 */
export default function FtPeriodCalendar({ period, onChange }) {
  const [open, setOpen] = useState(false);
  const [pickKind, setPickKind] = useState("single");
  const [rangeDraft, setRangeDraft] = useState(null);
  const rootRef = useRef(null);

  const anchor = period.anchorYM || currentYM();
  const parsed = parseYM(anchor);
  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear());

  useEffect(() => {
    if (period.mode === "range") setPickKind("range");
    else if (period.mode === "month") setPickKind("single");
  }, [period.mode]);

  useEffect(() => {
    if (parsed?.year) setViewYear(parsed.year);
  }, [anchor, parsed?.year]);

  useEffect(() => {
    if (!open) {
      setRangeDraft(null);
      return;
    }
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const rangeFrom = period.fromYM;
  const rangeTo = period.toYM;

  const displayFrom = useMemo(() => {
    if (pickKind === "range" && rangeDraft) return rangeDraft;
    if (rangeFrom) return orderYM(rangeFrom, rangeTo || rangeFrom)[0];
    return null;
  }, [pickKind, rangeDraft, rangeFrom, rangeTo]);

  const displayTo = useMemo(() => {
    if (pickKind === "range" && rangeDraft && !rangeTo) return null;
    if (rangeTo) return orderYM(rangeFrom, rangeTo)[1];
    if (pickKind === "single" && period.mode === "month") return anchor;
    return null;
  }, [pickKind, rangeDraft, rangeFrom, rangeTo, period.mode, anchor]);

  const buttonLabel =
    period.mode === "range" && period.fromYM && period.toYM
      ? periodDescription(period)
      : period.mode === "all"
        ? "Режим: Всё"
        : period.mode === "month"
          ? `Режим: ${monthLabel(anchor)}`
          : `Режим: ${MODE_LABELS[period.mode] || "Месяц"}`;

  const inRange = (ym) => {
    if (pickKind !== "range") return false;
    if (rangeDraft && !rangeTo && ym === rangeDraft) return true;
    if (!displayFrom || !displayTo) return false;
    const [f, t] = orderYM(displayFrom, displayTo);
    const n = ymToNum(ym);
    return n >= ymToNum(f) && n <= ymToNum(t);
  };

  const isEdge = (ym, edge) => {
    if (pickKind !== "range") return false;
    if (rangeDraft && !rangeTo && edge === "from") return ym === rangeDraft;
    if (!displayFrom || !displayTo) return false;
    const [f, t] = orderYM(displayFrom, displayTo);
    return edge === "from" ? ym === f : ym === t;
  };

  const pickMonth = (month) => {
    const ym = toYM({ year: viewYear, month });

    if (pickKind === "single") {
      if (period.mode === "year") {
        onChange({ ...period, anchorYM: ym });
      } else {
        onChange({ ...period, mode: "month", anchorYM: ym, fromYM: ym, toYM: ym });
      }
      setOpen(false);
      return;
    }

    if (!rangeDraft) {
      setRangeDraft(ym);
      return;
    }

    const [from, to] = orderYM(rangeDraft, ym);
    onChange({
      ...period,
      mode: "range",
      fromYM: from,
      toYM: to,
      anchorYM: to,
    });
    setRangeDraft(null);
    setOpen(false);
  };

  const applyQuickRange = (months) => {
    const to = anchor;
    const from = addMonthsYM(to, -(months - 1));
    onChange({
      ...period,
      mode: "range",
      fromYM: from,
      toYM: to,
      anchorYM: to,
    });
    setRangeDraft(null);
    setOpen(false);
  };

  const applyYearRange = () => {
    const from = toYM({ year: viewYear, month: 1 });
    const to = toYM({ year: viewYear, month: 12 });
    onChange({
      ...period,
      mode: "range",
      fromYM: from,
      toYM: to,
      anchorYM: to,
    });
    setRangeDraft(null);
    setOpen(false);
  };

  const openCalendar = () => setOpen((o) => !o);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={openCalendar}
        className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border text-xs sm:text-sm font-bold transition whitespace-nowrap border-emerald-glow/20 bg-muted/80 text-foreground hover:border-emerald-glow/35"
      >
        <CalendarDays className="size-4 text-emerald-glow shrink-0" strokeWidth={2} />
        <span className="max-w-[min(52vw,14rem)] truncate">{buttonLabel}</span>
      </button>

      {open && (
        <div
          className="absolute z-[70] left-0 sm:left-auto sm:right-0 mt-2 p-4 sm:p-5 rounded-3xl border border-border bg-surface shadow-2xl w-[min(100vw-1.5rem,360px)]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Период
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div
              className={`rounded-xl border px-3 py-2.5 transition ${
                pickKind === "range" && !displayFrom
                  ? "border-emerald-glow/50 bg-emerald-glow/10"
                  : "border-border bg-white/[0.03]"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                С
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {displayFrom ? shortMonth(displayFrom) : "—"}
              </span>
            </div>
            <div
              className={`rounded-xl border px-3 py-2.5 transition ${
                pickKind === "range" && rangeDraft && !rangeTo
                  ? "border-emerald-glow/50 bg-emerald-glow/10"
                  : "border-border bg-white/[0.03]"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                По
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {displayTo ? shortMonth(displayTo) : rangeDraft ? "…" : "—"}
              </span>
            </div>
          </div>

          <div className="flex gap-1 p-1 mb-4 rounded-full bg-black/30 border border-border">
            <button
              type="button"
              onClick={() => {
                setPickKind("single");
                setRangeDraft(null);
              }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold transition ${
                pickKind === "single"
                  ? "bg-emerald-glow text-primary-foreground shadow-[0_0_16px_oklch(0.72_0.18_162/0.35)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => {
                setPickKind("range");
                setRangeDraft(rangeFrom || null);
              }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold transition ${
                pickKind === "range"
                  ? "bg-emerald-glow text-primary-foreground shadow-[0_0_16px_oklch(0.72_0.18_162/0.35)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              С — По
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {[
              { label: "3 мес", months: 3 },
              { label: "6 мес", months: 6 },
              { label: "12 мес", months: 12 },
            ].map(({ label, months }) => (
              <button
                key={label}
                type="button"
                onClick={() => applyQuickRange(months)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-emerald-glow/30 hover:bg-emerald-glow/10 transition"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={applyYearRange}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-emerald-glow/30 hover:bg-emerald-glow/10 transition"
            >
              {viewYear} год
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="size-9 grid place-items-center rounded-xl border border-border hover:bg-white/[0.06] transition"
              aria-label="Предыдущий год"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-base font-bold tabular-nums">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="size-9 grid place-items-center rounded-xl border border-border hover:bg-white/[0.06] transition"
              aria-label="Следующий год"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS_SHORT.map((name, idx) => {
              const m = idx + 1;
              const ym = toYM({ year: viewYear, month: m });
              const yearActive =
                period.mode === "year" &&
                pickKind === "single" &&
                parseYM(anchor)?.year === viewYear;
              const active =
                pickKind === "single"
                  ? (period.mode === "month" && anchor === ym) ||
                    (yearActive && parseYM(anchor)?.month === m)
                  : isEdge(ym, "from") || isEdge(ym, "to");
              const ranged = inRange(ym) && !active;

              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => pickMonth(m)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-glow text-primary-foreground shadow-[0_0_12px_oklch(0.72_0.18_162/0.4)]"
                      : ranged
                        ? "bg-emerald-glow/15 text-emerald-glow border border-emerald-glow/20"
                        : "hover:bg-white/[0.06] text-foreground border border-transparent"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border gap-2">
            <p className="text-[10px] text-muted-foreground leading-relaxed flex-1">
              {pickKind === "range"
                ? rangeDraft
                  ? "Выберите конечный месяц"
                  : "Выберите начало и конец периода"
                : "Один месяц для отчёта"}
            </p>
            {rangeDraft && (
              <button
                type="button"
                onClick={() => setRangeDraft(null)}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
