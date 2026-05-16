import { createTheme, alpha, responsiveFontSizes } from "@mui/material/styles";

const FT = {
  bg: "oklch(0.145 0.005 285)",
  surface: "oklch(0.205 0.008 285)",
  fg: "oklch(0.96 0.005 285)",
  muted: "oklch(0.62 0.012 285)",
  primary: "oklch(0.72 0.18 162)",
  primaryFg: "oklch(0.18 0.04 162)",
  border: "oklch(1 0 0 / 7%)",
};

export function buildTheme(mode = "dark") {
  const isDark = mode !== "light";

  let t = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: { main: FT.primary, contrastText: FT.primaryFg },
      background: {
        default: isDark ? FT.bg : "#F5F7FF",
        paper: isDark ? FT.surface : "#FFFFFF",
      },
      text: {
        primary: isDark ? FT.fg : "#0F172A",
        secondary: isDark ? FT.muted : alpha("#0F172A", 0.65),
      },
      divider: FT.border,
      error: { main: "oklch(0.65 0.21 25)" },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: FT.bg,
            color: FT.fg,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, size: "small" },
        styleOverrides: {
          root: {
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 800,
          },
          containedPrimary: {
            backgroundColor: FT.primary,
            color: FT.primaryFg,
            "&:hover": { backgroundColor: "oklch(0.76 0.18 162)" },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: "small", margin: "dense", variant: "outlined", fullWidth: true },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: "oklch(1 0 0 / 4%)",
            "& fieldset": { borderColor: FT.border },
            "&:hover fieldset": { borderColor: "oklch(0.72 0.18 162 / 40%)" },
            "&.Mui-focused fieldset": { borderColor: FT.primary },
          },
          input: { color: FT.fg },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: FT.muted },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { color: FT.muted },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: { color: FT.primary, fontWeight: 600 },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: { "& .MuiPaper-root": { borderRadius: 12 } },
        },
      },
    },
  });

  return responsiveFontSizes(t);
}
