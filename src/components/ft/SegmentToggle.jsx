import React from "react";

const ACTIVE =
  "bg-emerald-glow text-primary-foreground shadow-[0_0_20px_oklch(0.72_0.18_162/0.3)]";

/**
 * Переключатель-сегменты в стиле Lovable (pill).
 */
export default function SegmentToggle({ value, onChange, options, className = "", pill = true }) {
  return (
    <div
      className={`inline-flex max-w-full gap-0.5 p-1 ${
        pill ? "rounded-full" : "rounded-xl"
      } bg-surface/80 border border-border ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`px-3 sm:px-4 py-2.5 min-h-[2.75rem] text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              pill ? "rounded-full" : "rounded-lg"
            } ${active ? opt.activeClass || ACTIVE : "text-muted-foreground hover:text-foreground"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
