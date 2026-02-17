import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // Light (fresh / frost)
  bg0: "#F6F8FF",
  bg1: "#EEF3FF",

  // Surfaces
  card: alpha("#FFFFFF", 0.92),
  card2: alpha("#FFFFFF", 0.82),

  border: "rgba(15,23,42,0.10)",
  border2: "rgba(15,23,42,0.14)",

  text: "rgba(15,23,42,0.92)",
  muted: "rgba(15,23,42,0.62)",

  primary: "#2563EB",
  success: "#14B8A6",
  warning: "#F59E0B",
  accent: "#38BDF8",
  danger: "#EF4444",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 16% 10%, ${alpha(bankingColors.primary, 0.14)} 0%, transparent 55%),
    radial-gradient(900px 520px at 86% 18%, ${alpha(bankingColors.accent, 0.12)} 0%, transparent 55%),
    radial-gradient(900px 520px at 55% 92%, ${alpha(bankingColors.success, 0.10)} 0%, transparent 55%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
};

export const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.35,
  backgroundImage:
    "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
};

export const surfaceSx = {
  borderRadius: 16,
  border: `1px solid ${bankingColors.border}`,
  backgroundColor: bankingColors.card,
  boxShadow: "0 10px 30px rgba(15,23,42,0.10)",
};

export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha("#FFFFFF", 0.72),
  border: `1px solid ${bankingColors.border}`,
  color: bankingColors.text,
  fontWeight: 850,
};
