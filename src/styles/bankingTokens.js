import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // Background (neutral)
  bg0: "#0B1220",     // deep slate
  bg1: "#0A1726",

  // Surfaces (layered)
  card: "#101B2E",
  card2: "#0E1A2A",

  // Lines
  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.16)",

  // Text
  text: "rgba(241,245,249,0.96)",    // slate-50
  muted: "rgba(241,245,249,0.70)",

  // Accent (keep green but only for highlights)
  primary: "#22C55E",  // vivid, but used sparingly
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

export const surfaceSx = {
  borderRadius: 18,
  border: `1px solid ${bankingColors.border}`,
  backgroundColor: alpha(bankingColors.card, 0.92),
  boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
};

export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha(bankingColors.card2, 0.72),
  border: `1px solid ${bankingColors.border2}`,
  color: bankingColors.text,
  fontWeight: 850,
};
