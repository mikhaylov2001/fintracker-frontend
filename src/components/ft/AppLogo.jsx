import React from "react";
import { Wallet } from "lucide-react";

const GLOW = "shadow-[0_0_22px_oklch(0.72_0.18_162/0.55)]";

/**
 * Логотип FinTrackerPro — кошелёк + название (+ имя пользователя).
 */
export default function AppLogo({ userName, compact = false, className = "" }) {
  const iconBox = compact ? "size-7 rounded-lg" : "size-11 rounded-2xl";
  const iconSize = compact ? "size-3.5" : "size-5";
  const title = compact ? "text-sm" : "text-lg";

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <div
        className={`${iconBox} bg-emerald-glow/12 border border-emerald-glow/30 ${GLOW} grid place-items-center shrink-0`}
        aria-hidden
      >
        <Wallet className={`${iconSize} text-emerald-glow`} strokeWidth={2.5} />
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
