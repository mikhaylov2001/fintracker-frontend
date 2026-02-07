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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={onClose} severity={state.severity} variant="filled" sx={{ width: '100%' }}>
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
