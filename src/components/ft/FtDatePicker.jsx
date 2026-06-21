import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateRu, todayISO } from "../../lib/ftUtils";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function parseISO(iso) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function CalendarGrid({ value, onChange, maxDate, minDate, view, setView }) {
  const cells = useMemo(() => {
    const y = view.getFullYear();
    const m = view.getMonth();
    const first = new Date(y, m, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < startPad; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(y, m, d));
    return out;
  }, [view]);

  const monthTitle = view.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const today = parseISO(todayISO());

  const isDisabled = (date) => {
    if (!date) return true;
    const iso = toISO(date);
    if (maxDate && iso > maxDate) return true;
    if (minDate && iso < minDate) return true;
    return false;
  };

  const pick = (date) => {
    if (!date || isDisabled(date)) return;
    onChange(toISO(date));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
          className="ft-touch grid place-items-center rounded-lg hover:bg-white/[0.06] text-muted-foreground"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold capitalize">{monthTitle}</span>
        <button
          type="button"
          onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          className="ft-touch grid place-items-center rounded-lg hover:bg-white/[0.06] text-muted-foreground"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] font-semibold text-center text-muted-foreground py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`e-${i}`} />;
          const iso = toISO(date);
          const isSel = value && iso === value;
          const isToday = sameDay(date, today);
          const off = isDisabled(date);
          return (
            <button
              key={iso}
              type="button"
              disabled={off}
              onClick={() => pick(date)}
              className={`min-h-[2.5rem] h-10 rounded-lg text-sm font-medium transition ${
                isSel
                  ? "bg-emerald-glow text-primary-foreground"
                  : isToday
                    ? "ring-1 ring-emerald-glow/50 text-emerald-glow"
                    : "hover:bg-white/[0.06] text-foreground"
              } ${off ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end mt-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => pick(today)}
          className="text-xs font-semibold text-emerald-glow hover:brightness-110 px-2 py-1"
        >
          Сегодня
        </button>
      </div>
    </>
  );
}

export default function FtDatePicker({
  value,
  onChange,
  maxDate,
  minDate,
  placeholder = "Выберите дату",
  inline = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = parseISO(value) || parseISO(todayISO());
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (value) {
      const d = parseISO(value);
      if (d) setView(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  if (inline) {
    return (
      <div className="rounded-2xl border border-border bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays className="size-4 text-emerald-glow shrink-0" />
            <span className="text-sm font-semibold truncate">
              {value ? formatDateRu(value) : placeholder}
            </span>
          </div>
        </div>
        <CalendarGrid
          value={value}
          onChange={onChange}
          maxDate={maxDate}
          minDate={minDate}
          view={view}
          setView={setView}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ft-input w-full flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? formatDateRu(value) : placeholder}
        </span>
        <CalendarDays className="size-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div
          className="absolute z-[60] left-0 right-0 mt-2 p-4 rounded-2xl border border-border bg-surface shadow-2xl min-w-[280px]"
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarGrid
            value={value}
            onChange={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
            maxDate={maxDate}
            minDate={minDate}
            view={view}
            setView={setView}
          />
        </div>
      )}
    </div>
  );
}
