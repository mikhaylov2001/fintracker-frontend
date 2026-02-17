import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // Фон страницы — более светлый, с зелёным оттенком
  bg0: "#050F0A", // было "#0B1220"
  bg1: "#071610", // было "#0A1726"

  // Карточки ближе к зелёному и чуть светлее
  card:  "#0D1F15", // было "#101B2E"
  card2: "#0A1A12", // было "#0E1A2A"

  // Рамки — чуть светлее и зеленее
  border:  "rgba(148, 231, 179, 0.25)",
  border2: "rgba(190, 242, 208, 0.35)",

  text:  "rgba(241,245,249,0.96)",
  muted: "rgba(241,245,249,0.70)",

  primary: "#22C55E",
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
    radial-gradient(900px 520px at 14% 8%,  ${alpha(bankingColors.primary, 0.26)} 0%, transparent 60%),
    radial-gradient(900px 520px at 82% 12%, ${alpha(bankingColors.accent, 0.18)} 0%, transparent 62%),
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
    "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)",
  backgroundSize: "84px 84px",
  mixBlendMode: "soft-light",
};

/** Базовая поверхность — БЕЗ границы */
export const surfaceSx = {
  borderRadius: 18,
  border: "0",
  // чуть светлее и более “однотонная” карточка
  backgroundColor: alpha(bankingColors.card, 0.96),
  boxShadow: "0 16px 48px rgba(0,0,0,0.50)",
};

/** Вариант с рамкой (используем ТОЛЬКО для KPI) */
export const surfaceOutlinedSx = {
  ...surfaceSx,
  border: `1px solid ${bankingColors.border}`,
};

/** Пилюля — БЕЗ границы */
export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha(bankingColors.card2, 0.80), // чуть светлее
  border: "0",
  color: bankingColors.text,
  fontWeight: 850,
};

/** Пилюля с рамкой (если вдруг понадобится) */
export const pillOutlinedSx = {
  ...pillSx,
  border: `1px solid ${bankingColors.border2}`,
};
