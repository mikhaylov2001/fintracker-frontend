import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // Фон: тёмный изумруд, но светлее и теплее, чем раньше
  bg0: "#021513", // базовый фон
  bg1: "#031C18", // верхний градиентный слой

  // Карточки — чуть светлее bg, со спокойным изумрудным оттенком
  card:  "#04231E",
  card2: "#03201B",

  // Рамки — мягкий изумруд, не ядрёный
  border:  "rgba(125, 244, 194, 0.24)",  // вокруг KPI и панелей, если надо
  border2: "rgba(167, 243, 208, 0.32)",  // для pillOutlined

  text:  "rgba(241,245,249,0.97)",
  muted: "rgba(241,245,249,0.72)",

  // Основные акценты — ближе к emerald/mint
  primary: "#22C55E",   // можно оставить тем же
  accent:  "#34D399",
  info:    "#38BDF8",
  warning: "#FBBF24",
  danger:  "#FB7185",
  success: "#22C55E",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 14% 8%,  ${alpha("#00BC7D", 0.26)} 0%, transparent 60%),
    radial-gradient(900px 520px at 82% 12%, ${alpha("#009966", 0.20)} 0%, transparent 62%),
    radial-gradient(900px 520px at 50% 92%, ${alpha("#22C55E", 0.16)} 0%, transparent 62%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
};

export const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.05,
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.20) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(255,255,255,0.20) 1px, transparent 1px)",
  backgroundSize: "84px 84px",
  mixBlendMode: "soft-light",
};

/** Базовая поверхность — БЕЗ границы */
export const surfaceSx = {
  borderRadius: 18,
  border: "0",
  backgroundColor: alpha(bankingColors.card, 0.96),
  boxShadow: "0 16px 44px rgba(0,0,0,0.48)",
};

/** Вариант с рамкой (используем ТОЛЬКО для KPI) */
export const surfaceOutlinedSx = {
  ...surfaceSx,
  border: `1px solid ${bankingColors.border}`,
};

/** Пилюля — БЕЗ границы */
export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha(bankingColors.card2, 0.80),
  border: "0",
  color: bankingColors.text,
  fontWeight: 850,
};

/** Пилюля с рамкой (если вдруг понадобится) */
export const pillOutlinedSx = {
  ...pillSx,
  border: `1px solid ${bankingColors.border2}`,
};
