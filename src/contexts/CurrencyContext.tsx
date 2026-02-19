// src/context/CurrencyContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getMySettings } from "../api/settings"; // GET /api/settings/me
import { useExchangeRates } from "../hooks/useExchangeRates";

type CurrencyContextValue = {
  currency: string;
  hideAmounts: boolean;
  formatAmount: (value: number | string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>("RUB");
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);

  // подгружаем настройки пользователя
  useEffect(() => {
    getMySettings().then((s) => {
      setCurrency(s.displayCurrency || "RUB");
      setHideAmounts(s.hideAmounts);
    });
  }, []);

  // курсы относительно RUB
  const { rates } = useExchangeRates("RUB");

  const rate = useMemo(() => {
    return rates[currency] ?? 1;
  }, [rates, currency]);

  const formatAmount = (amount: number | string) => {
    if (hideAmounts) return "••••";
    const num = Number(amount) || 0;
    const converted = num * rate;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  const value: CurrencyContextValue = {
    currency,
    hideAmounts,
    formatAmount,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
};
