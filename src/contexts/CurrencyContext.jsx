// src/contexts/CurrencyContext.js
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

  // 1. Загружаем настройки из бэка при старте
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
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

  // 2. Обновление настроек на бэке (общий помощник)
  const updateSettingsOnServer = useCallback(
    async (nextCurrency, nextHide) => {
      try {
        const res = await authFetch("/api/settings/me", {
          method: "PUT",
          body: JSON.stringify({
            displayCurrency: nextCurrency ?? currency,
            hideAmounts:
              typeof nextHide === "boolean" ? nextHide : hideAmounts,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(
            d.message || d.error || "Не удалось обновить настройки"
          );
        }
        const data = await res.json();
        setCurrency(data.displayCurrency || DEFAULT_CURRENCY);
        setHideAmounts(!!data.hideAmounts);
      } catch (e) {
        console.error("Failed to update settings", e);
      }
    },
    [authFetch, currency, hideAmounts]
  );

  const setCurrencyAndSave = useCallback(
    (val) => {
      setCurrency(val);
      updateSettingsOnServer(val, undefined);
    },
    [updateSettingsOnServer]
  );

  const setHideAmountsAndSave = useCallback(
    (val) => {
      setHideAmounts(val);
      updateSettingsOnServer(undefined, val);
    },
    [updateSettingsOnServer]
  );

  const toggleHideAmounts = useCallback(() => {
    setHideAmountsAndSave(!hideAmounts);
  }, [hideAmounts, setHideAmountsAndSave]);

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
      setCurrency: setCurrencyAndSave,
      setHideAmounts: setHideAmountsAndSave,
      toggleHideAmounts,
      formatAmount,
    }),
    [
      loaded,
      currency,
      hideAmounts,
      setCurrencyAndSave,
      setHideAmountsAndSave,
      toggleHideAmounts,
      formatAmount,
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
