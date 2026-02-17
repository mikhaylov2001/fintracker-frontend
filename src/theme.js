// src/theme.js
import { createTheme, alpha, responsiveFontSizes } from '@mui/material/styles';

export function buildTheme(mode = 'light') {
  const isDark = mode === 'dark';

  let t = createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? '#0B1220' : '#F5F7FF',
        paper: isDark ? alpha('#111827', 0.85) : alpha('#FFFFFF', 0.86),
      },
      text: {
        primary: isDark ? '#E5E7EB' : '#0F172A',
        secondary: isDark ? alpha('#E5E7EB', 0.70) : alpha('#0F172A', 0.65),
      },
      divider: isDark ? alpha('#E5E7EB', 0.10) : alpha('#0F172A', 0.10),
    },

    shape: { borderRadius: 12 },

    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    },

    components: {
      MuiToolbar: { defaultProps: { variant: 'dense' } },

      MuiButton: {
        defaultProps: { disableElevation: true, size: 'small' },
        styleOverrides: { root: { borderRadius: 999, textTransform: 'none', paddingLeft: 14, paddingRight: 14 } },
      },

      MuiIconButton: { defaultProps: { size: 'small' } },

      MuiTextField: {
        defaultProps: { size: 'small', margin: 'dense', variant: 'outlined', fullWidth: true },
      },
      MuiFormControl: { defaultProps: { size: 'small', margin: 'dense' } },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            borderColor: isDark ? alpha('#E5E7EB', 0.10) : 'rgba(15, 23, 42, 0.08)',
            backgroundColor: isDark ? alpha('#111827', 0.70) : alpha('#FFFFFF', 0.86),
            backdropFilter: 'blur(10px)',
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
        },
      },

      MuiTable: { defaultProps: { size: 'small' } },

      MuiTableCell: {
        styleOverrides: {
          root: { paddingTop: 10, paddingBottom: 10, borderColor: isDark ? alpha('#E5E7EB', 0.10) : undefined },
          head: {
            fontWeight: 800,
            backgroundColor: isDark ? alpha('#E5E7EB', 0.05) : alpha('#0F172A', 0.03),
          },
        },
      },

      MuiDivider: {
        styleOverrides: { root: { marginTop: 12, marginBottom: 12, borderColor: isDark ? alpha('#E5E7EB', 0.10) : alpha('#0F172A', 0.10) } },
      },
    },
  });

  t = responsiveFontSizes(t);
  return t;
}
