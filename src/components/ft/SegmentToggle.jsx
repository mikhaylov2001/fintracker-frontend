import React from "react";

const DESKTOP_ACTIVE =
  "sm:bg-emerald-glow sm:text-primary-foreground sm:shadow-[0_0_20px_oklch(0.72_0.18_162/0.3)]";

/**
 * Переключатель-сегменты.
 * classicDesktop — на sm+ стиль Lovable; на мобильных — ft-segment-bar (капсула).
 */
export default function SegmentToggle({
  value,
  onChange,
  options,
  className = "",
  pill = true,
  stretch = false,
  classicDesktop = false,
}) {
  if (classicDesktop) {
    return (
      <div
        className={`inline-flex max-w-full gap-0.5 p-1 ${
          pill ? "rounded-full" : "rounded-xl"
        } ${stretch ? "w-full sm:w-auto" : ""} max-sm:ft-segment-bar max-sm:!w-full sm:bg-surface/80 sm:border sm:border-border ${className}`}
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
              className={`max-sm:ft-segment-btn max-sm:flex-1 sm:flex-none px-3 sm:px-4 py-2.5 min-h-[2.75rem] text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                pill ? "rounded-full" : "rounded-lg"
              } ${
                active
                  ? `max-sm:ft-segment-active ${DESKTOP_ACTIVE}`
                  : "max-sm:text-[var(--ft-muted-foreground)] text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`ft-segment-bar ${stretch ? "!w-full" : ""} ${className}`}
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
            className={`ft-segment-btn ${pill ? "" : "!rounded-lg"} ${
              active ? opt.activeClass || "ft-segment-active" : ""
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
