import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // Fresh light background
  bg0: "#F4F7F6",
  bg1: "#ECF7F0",

  // Surfaces
  card: alpha("#FFFFFF", 0.94),
  card2: alpha("#FFFFFF", 0.86),

  border: "rgba(15,23,42,0.08)",
  border2: "rgba(15,23,42,0.12)",

  text: "rgba(15,23,42,0.92)",
  muted: "rgba(15,23,42,0.62)",

  // “Green bank” accents
  primary: "#21A038",
  success: "#21A038",
  warning: "#F59E0B",
  accent: "#22C55E",  // вторичный зелёный (светлее)
  info: "#38BDF8",
  danger: "#EF4444",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 18% 12%, ${alpha(bankingColors.primary, 0.14)} 0%, transparent 55%),
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
  boxShadow: "0 10px 28px rgba(15,23,42,0.10)",
};

export const pillSx = {
  borderRadius: 999,
  bgcolor: alpha("#FFFFFF", 0.78),
  border: `1px solid ${bankingColors.border}`,
  color: bankingColors.text,
  fontWeight: 850,
};
