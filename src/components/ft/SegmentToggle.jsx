import React from "react";

/**
 * Переключатель-сегменты в стиле Lovable (pill).
 */
export default function SegmentToggle({ value, onChange, options, className = "", pill = true }) {
  return (
    <div
      className={`inline-flex gap-0.5 p-1 ${
        pill ? "rounded-full" : "rounded-xl"
      } bg-[oklch(0.25_0.008_285/0.72)] border border-[oklch(1_0_0/12%)] ${className}`}
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
            className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              pill ? "rounded-full" : "rounded-lg"
            } ${
              active
                ? opt.activeClass ||
                  "bg-[#22C55E] text-[#05140C] shadow-[0_0_16px_rgba(34,197,94,0.35)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
