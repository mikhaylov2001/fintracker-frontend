import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ColorModeContext = createContext(null);

const STORAGE_KEY = "fintracker:colorMode";

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState("dark");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") setMode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode]
  );

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error("useColorMode must be used inside <ColorModeProvider/>");
  return ctx;
}
