import React from "react";

const ICON_ACCENT = {
  info: {
    box: "bg-info/12 border-info/30",
    icon: "text-info",
  },
  emerald: {
    box: "bg-emerald-glow/12 border-emerald-glow/30",
    icon: "text-emerald-glow",
  },
  warning: {
    box: "bg-warning/12 border-warning/30",
    icon: "text-warning",
  },
  violet: {
    box: "bg-violet/12 border-violet/30",
    icon: "text-violet",
  },
};

/**
 * KPI-карточка (2×2 на мобильных): тёмный фон, крупное значение, подпись.
 * iconAccent — цветная иконка только на sm+ (мобильная вёрстка без иконок).
 */
export default function KpiStat({
  label,
  value,
  hint,
  valueClass = "text-foreground",
  highlight = false,
  icon: Icon,
  iconAccent,
  className = "",
}) {
  const valueCls = highlight ? "text-emerald-glow" : valueClass;
  const accent = iconAccent ? ICON_ACCENT[iconAccent] : null;

  return (
    <div className={`ft-kpi-card relative overflow-hidden ${className}`}>
      {Icon && (
        <div
          className={`absolute top-4 right-4 hidden sm:grid size-8 rounded-xl border place-items-center ${
            accent ? accent.box : "bg-white/[0.04] border-border"
          }`}
        >
          <Icon
            className={`size-4 ${accent ? accent.icon : "text-muted-foreground"}`}
            strokeWidth={2}
          />
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
