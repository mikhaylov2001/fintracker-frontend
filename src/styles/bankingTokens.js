import { alpha } from "@mui/material/styles";

export const bankingColors = {
  // neutral-fresh background (не бледно-зелёный)
  bg0: "#F1F4F4",
  bg1: "#EAF2EE",

  // surfaces
  card: "#FFFFFF",
  card2: "#F7FAF8",

  // make borders visible
  border: "rgba(15,23,42,0.14)",
  border2: "rgba(15,23,42,0.20)",

  // text darker
  text: "#0F172A",
  muted: "rgba(15,23,42,0.68)",

  // green accent (bank-like)
  primary: "#1F9A3B",
  success: "#1F9A3B",
  warning: "#F59E0B",
  accent: "#22C55E",
  info: "#0284C7",
  danger: "#EF4444",
};

export const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(860px 520px at 14% 10%, ${alpha(bankingColors.primary, 0.20)} 0%, transparent 58%),
    radial-gradient(860px 520px at 86% 16%, ${alpha(bankingColors.info, 0.10)} 0%, transparent 60%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
};

export const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.10, // было слишком заметно — делаем почти невидимой
  backgroundImage:
    "linear-gradient(to right, rgba(15,23,42,0.12) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(15,23,42,0.12) 1px, transparent 1px)",
  backgroundSize: "72px 72px",
};

export const surfaceSx = {
  borderRadius: 18,
  border: `1px solid ${bankingColors.border}`,
  backgroundColor: bankingColors.card,
  boxShadow: "0 18px 55px rgba(15,23,42,0.14)", // больше “материальности”
};

export const pillSx = {
  borderRadius: 999,
  bgcolor: "#FFFFFF", // НЕ alpha — чтобы не “вымывалось”
  border: `1px solid ${bankingColors.border}`,
  color: bankingColors.text,
  fontWeight: 850,
};
