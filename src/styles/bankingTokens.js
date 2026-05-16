import { alpha } from "@mui/material/styles";

/** Совместимость: те же oklch, что ft-theme / Lovable */
export const bankingColors = {
  bg0: "oklch(0.145 0.005 285)",
  bg1: "oklch(0.18 0.006 285)",
  card: "oklch(0.205 0.008 285)",
  card2: "oklch(0.25 0.008 285)",
  border: "oklch(1 0 0 / 7%)",
  border2: "oklch(1 0 0 / 12%)",
  text: "oklch(0.96 0.005 285)",
  muted: "oklch(0.62 0.012 285)",
  primary: "oklch(0.72 0.18 162)",
  accent: "oklch(0.72 0.18 162)",
  info: "oklch(0.65 0.18 250)",
  warning: "oklch(0.78 0.16 75)",
  danger: "oklch(0.65 0.21 25)",
  success: "oklch(0.72 0.18 162)",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 14% 8%, oklch(0.72 0.18 162 / 0.2) 0%, transparent 60%),
    radial-gradient(900px 520px at 82% 12%, oklch(0.72 0.18 162 / 0.14) 0%, transparent 62%),
    radial-gradient(900px 520px at 50% 92%, oklch(0.72 0.18 162 / 0.08) 0%, transparent 62%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
};

export const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.04,
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
  backgroundSize: "84px 84px",
};

export const surfaceSx = {
  borderRadius: 18,
  border: "0",
  backgroundColor: alpha(bankingColors.card, 0.96),
  boxShadow: "0 16px 44px rgba(0,0,0,0.48)",
};

export const surfaceOutlinedSx = {
  ...surfaceSx,
  border: `1px solid ${bankingColors.border}`,
};

export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha(bankingColors.card2, 0.8),
  border: "0",
  color: bankingColors.text,
  fontWeight: 850,
};

export const pillOutlinedSx = {
  ...pillSx,
  border: `1px solid ${bankingColors.border2}`,
};
