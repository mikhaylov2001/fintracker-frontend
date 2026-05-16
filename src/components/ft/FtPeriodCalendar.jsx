import React, { useEffect, useRef, useState } from "react";
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

/**
 * Календарь периода: один месяц или диапазон «с — по» в одной сетке.
 */
export default function FtPeriodCalendar({ period, onChange, disabled = false }) {
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

  const buttonLabel =
    period.mode === "range" && period.fromYM && period.toYM
      ? periodDescription(period)
      : period.mode === "all"
        ? "Режим: Всё"
        : `Режим: ${MODE_LABELS[period.mode] || "Месяц"}`;

  const rangeFrom = period.fromYM;
  const rangeTo = period.toYM;

  const inRange = (ym) => {
    if (pickKind !== "range") return false;
    if (rangeDraft && !rangeTo && ym === rangeDraft) return true;
    if (!rangeFrom || !rangeTo) return false;
    const [f, t] = orderYM(rangeFrom, rangeTo);
    const n = ymToNum(ym);
    return n >= ymToNum(f) && n <= ymToNum(t);
  };

  const isEdge = (ym, edge) => {
    if (pickKind !== "range") return false;
    if (rangeDraft && edge === "from") return ym === rangeDraft;
    if (rangeFrom && rangeTo) {
      const [f, t] = orderYM(rangeFrom, rangeTo);
      return edge === "from" ? ym === f : ym === t;
    }
    return false;
  };

  const pickMonth = (month) => {
    const ym = toYM({ year: viewYear, month });

    if (pickKind === "single") {
      if (period.mode === "year") {
        onChange({ ...period, anchorYM: ym });
      } else {
        onChange({ ...period, mode: "month", anchorYM: ym });
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

  const openCalendar = () => {
    if (disabled || period.mode === "all") return;
    setOpen((o) => !o);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={openCalendar}
        disabled={disabled || period.mode === "all"}
        className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border text-xs sm:text-sm font-bold transition whitespace-nowrap ${
          period.mode === "all"
            ? "opacity-70 cursor-default border-border bg-[oklch(0.25_0.008_285/0.72)] text-muted-foreground"
            : "border-[oklch(0.72_0.18_162/0.18)] bg-[oklch(0.25_0.008_285/0.72)] text-foreground hover:border-[oklch(0.72_0.18_162/0.32)]"
        }`}
      >
        <CalendarDays className="size-4 text-emerald-glow shrink-0" strokeWidth={2} />
        <span>{buttonLabel}</span>
      </button>

      {open && (
        <div
          className="absolute z-[70] left-0 mt-2 p-4 rounded-2xl border border-border bg-surface shadow-2xl w-[min(100vw-2rem,300px)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1 p-1 mb-4 rounded-xl bg-black/25 border border-border">
            <button
              type="button"
              onClick={() => {
                setPickKind("single");
                setRangeDraft(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                pickKind === "single"
                  ? "bg-emerald-glow text-black shadow-[0_0_16px_rgba(62,207,142,0.35)]"
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
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                pickKind === "range"
                  ? "bg-emerald-glow text-black shadow-[0_0_16px_rgba(62,207,142,0.35)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              С — По
            </button>
          </div>

          {pickKind === "range" && (
            <div className="flex gap-2 mb-3 text-[11px]">
              <span className="flex-1 rounded-lg bg-white/[0.04] border border-border px-2.5 py-1.5">
                <span className="text-muted-foreground">С </span>
                <span className="font-semibold">
                  {rangeDraft
                    ? monthLabel(rangeDraft)
                    : rangeFrom
                      ? monthLabel(orderYM(rangeFrom, rangeTo || rangeFrom)[0])
                      : "—"}
                </span>
              </span>
              <span className="flex-1 rounded-lg bg-white/[0.04] border border-border px-2.5 py-1.5">
                <span className="text-muted-foreground">По </span>
                <span className="font-semibold">
                  {rangeTo ? monthLabel(rangeTo) : rangeDraft ? "…" : "—"}
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/[0.06]"
              aria-label="Предыдущий год"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (period.mode === "year") {
                  onChange({ ...period, anchorYM: toYM({ year: viewYear, month: 1 }) });
                }
              }}
              className={`text-sm font-bold px-2 py-1 rounded-lg ${
                period.mode === "year" ? "hover:bg-white/[0.06]" : ""
              }`}
              title={period.mode === "year" ? "Выбрать этот год" : undefined}
            >
              {viewYear}
            </button>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/[0.06]"
              aria-label="Следующий год"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {period.mode === "year" && pickKind === "single" && (
            <button
              type="button"
              onClick={() => {
                onChange({ ...period, anchorYM: toYM({ year: viewYear, month: 1 }) });
                setOpen(false);
              }}
              className="w-full mb-3 py-2 rounded-xl text-xs font-semibold bg-emerald-glow/15 text-emerald-glow border border-emerald-glow/30 hover:bg-emerald-glow/25"
            >
              Весь {viewYear} год
            </button>
          )}

          <div className="grid grid-cols-3 gap-2">
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
              const ranged = inRange(ym);

              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => pickMonth(m)}
                  className={`py-2 rounded-lg text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-glow text-black shadow-[0_0_12px_rgba(62,207,142,0.4)]"
                      : ranged
                        ? "bg-emerald-glow/20 text-emerald-glow"
                        : "hover:bg-white/[0.06] text-foreground"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {pickKind === "range" && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => applyQuickRange(3)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
              >
                3 мес
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange(6)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
              >
                6 мес
              </button>
              {rangeDraft && (
                <button
                  type="button"
                  onClick={() => setRangeDraft(null)}
                  className="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Сбросить
                </button>
              )}
            </div>
          )}

          <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
            {pickKind === "range"
              ? rangeDraft
                ? "Выберите конечный месяц"
                : "Выберите начальный месяц, затем конечный"
              : period.mode === "year"
                ? "Месяц задаёт год · или кнопка «Весь год»"
                : "Нажмите месяц для выбора"}
          </p>
        </div>
      )}
    </div>
  );
}
