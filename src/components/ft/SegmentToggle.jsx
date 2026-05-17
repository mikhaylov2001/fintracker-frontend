import React from "react";

const DESKTOP_ACTIVE =
  "bg-emerald-glow text-primary-foreground shadow-[0_0_20px_oklch(0.72_0.18_162/0.3)]";

/**
 * Переключатель-сегменты.
 * classicDesktop — отдельная вёрстка: мобильная капсула (sm:hidden) + Lovable на sm+.
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
    const mobileBar = `ft-segment-bar ${stretch ? "w-full" : ""}`;
    const desktopBar = `hidden sm:inline-flex max-w-full gap-0.5 p-1 ${
      pill ? "rounded-full" : "rounded-xl"
    } bg-surface/80 border border-border ${className}`;

    const renderButtons = (variant) =>
      options.map((opt) => {
        const active = value === opt.id;
        const isMobile = variant === "mobile";

        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={
              isMobile
                ? `ft-segment-btn ${pill ? "" : "!rounded-lg"} ${
                    active ? "ft-segment-active" : ""
                  }`
                : `px-4 py-2.5 min-h-[2.75rem] text-sm font-semibold transition-all whitespace-nowrap ${
                    pill ? "rounded-full" : "rounded-lg"
                  } ${
                    active
                      ? DESKTOP_ACTIVE
                      : "text-muted-foreground hover:text-foreground"
                  }`
            }
          >
            {opt.label}
          </button>
        );
      });

    return (
      <>
        <div className={`sm:hidden ${mobileBar}`} role="tablist">
          {renderButtons("mobile")}
        </div>
        <div className={desktopBar} role="tablist">
          {renderButtons("desktop")}
        </div>
      </>
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
