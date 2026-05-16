/**
 * Палитра FinTracker: oklch в CSS (ft-theme), hex/rgba для MUI (alpha, palette).
 * Значения hex — sRGB-аппроксимация тех же oklch из ft-theme.css.
 */

export const ftOklch = {
  bg: "oklch(0.145 0.005 285)",
  bg1: "oklch(0.18 0.006 285)",
  surface: "oklch(0.205 0.008 285)",
  muted: "oklch(0.25 0.008 285)",
  foreground: "oklch(0.96 0.005 285)",
  mutedFg: "oklch(0.62 0.012 285)",
  primary: "oklch(0.72 0.18 162)",
  primaryFg: "oklch(0.18 0.04 162)",
  primaryHover: "oklch(0.76 0.18 162)",
  info: "oklch(0.65 0.18 250)",
  warning: "oklch(0.78 0.16 75)",
  danger: "oklch(0.65 0.21 25)",
  violet: "oklch(0.7 0.18 295)",
  border: "rgba(255, 255, 255, 0.07)",
  border2: "rgba(255, 255, 255, 0.12)",
  border8: "rgba(255, 255, 255, 0.08)",
  inputBg: "rgba(255, 255, 255, 0.04)",
  primaryBorder40: "rgba(0, 198, 129, 0.4)",
};

/** Для MUI colorManipulator (alpha, lighten, palette) */
export const ftHex = {
  bg: "#0a0a0c",
  bg1: "#111114",
  surface: "#17171b",
  muted: "#212125",
  foreground: "#f1f1f5",
  mutedFg: "#85858d",
  primary: "#00c681",
  primaryFg: "#00170c",
  primaryHover: "#00d38d",
  info: "#0f92f7",
  warning: "#f2a618",
  danger: "#f54748",
  violet: "#a883ff",
};
