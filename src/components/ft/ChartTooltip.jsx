import React from "react";
import { chartTooltipStyle } from "../../lib/analyticsCharts";

/**
 * Тултип Recharts со светлым текстом на тёмном фоне.
 */
export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border border-white/10 px-3.5 py-2.5 shadow-2xl"
      style={chartTooltipStyle}
    >
      {label ? (
        <p className="text-[11px] font-semibold text-foreground/80 mb-1.5">{label}</p>
      ) : null}
      <ul className="space-y-1">
        {payload.map((entry, i) => {
          const raw = entry.value;
          const formatted = formatter
            ? formatter(raw, entry.name, entry, i, payload)
            : raw;
          const text =
            Array.isArray(formatted) ? formatted[0] : formatted ?? raw;
          return (
            <li
              key={`${entry.name}-${i}`}
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span>
                {entry.name}
                <span className="text-foreground/90">: {text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
