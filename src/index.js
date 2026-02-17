// src/index.js
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ColorModeProvider } from './contexts/ColorModeContext'; // ← useColorMode убран!
import { buildTheme } from './theme';

function Root() {
  const theme = useMemo(() => buildTheme(), []); // без mode
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
