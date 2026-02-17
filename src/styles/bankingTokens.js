import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // Dark-green background (не чистый black)
  bg0: "#041B11",
  bg1: "#062916",

  // Dark-green surfaces
  card: "#0A331F",
  card2: "#0B3A23",

  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.16)",

  text: "rgba(236,253,245,0.96)",  // emerald-50 like
  muted: "rgba(236,253,245,0.70)",

  // Sber-like green as primary
  primary: "#21A038",
  success: "#21A038",
  warning: "#F59E0B",
  accent: "#34D399",
  info: "#38BDF8",
  danger: "#FB7185",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 18% 10%, ${alpha(bankingColors.primary, 0.22)} 0%, transparent 58%),
    radial-gradient(900px 520px at 86% 14%, ${alpha(bankingColors.accent, 0.14)} 0%, transparent 62%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
};

export const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.06,
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)",
  backgroundSize: "72px 72px",
  mixBlendMode: "soft-light",
};

export const surfaceSx = {
  borderRadius: 20,
  border: `1px solid ${bankingColors.border}`,
  backgroundColor: alpha(bankingColors.card, 0.94),
  boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
};

export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha(bankingColors.card2, 0.78),
  border: `1px solid ${bankingColors.border2}`,
  color: bankingColors.text,
  fontWeight: 850,
};
