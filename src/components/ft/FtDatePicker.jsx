import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function CalendarGrid({ value, onChange, maxDate, minDate, view, setView, onPick }) {
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
    const iso = toISO(date);
    onChange(iso);
    onPick?.(iso);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
          className="size-9 grid place-items-center rounded-xl border border-border/80 bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground transition"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold capitalize tracking-tight">{monthTitle}</span>
        <button
          type="button"
          onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          className="size-9 grid place-items-center rounded-xl border border-border/80 bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground transition"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 px-0.5">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-center text-muted-foreground py-1"
          >
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 px-0.5">
        {cells.map((date, i) => {
          if (!date) return <span key={`e-${i}`} className="h-10" />;
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
              className={`relative h-10 rounded-xl text-sm font-medium transition ${
                isSel
                  ? "bg-emerald-glow text-primary-foreground shadow-[0_0_16px_oklch(0.72_0.18_162/0.35)]"
                  : isToday
                    ? "text-emerald-glow ring-1 ring-emerald-glow/40 bg-emerald-glow/10"
                    : "text-foreground hover:bg-white/[0.07]"
              } ${off ? "opacity-25 cursor-not-allowed hover:bg-transparent" : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/80">
        <button
          type="button"
          onClick={() => {
            onChange("");
            onPick?.("");
          }}
          className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-white/[0.05] transition"
        >
          Очистить
        </button>
        <button
          type="button"
          onClick={() => pick(today)}
          className="text-xs font-semibold text-emerald-glow hover:brightness-110 px-2 py-1 rounded-lg hover:bg-emerald-glow/10 transition"
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
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0, width: 300 });

  const selected = parseISO(value) || parseISO(todayISO());
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 300);
    const panelHeight = panelRef.current?.offsetHeight || 360;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < panelHeight && spaceAbove > spaceBelow;

    let top = openUp ? rect.top - panelHeight - gap : rect.bottom + gap;
    top = Math.max(8, Math.min(top, window.innerHeight - panelHeight - 8));

    let left = rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    setPanelStyle({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const onLayout = () => updatePanelPosition();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (value) {
      const d = parseISO(value);
      if (d) setView(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`ft-input w-full flex items-center justify-between gap-2 text-left transition ${
          open ? "border-emerald-glow/50 bg-white/[0.06]" : ""
        }`}
      >
        <span className={value ? "text-foreground font-medium" : "text-muted-foreground"}>
          {value ? formatDateRu(value) : placeholder}
        </span>
        <CalendarDays className={`size-4 shrink-0 transition ${open ? "text-emerald-glow" : "text-muted-foreground"}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: panelStyle.top,
              left: panelStyle.left,
              width: panelStyle.width,
              zIndex: 9999,
            }}
            className="p-4 rounded-2xl border border-border/90 bg-surface/95 backdrop-blur-xl shadow-[0_20px_60px_oklch(0_0_0/0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            {value && (
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
                Выбрано: <span className="text-emerald-glow font-semibold">{formatDateRu(value)}</span>
              </p>
            )}
            <CalendarGrid
              value={value}
              onChange={onChange}
              maxDate={maxDate}
              minDate={minDate}
              view={view}
              setView={setView}
              onPick={() => close()}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
