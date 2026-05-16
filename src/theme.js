import { createTheme, alpha, responsiveFontSizes } from "@mui/material/styles";
import { ftHex, ftOklch } from "./styles/ftColors";

export function buildTheme(mode = "dark") {
  const isDark = mode !== "light";

  let t = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: { main: ftHex.primary, contrastText: ftHex.primaryFg },
      background: {
        default: isDark ? ftHex.bg : "#F5F7FF",
        paper: isDark ? ftHex.surface : "#FFFFFF",
      },
      text: {
        primary: isDark ? ftHex.foreground : "#0F172A",
        secondary: isDark ? ftHex.mutedFg : alpha("#0F172A", 0.65),
      },
      divider: ftOklch.border,
      error: { main: ftHex.danger },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: ftHex.bg,
            color: ftHex.foreground,
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
            backgroundColor: ftHex.primary,
            color: ftHex.primaryFg,
            "&:hover": { backgroundColor: ftHex.primaryHover },
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
            backgroundColor: ftOklch.inputBg,
            "& fieldset": { borderColor: ftOklch.border },
            "&:hover fieldset": { borderColor: ftOklch.primaryBorder40 },
            "&.Mui-focused fieldset": { borderColor: ftHex.primary },
          },
          input: { color: ftHex.foreground },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: ftHex.mutedFg },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { color: ftHex.mutedFg },
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
          root: { color: ftHex.primary, fontWeight: 600 },
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
