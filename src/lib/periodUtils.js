/** Утилиты периодов: месяц, диапазон, агрегация summary */

export const parseYM = (ym) => {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return null;
  return { year: y, month: m };
};

export const toYM = ({ year, month }) =>
  `${year}-${String(month).padStart(2, "0")}`;

export const ymToNum = (ym) => {
  const p = parseYM(ym);
  if (!p) return 0;
  return p.year * 12 + (p.month - 1);
};

export const addMonthsYM = (ym, delta) => {
  const p = parseYM(ym);
  if (!p) return ym;
  const d = new Date(p.year, p.month - 1 + delta, 1);
  return toYM({ year: d.getFullYear(), month: d.getMonth() + 1 });
};

export const orderYM = (a, b) =>
  ymToNum(a) <= ymToNum(b) ? [a, b] : [b, a];

export const monthsBetween = (fromYM, toYM) => {
  const fromN = ymToNum(fromYM);
  const toN = ymToNum(toYM);
  if (!fromN || !toN || fromN > toN) return [];
  const out = [];
  let cur = fromYM;
  while (ymToNum(cur) <= toN) {
    out.push(cur);
    if (cur === toYM) break;
    cur = addMonthsYM(cur, 1);
  }
  return out;
};

/** Месяцы для режима period: month | 3m | 6m | year | all | range */
export function resolvePeriodMonths(period, allSummaries = []) {
  const anchor = period.anchorYM;
  const now = anchor || currentYM();

  if (period.mode === "all") {
    return allSummaries
      .map((s) => toYM({ year: s.year, month: s.month }))
      .sort((a, b) => ymToNum(b) - ymToNum(a));
  }

  if (period.mode === "range" && period.fromYM && period.toYM) {
    return monthsBetween(period.fromYM, period.toYM);
  }

  if (period.mode === "year") {
    const p = parseYM(now);
    const y = p.year;
    return Array.from({ length: 12 }, (_, i) => toYM({ year: y, month: i + 1 }));
  }

  if (period.mode === "6m") {
    return Array.from({ length: 6 }, (_, i) => addMonthsYM(now, -(5 - i)));
  }

  if (period.mode === "3m") {
    return Array.from({ length: 3 }, (_, i) => addMonthsYM(now, -(2 - i)));
  }

  return [now];
}

export function periodDescription(period) {
  const anchor = period.anchorYM;
  const p = parseYM(anchor);
  const monthName = p
    ? new Date(p.year, p.month - 1, 1).toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      })
    : "";

  switch (period.mode) {
    case "month":
      return monthName;
    case "3m":
      return `3 месяца · до ${monthName}`;
    case "6m":
      return `6 месяцев · до ${monthName}`;
    case "year":
      return p ? `${p.year} год` : "Год";
    case "all":
      return "Все месяцы с данными";
    case "range":
      if (period.fromYM && period.toYM) {
        const f = parseYM(period.fromYM);
        const t = parseYM(period.toYM);
        const fmt = (x) =>
          new Date(x.year, x.month - 1, 1).toLocaleDateString("ru-RU", {
            month: "short",
            year: "numeric",
          });
        return `${fmt(f)} — ${fmt(t)}`;
      }
      return "Свой период";
    default:
      return monthName;
  }
}

export const currentYM = () => {
  const d = new Date();
  return toYM({ year: d.getFullYear(), month: d.getMonth() + 1 });
};

export const defaultPeriod = () => ({
  mode: "month",
  anchorYM: currentYM(),
  fromYM: addMonthsYM(currentYM(), -5),
  toYM: currentYM(),
});

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function normalizeSummaryRow(raw) {
  if (!raw) return null;
  return {
    year: Number(raw.year),
    month: Number(raw.month),
    ym: toYM({ year: Number(raw.year), month: Number(raw.month) }),
    totalIncome: n(raw.total_income ?? raw.totalIncome),
    totalExpenses: n(raw.total_expenses ?? raw.totalExpenses),
    savings: n(raw.savings),
    savingsRatePercent: n(raw.savings_rate_percent ?? raw.savingsRatePercent),
    balance: n(raw.balance ?? raw.savings),
  };
}

export function aggregateSummaries(rows, monthList) {
  const set = new Set(monthList);
  const filtered = rows.filter((r) => set.has(r.ym));
  const income = filtered.reduce((s, r) => s + r.totalIncome, 0);
  const expenses = filtered.reduce((s, r) => s + r.totalExpenses, 0);
  const savings = Math.max(0, income - expenses);
  const rate = income > 0 ? Math.round((savings / income) * 100) : 0;
  return { income, expenses, savings, rate, months: filtered.length };
}

export function unwrapSummariesList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normalizeSummaryRow).filter(Boolean);
  const data = raw.data ?? raw;
  if (Array.isArray(data)) return data.map(normalizeSummaryRow).filter(Boolean);
  return [];
}

/** Уникальные дни с операциями для «среднего в день» */
export function avgPerDay(total, items) {
  const days = new Set(
    (items || [])
      .map((t) => t.date)
      .filter(Boolean)
  );
  const count = days.size || 1;
  return Math.round(total / count);
}
