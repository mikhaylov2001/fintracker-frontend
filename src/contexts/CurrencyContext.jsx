// src/contexts/CurrencyContext.js
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

const CurrencyContext = createContext(null);

const DEFAULT_CURRENCY = "RUB";
const HIDE_KEY = "fintracker:hideAmounts";

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  // флаг "спрятать суммы" (глобально)
  const [hideAmounts, setHideAmounts] = useState(() => {
    try {
      const v = window.localStorage.getItem(HIDE_KEY);
      return v === "1";
    } catch {
      return false;
    }
  });

  const toggleHideAmounts = useCallback(() => {
    setHideAmounts((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(HIDE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  const formatAmount = useCallback(
    (value) => {
      if (hideAmounts) return "••••";
      const num = Number(value || 0);
      try {
        return new Intl.NumberFormat("ru-RU", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(num);
      } catch {
        return `${num.toFixed(0)} ${currency}`;
      }
    },
    [currency, hideAmounts]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      hideAmounts,
      toggleHideAmounts,
      formatAmount,
    }),
    [currency, hideAmounts, toggleHideAmounts, formatAmount]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
