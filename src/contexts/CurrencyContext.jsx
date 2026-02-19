// src/contexts/CurrencyContext.js
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const CurrencyContext = createContext(null);

const DEFAULT_CURRENCY = "RUB";

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  const formatAmount = useCallback(
    (value) => {
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
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatAmount,
    }),
    [currency, formatAmount]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
