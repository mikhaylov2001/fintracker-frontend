import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { buildSourceList, canonicalSourceName, DEFAULT_INCOME_SOURCES, isDefaultSource } from "../lib/defaultIncomeSources";

const IncomeSourcesContext = createContext(null);

function cacheKey(userId) {
  return userId ? `ft_income_sources_v2_${userId}` : null;
}

function readCache(userId) {
  const key = cacheKey(userId);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string" && s.trim()) : [];
  } catch {
    return [];
  }
}

function writeCache(userId, customSources) {
  const key = cacheKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(customSources));
  } catch {}
}

export function IncomeSourcesProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id ?? null;
  const [customSources, setCustomSources] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setCustomSources([]);
      return;
    }
    setCustomSources(readCache(userId));
  }, [isAuthenticated, userId]);

  const getSourceNames = useCallback(
    (extraNames = []) => buildSourceList(customSources, extraNames),
    [customSources]
  );

  const addSource = useCallback(
    async (name) => {
      const trimmed = canonicalSourceName(name);
      if (!trimmed) throw new Error("Введите название источника");

      const existing = [...DEFAULT_INCOME_SOURCES, ...customSources].find(
        (s) => s.localeCompare(trimmed, "ru", { sensitivity: "accent" }) === 0
      );
      if (existing) return { name: existing };

      if (isDefaultSource(trimmed)) {
        return {
          name:
            DEFAULT_INCOME_SOURCES.find((s) => s.toLowerCase() === trimmed.toLowerCase()) || trimmed,
        };
      }

      setCustomSources((prev) => {
        const next = [...prev, trimmed];
        if (userId) writeCache(userId, next);
        return next;
      });
      return { name: trimmed };
    },
    [customSources, userId]
  );

  const value = useMemo(
    () => ({
      getSourceNames,
      addSource,
    }),
    [getSourceNames, addSource]
  );

  return <IncomeSourcesContext.Provider value={value}>{children}</IncomeSourcesContext.Provider>;
}

export function useIncomeSources({ extraNames = [] } = {}) {
  const ctx = useContext(IncomeSourcesContext);
  if (!ctx) throw new Error("useIncomeSources must be used within IncomeSourcesProvider");

  const { getSourceNames, addSource } = ctx;

  const sourceNames = useMemo(
    () => getSourceNames(extraNames),
    [getSourceNames, extraNames]
  );

  return { sourceNames, addSource };
}
