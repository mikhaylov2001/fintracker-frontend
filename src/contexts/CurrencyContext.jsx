// src/contexts/CurrencyContext.jsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";

const CurrencyContext = createContext(null);

const DEFAULT_CURRENCY = "RUB";

export const CurrencyProvider = ({ children }) => {
  const { authFetch } = useAuth();
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // если authFetch ещё не инициализирован – просто выходим
        if (!authFetch) return;

        const res = await authFetch("/api/settings/me");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;

        setCurrency(data.displayCurrency || DEFAULT_CURRENCY);
        setHideAmounts(!!data.hideAmounts);
      } catch {
        if (!cancelled) {
          setCurrency(DEFAULT_CURRENCY);
          setHideAmounts(false);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  const toggleHideAmounts = useCallback(() => {
    setHideAmounts((prev) => !prev);
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
      loaded,
      currency,
      hideAmounts,
      setCurrency,
      setHideAmounts,
      toggleHideAmounts,
      formatAmount,
    }),
    [loaded, currency, hideAmounts, setCurrency, setHideAmounts, toggleHideAmounts, formatAmount]
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
