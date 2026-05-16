import { alpha } from "@mui/material/styles";
import { ftHex, ftOklch } from "./ftColors";

/** MUI-совместимые hex; визуально совпадает с ft-theme / Lovable */
export const bankingColors = {
  bg0: ftHex.bg,
  bg1: ftHex.bg1,
  card: ftHex.surface,
  card2: ftHex.muted,
  border: ftOklch.border,
  border2: ftOklch.border2,
  text: ftHex.foreground,
  muted: ftHex.mutedFg,
  primary: ftHex.primary,
  accent: ftHex.primary,
  info: ftHex.info,
  warning: ftHex.warning,
  danger: ftHex.danger,
  success: ftHex.primary,
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 14% 8%, ${alpha(ftHex.primary, 0.2)} 0%, transparent 60%),
    radial-gradient(900px 520px at 82% 12%, ${alpha(ftHex.primary, 0.14)} 0%, transparent 62%),
    radial-gradient(900px 520px at 50% 92%, ${alpha(ftHex.primary, 0.08)} 0%, transparent 62%),
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
