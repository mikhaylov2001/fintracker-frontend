import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const ToastContext = createContext(null);

/* ─── иконки по severity ─── */
function ToastIcon({ severity }) {
  if (severity === 'success') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
  if (severity === 'error') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
  if (severity === 'warning') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

const COLORS = {
  success: { bg: '#1a7a4a', border: '#22c55e', text: '#fff' },
  error:   { bg: '#7a1a1a', border: '#ef4444', text: '#fff' },
  warning: { bg: '#7a5a1a', border: '#f59e0b', text: '#fff' },
  info:    { bg: '#1a3a7a', border: '#3b82f6', text: '#fff' },
};

function ToastBanner({ message, severity, onClose, visible }) {
  const c = COLORS[severity] || COLORS.info;

  const style = {
    /* десктоп: фиксируем в правом нижнем углу */
    position: 'fixed',
    bottom: 32,
    right: 32,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 12,
    background: c.bg,
    border: `1.5px solid ${c.border}`,
    color: c.text,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    maxWidth: 360,
    minWidth: 220,
    pointerEvents: 'auto',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 0.22s ease, transform 0.22s ease',
    /* на мобилке перемещаем вниз по центру */
  };

  /* медиа-запрос через window.matchMedia */
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) {
    style.bottom = 80;
    style.right = 12;
    style.left = 12;
    style.maxWidth = '100%';
  }

  return ReactDOM.createPortal(
    <div style={style} role="alert" aria-live="polite">
      <span style={{ flexShrink: 0 }}>
        <ToastIcon severity={severity} />
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '0 2px',
          opacity: 0.75,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        aria-label="Закрыть"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>,
    document.body
  );
}

export function ToastProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 2400,
  });
  const [visible, setVisible] = useState(false);

  /* анимация появления */
  useEffect(() => {
    if (state.open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [state.open]);

  /* автозакрытие */
  useEffect(() => {
    if (!state.open) return;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setState((s) => ({ ...s, open: false })), 250);
    }, state.autoHideDuration);
    return () => clearTimeout(t);
  }, [state.open, state.autoHideDuration]);

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
      error:   (m, o) => show(m, { ...(o || {}), severity: 'error' }),
      warning: (m, o) => show(m, { ...(o || {}), severity: 'warning' }),
      info:    (m, o) => show(m, { ...(o || {}), severity: 'info' }),
    }),
    [show]
  );

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => setState((s) => ({ ...s, open: false })), 250);
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {state.open && (
        <ToastBanner
          message={state.message}
          severity={state.severity}
          visible={visible}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider/>');
  return ctx;
}
