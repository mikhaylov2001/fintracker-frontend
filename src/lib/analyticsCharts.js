/** Палитра и стили графиков — как в Lovable / Recharts */

export const CHART_INCOME = "oklch(0.72 0.18 162)";
export const CHART_EXPENSE = "oklch(0.78 0.16 75)";
export const CHART_SAVINGS = "oklch(0.7 0.18 295)";
export const CHART_GRID = "oklch(1 0 0 / 0.05)";
export const CHART_TICK = "oklch(0.62 0.012 285)";

export const PIE_COLORS = [
  CHART_INCOME,
  CHART_EXPENSE,
  "oklch(0.65 0.18 250)",
  CHART_SAVINGS,
  "oklch(0.7 0.2 25)",
  "oklch(0.75 0.15 200)",
  "oklch(0.68 0.18 340)",
  "oklch(0.74 0.17 110)",
];

export const chartTooltipStyle = {
  background: "#17171b",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 12,
  color: "#f1f1f5",
  fontSize: 12,
};

/** Пропсы для Recharts Tooltip (светлый текст) */
export const chartTooltipProps = {
  contentStyle: chartTooltipStyle,
  itemStyle: { color: "#f1f1f5" },
  labelStyle: { color: "#f1f1f5", fontWeight: 600 },
  cursor: { fill: "rgba(255, 255, 255, 0.04)" },
};

export const chartTick = { fill: CHART_TICK, fontSize: 11 };

export function monthShortRu(ym) {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return "";
  return new Date(y, m - 1, 1).toLocaleDateString("ru-RU", { month: "short" });
}
