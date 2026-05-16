/** Общие MUI-стили для страниц авторизации — в духе Lovable / ft-theme */

import { ftHex, ftOklch } from "./ftColors";

export const authHeroSx = {
  borderRadius: "calc(var(--radius) + 8px)",
  border: `1px solid ${ftOklch.border8}`,
  backgroundColor: alphaSurface(0.55),
  backdropFilter: "blur(12px)",
};

export const authPaperSx = {
  p: { xs: 3, md: 4 },
  width: "100%",
  maxWidth: 420,
  mx: "auto",
  borderRadius: "calc(var(--radius) + 8px)",
  backgroundColor: ftHex.surface,
  border: `1px solid ${ftOklch.border}`,
  boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
  color: ftHex.foreground,
};

export const authTitleSx = {
  fontSize: 26,
  fontWeight: 900,
  letterSpacing: 0.2,
  color: ftHex.foreground,
};

export const authSubtitleSx = {
  mt: 0.8,
  fontSize: 13,
  color: ftHex.mutedFg,
};

export const authHeroTitleSx = {
  color: ftHex.foreground,
  fontWeight: 950,
};

export const authHeroTextSx = {
  color: ftHex.mutedFg,
};

export const authPrimaryButtonSx = {
  mt: 1.5,
  py: 1.2,
  fontWeight: 800,
  borderRadius: 999,
  backgroundColor: ftHex.primary,
  color: ftHex.primaryFg,
  "&:hover": {
    backgroundColor: ftHex.primaryHover,
  },
};

function alphaSurface(opacity) {
  const r = parseInt(ftHex.surface.slice(1, 3), 16);
  const g = parseInt(ftHex.surface.slice(3, 5), 16);
  const b = parseInt(ftHex.surface.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
