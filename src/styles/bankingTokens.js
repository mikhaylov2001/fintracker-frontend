import { alpha } from "@mui/material/styles";

export const bankingColors = {
  bg0: "#0B1220",
  bg1: "#0A1726",

  card: "#101B2E",
  card2: "#0E1A2A",

  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.16)",

  text: "rgba(241,245,249,0.96)",
  muted: "rgba(241,245,249,0.70)",

  primary: "#22C55E",
  accent: "#34D399",
  info: "#38BDF8",
  warning: "#FBBF24",
  danger: "#FB7185",
  success: "#22C55E",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 14% 10%, ${alpha(bankingColors.primary, 0.18)} 0%, transparent 60%),
    radial-gradient(900px 520px at 86% 14%, ${alpha(bankingColors.info, 0.12)} 0%, transparent 62%),
    radial-gradient(900px 520px at 55% 90%, ${alpha("#A78BFA", 0.10)} 0%, transparent 62%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
};

export const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.05,
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)",
  backgroundSize: "84px 84px",
  mixBlendMode: "soft-light",
};

/** Базовая поверхность — БЕЗ границы */
export const surfaceSx = {
  borderRadius: 18,
  border: "0",
  backgroundColor: alpha(bankingColors.card, 0.92),
  boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
};

/** Вариант с рамкой (используем ТОЛЬКО для KPI) */
export const surfaceOutlinedSx = {
  ...surfaceSx,
  border: `1px solid ${bankingColors.border}`,
};

/** Пилюля — БЕЗ границы */
export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha(bankingColors.card2, 0.72),
  border: "0",
  color: bankingColors.text,
  fontWeight: 850,
};

/** Пилюля с рамкой (если вдруг понадобится) */
export const pillOutlinedSx = {
  ...pillSx,
  border: `1px solid ${bankingColors.border2}`,
};
