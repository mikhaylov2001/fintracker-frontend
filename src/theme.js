import { createTheme, alpha, responsiveFontSizes } from "@mui/material/styles";

export function buildTheme(mode = "dark") {
  const isDark = mode === "dark";

  let t = createTheme({
    palette: {
      mode,
      primary: { main: "#4F7DFF" },
      background: {
        default: isDark ? "#0F172A" : "#F5F7FF",
        paper: isDark ? alpha("#111B30", 0.86) : alpha("#FFFFFF", 0.92),
      },
      text: {
        primary: isDark ? "#E5E7EB" : "#0F172A",
        secondary: isDark ? alpha("#E5E7EB", 0.70) : alpha("#0F172A", 0.65),
      },
      divider: isDark ? alpha("#E5E7EB", 0.10) : alpha("#0F172A", 0.10),
    },

    shape: { borderRadius: 14 },

    typography: {
      fontFamily:
        "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    },

    components: {
      MuiToolbar: { defaultProps: { variant: "dense" } },

      MuiButton: {
        defaultProps: { disableElevation: true, size: "small" },
        styleOverrides: {
          root: {
            borderRadius: 999,
            textTransform: "none",
            paddingLeft: 14,
            paddingRight: 14,
            fontWeight: 800,
          },
        },
      },

      MuiIconButton: { defaultProps: { size: "small" } },

      MuiTextField: {
        defaultProps: {
          size: "small",
          margin: "dense",
          variant: "outlined",
          fullWidth: true,
        },
      },

      MuiFormControl: { defaultProps: { size: "small", margin: "dense" } },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: `1px solid ${
              isDark ? alpha("#E5E7EB", 0.10) : "rgba(15, 23, 42, 0.08)"
            }`,
            backgroundColor: isDark ? alpha("#111B30", 0.86) : alpha("#FFFFFF", 0.92),
            backdropFilter: "none",
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: { padding: 16, "&:last-child": { paddingBottom: 16 } },
        },
      },

      MuiTable: { defaultProps: { size: "small" } },

      MuiTableCell: {
        styleOverrides: {
          root: {
            paddingTop: 10,
            paddingBottom: 10,
            borderColor: isDark ? alpha("#E5E7EB", 0.10) : undefined,
          },
          head: {
            fontWeight: 800,
            backgroundColor: isDark
              ? alpha("#E5E7EB", 0.05)
              : alpha("#0F172A", 0.03),
          },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            marginTop: 12,
            marginBottom: 12,
            borderColor: isDark
              ? alpha("#E5E7EB", 0.10)
              : alpha("#0F172A", 0.10),
          },
        },
      },
    },
  });

  t = responsiveFontSizes(t);
  return t;
}
