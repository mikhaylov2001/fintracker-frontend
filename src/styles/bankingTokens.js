import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // Fresh light, but not pale
  bg0: "#EEF3F0",
  bg1: "#E3F2EA",

  // Surfaces
  card: "#FFFFFF",
  card2: "#FFFFFF",

  border: "rgba(15,23,42,0.12)",
  border2: "rgba(15,23,42,0.18)",

  text: "rgba(15,23,42,0.92)",
  muted: "rgba(15,23,42,0.66)",

  // Green bank accents
  primary: "#1F9A3B",
  success: "#1F9A3B",
  warning: "#F59E0B",
  accent: "#22C55E",
  info: "#0EA5E9",
  danger: "#EF4444",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 18% 12%, ${alpha(bankingColors.primary, 0.18)} 0%, transparent 55%),
    radial-gradient(900px 520px at 85% 18%, ${alpha(bankingColors.info, 0.10)} 0%, transparent 55%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
};

export const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.35,
  backgroundImage:
    "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
};

export const surfaceSx = {
  borderRadius: 18,
  border: `1px solid ${bankingColors.border}`,
  backgroundColor: bankingColors.card,
  boxShadow: "0 14px 38px rgba(15,23,42,0.14)",
};

export const pillSx = {
  borderRadius: 999,
  bgcolor: "rgba(255,255,255,0.92)",
  border: `1px solid ${bankingColors.border}`,
  color: bankingColors.text,
  fontWeight: 850,
};
