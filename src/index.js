import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ColorModeProvider, useColorMode } from './contexts/ColorModeContext';
import { buildTheme } from './theme';

function Root() {
  const { mode } = useColorMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ColorModeProvider>
    <Root />
  </ColorModeProvider>
);
