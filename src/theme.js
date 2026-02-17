// src/theme.js
import { createTheme, alpha, responsiveFontSizes } from '@mui/material/styles';

export function buildTheme() {
  let t = createTheme({
    palette: {
      mode: 'dark',            // всегда dark
      background: {
        default: '#060A14',    // фон body
        paper: 'rgba(10,16,32,0.45)',  // фон Card / Paper
      },
      text: {
        primary: '#E5E7EB',
        secondary: alpha('#E5E7EB', 0.70),
      },
      divider: alpha('#E5E7EB', 0.10),
    },

    shape: { borderRadius: 12 },

    typography: {
      fontFamily:
        'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: `
              radial-gradient(1100px 550px at 12% 8%, rgba(124,92,255,0.12) 0%, transparent 62%),
              radial-gradient(900px 500px at 88% 15%, rgba(47,231,161,0.10) 0%, transparent 60%),
              radial-gradient(800px 500px at 50% 95%, rgba(109,168,255,0.08) 0%, transparent 58%),
              linear-gradient(180deg, #071022 0%, #060A14 100%)
            `,
            backgroundAttachment: 'fixed',
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: 'rgba(10,16,32,0.45)',   // тёмный glass
            backdropFilter: 'blur(20px)',
            border: 'none',
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            marginTop: 12,
            marginBottom: 12,
            borderColor: alpha('#E5E7EB', 0.10),
          },
        },
      },
    },
  });

  t = responsiveFontSizes(t);
  return t;
}
