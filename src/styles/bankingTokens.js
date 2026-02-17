import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // более светлый dark (charcoal/slate)
  bg0: "#141C2E",
  bg1: "#18233A",

  // surfaces (светлее и ближе к “банковским”)
  card: alpha("#1A2A46", 0.86),
  card2: alpha("#15243F", 0.90),

  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.14)",

  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.68)",

  primary: "#4F7DFF",
  success: "#2DD4BF",
  warning: "#FBBF24",
  accent: "#60A5FA",
  danger: "#FF6B7A",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 16% 10%, ${alpha(bankingColors.primary, 0.12)} 0%, transparent 55%),
    radial-gradient(900px 520px at 86% 18%, ${alpha(bankingColors.accent, 0.09)} 0%, transparent 55%),
    radial-gradient(900px 520px at 55% 92%, ${alpha(bankingColors.success, 0.07)} 0%, transparent 55%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
};

export const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.05,
  backgroundImage:
    "linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  mixBlendMode: "soft-light",
};

export const surfaceSx = {
  borderRadius: 4,
  border: `1px solid ${bankingColors.border2}`,
  backgroundColor: bankingColors.card,
  boxShadow: "0 12px 36px rgba(0,0,0,0.30)",
};

export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha("#0B1226", 0.30),
  border: `1px solid ${bankingColors.border}`,
  color: bankingColors.text,
  fontWeight: 850,
};
