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

// Базовая валюта хранения данных
const BASE_CURRENCY = "RUB";

// Простейшая таблица курсов относительно RUB
// 1 RUB = rates[<валюта>]
const RATES = {
  RUB: 1,
  USD: 0.011, // пример: 1 RUB ≈ 0.011 USD
  EUR: 0.010, // пример: 1 RUB ≈ 0.010 EUR
};

export const CurrencyProvider = ({ children }) => {
  const { authFetch } = useAuth();
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!authFetch) return;

        const res = await authFetch("/api/settings/me");
        if (!res.ok) {
          throw new Error("Не удалось загрузить настройки");
        }
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

  // Функция конвертации из базовой валюты (RUB) в выбранную
  const convertFromBase = useCallback(
    (value) => {
      const num = Number(value || 0);
      const rate = RATES[currency] ?? 1;
      return num * rate;
    },
    [currency]
  );

  const formatAmount = useCallback(
    (value) => {
      if (hideAmounts) return "••••";

      const numBase = Number(value || 0);           // в БД хранится в RUB
      const numConverted = convertFromBase(numBase); // конвертация в выбранную

      try {
        return new Intl.NumberFormat("ru-RU", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(numConverted);
      } catch {
        return `${numConverted.toFixed(0)} ${currency}`;
      }
    },
    [currency, hideAmounts, convertFromBase]
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
      convertFromBase,
      baseCurrency: BASE_CURRENCY,
    }),
    [
      loaded,
      currency,
      hideAmounts,
      setCurrency,
      setHideAmounts,
      toggleHideAmounts,
      formatAmount,
      convertFromBase,
    ]
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
