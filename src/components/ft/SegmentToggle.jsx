import React from "react";

/**
 * Переключатель-сегменты (Расходы / Доходы и т.п.)
 */
export default function SegmentToggle({ value, onChange, options, className = "" }) {
  return (
    <div
      className={`inline-flex flex-wrap gap-1 p-1 rounded-xl bg-black/20 border border-border ${className}`}
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
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              active
                ? opt.activeClass ||
                  "bg-emerald-glow text-primary-foreground shadow-[0_0_16px_oklch(0.72_0.18_162/0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
