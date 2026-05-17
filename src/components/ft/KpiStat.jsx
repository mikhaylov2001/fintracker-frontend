import React from "react";

/**
 * KPI-карточка (2×2 на мобильных): тёмный фон, крупное значение, подпись.
 */
export default function KpiStat({
  label,
  value,
  hint,
  valueClass = "text-foreground",
  highlight = false,
  icon: Icon,
  className = "",
}) {
  const valueCls = highlight ? "text-emerald-glow" : valueClass;

  return (
    <div className={`ft-kpi-card relative overflow-hidden ${className}`}>
      {Icon && (
        <div className="absolute top-4 right-4 hidden sm:grid size-8 rounded-xl bg-white/[0.04] border border-border place-items-center">
          <Icon className="size-4 text-muted-foreground" strokeWidth={2} />
        </div>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2 leading-tight">
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-bold tabular-nums break-all ${valueCls}`}>
        {value}
      </p>
      {hint ? (
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}
