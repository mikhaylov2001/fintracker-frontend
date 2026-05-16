import { bankingColors } from "../styles/bankingTokens";

/** Палитра графиков — как в Analytics Lovable */
export const CHART_COLORS = {
  income: bankingColors.primary,
  expenses: bankingColors.warning,
  balance: "#6366F1",
  white: "#FFFFFF",
};

export const chartAxisSx = {
  "& .MuiChartsAxis-line": { stroke: "rgba(255,255,255,0.16)" },
  "& .MuiChartsAxis-tick": { stroke: "rgba(255,255,255,0.12)" },
  "& .MuiChartsAxis-tickLabel": { fill: CHART_COLORS.white, fontSize: 11, fontWeight: 800 },
  "& .MuiChartsGrid-line": { stroke: "rgba(255,255,255,0.06)" },
  ".MuiChartsLegend-root": { display: "none" },
};

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export const fmtAxisShort = (v) => {
  const val = n(v);
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `${Math.round(val / 1_000_000)}м`;
  if (abs >= 1_000) return `${Math.round(val / 1_000)}к`;
  return `${Math.round(val)}`;
};

const roundUpToStep = (value, step) => Math.ceil(value / step) * step;

const niceStep = (maxVal) => {
  if (maxVal <= 50_000) return 10_000;
  if (maxVal <= 200_000) return 25_000;
  if (maxVal <= 500_000) return 50_000;
  return 100_000;
};

/** Верхняя граница оси Y с запасом — как в Lovable */
export const withHeadroom = (maxVal) => {
  const raw = maxVal + maxVal * 0.25;
  const step = niceStep(raw);
  return roundUpToStep(raw, step);
};

export function monthShortLabel(ym) {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return "";
  const raw = new Date(y, m - 1, 1).toLocaleDateString("ru-RU", { month: "short" });
  const cap = raw.charAt(0).toUpperCase() + raw.slice(1).replace(".", "");
  return `${cap} ${y}`;
}
