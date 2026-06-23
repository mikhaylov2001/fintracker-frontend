import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    message: '',
    severity: 'info', // success | error | warning | info
    autoHideDuration: 2400,
  });

  const show = useCallback((message, opts = {}) => {
    setState({
      open: true,
      message: String(message ?? ''),
      severity: opts.severity || 'info',
      autoHideDuration: typeof opts.autoHideDuration === 'number' ? opts.autoHideDuration : 2400,
    });
  }, []);

  const api = useMemo(
    () => ({
      show,
      success: (m, o) => show(m, { ...(o || {}), severity: 'success' }),
      error: (m, o) => show(m, { ...(o || {}), severity: 'error' }),
      warning: (m, o) => show(m, { ...(o || {}), severity: 'warning' }),
      info: (m, o) => show(m, { ...(o || {}), severity: 'info' }),
    }),
    [show]
  );

  const onClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      <Snackbar
        open={state.open}
        onClose={onClose}
        autoHideDuration={state.autoHideDuration}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          /* мобилка — не трогаем позицию MUI, просто прижимаем к краям */
          bottom: { xs: 'calc(72px + env(safe-area-inset-bottom, 0px))', sm: 32 },
          left:   { xs: 12, sm: 'auto' },
          right:  { xs: 12, sm: 32 },
          width:  { xs: 'calc(100% - 24px)', sm: 'auto' },
          maxWidth: { xs: '100%', sm: 420 },
        }}
      >
        <Alert
          onClose={onClose}
          severity={state.severity}
          variant="filled"
          sx={{
            width: '100%',
            /* Десктоп — нормальный вид */
            display: { xs: 'flex', sm: 'flex' },
            alignItems: 'center',
            fontSize: { sm: 14 },
            fontWeight: { sm: 500 },
            borderRadius: { sm: '10px' },
            boxShadow: { sm: '0 4px 24px rgba(0,0,0,0.22)' },
            py: { sm: 1.25 },
            px: { sm: 2 },
          }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider/>');
  return ctx;
}
