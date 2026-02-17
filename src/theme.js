import { createTheme, alpha, responsiveFontSizes } from '@mui/material/styles';

export function buildTheme(mode = 'dark') {
  const isDark = mode === 'dark';

  let t = createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? '#060A14' : '#F5F7FF',
        paper: isDark ? 'rgba(10,16,32,0.45)' : 'rgba(255,255,255,0.9)',
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
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark ? `
              radial-gradient(1100px 550px at 12% 8%, rgba(124,92,255,0.12) 0%, transparent 62%),
              radial-gradient(900px 500px at 88% 15%, rgba(47,231,161,0.1) 0%, transparent 60%),
              radial-gradient(800px 500px at 50% 95%, rgba(109,168,255,0.08) 0%, transparent 58%),
              linear-gradient(180deg, #071022 0%, #060A14 100%)
            ` : '#F5F7FF',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiToolbar: { defaultProps: { variant: 'dense' } },
      MuiButton: {
        defaultProps: { disableElevation: true, size: 'small' },
        styleOverrides: {
          root: {
            borderRadius: 999,
            textTransform: 'none',
            paddingLeft: 14,
            paddingRight: 14,
          },
        },
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
            border: isDark ? 'none' : '1px solid rgba(15, 23, 42, 0.08)',
            backgroundColor: isDark ? 'transparent' : 'rgba(255,255,255,0.86)',
            backdropFilter: isDark ? 'blur(20px)' : 'blur(10px)',
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
          root: {
            paddingTop: 10,
            paddingBottom: 10,
            borderColor: isDark ? alpha('#E5E7EB', 0.10) : undefined,
          },
          head: {
            fontWeight: 800,
            backgroundColor: isDark ? alpha('#E5E7EB', 0.05) : alpha('#0F172A', 0.03),
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            marginTop: 12,
            marginBottom: 12,
            borderColor: isDark ? alpha('#E5E7EB', 0.10) : alpha('#0F172A', 0.10),
          },
        },
      },
    },
  });

  t = responsiveFontSizes(t);
  return t;
}
