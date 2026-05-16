import React from "react";

const GLOW = "shadow-[0_0_22px_oklch(0.72_0.18_162/0.55)]";

/**
 * Логотип FinTrackerPro — зелёное кольцо + название (+ имя пользователя).
 */
export default function AppLogo({ userName, compact = false, className = "" }) {
  const iconOuter = compact ? "size-7" : "size-11";
  const iconInner = compact ? "size-2.5" : "size-4";
  const title = compact ? "text-sm" : "text-lg";

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <div
        className={`${iconOuter} rounded-full bg-emerald-glow ${GLOW} grid place-items-center shrink-0`}
        aria-hidden
      >
        <div className={`${iconInner} rounded-full bg-background`} />
      </div>
      <div className="flex flex-col leading-none min-w-0">
        <span className={`font-bold tracking-tight text-foreground ${title}`}>
          FinTracker<span className="text-emerald-glow">Pro</span>
        </span>
        {userName && !compact ? (
          <span className="text-[11px] text-muted-foreground mt-1 truncate">{userName}</span>
        ) : null}
      </div>
    </div>
  );
}
