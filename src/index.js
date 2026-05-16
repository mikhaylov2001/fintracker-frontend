import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import './index.css';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ColorModeProvider, useColorMode } from './contexts/ColorModeContext';
import { buildTheme } from './theme';

function Root() {
  const { mode } = useColorMode();

  // Создаем тему только при смене режима (dark/light)
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline нормализует стили и применяет фоновый цвет темы */}
      <CssBaseline enableColorScheme />
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ColorModeProvider>
      <Root />
    </ColorModeProvider>
  </React.StrictMode>
);