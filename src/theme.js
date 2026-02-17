export function buildTheme(mode = 'dark') {  // ← default 'dark'!
  const isDark = mode === 'dark';

  const theme = createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? '#060A14' : '#F5F7FF',  // ← Тёмный fallback
        paper: isDark ? 'rgba(10,16,32,0.45)' : 'rgba(255,255,255,0.9)',  // Glass!
      },
      // ... остальное
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
          html: {
            WebkitFontSmoothing: 'antialiased',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent !important',  // ← Не перетирать sx!
            backdropFilter: 'blur(20px) saturate(180%) !important',
            border: 'none !important',
          },
        },
      },
      // ... твои остальные overrides
    },
  });

  return responsiveFontSizes(theme);
}
