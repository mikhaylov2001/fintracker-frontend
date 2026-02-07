// src/utils/monthHistoryStorage.js

const keyFor = (userId) => `fintracker:monthHistory:${userId}`;

export const loadMonthHistory = (userId) => {
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const saveMonthHistory = (userId, history) => {
  window.localStorage.setItem(keyFor(userId), JSON.stringify(history));
};

// snapshot = { year, month, total_income, total_expenses, balance, savings, savings_rate_percent, savedAt }
export const upsertMonthSnapshot = (userId, snapshot) => {
  const history = loadMonthHistory(userId);

  const idx = history.findIndex((x) => x.year === snapshot.year && x.month === snapshot.month);
  const next = [...history];

  if (idx >= 0) next[idx] = snapshot;
  else next.push(snapshot);

  next.sort((a, b) => (a.year - b.year) || (a.month - b.month));
  saveMonthHistory(userId, next);

  return next;
};

const ymToNumber = ({ year, month }) => year * 12 + (month - 1);

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, (month - 1) + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

// Догоняем историю:
// - если истории нет: заполним последние `prefillMonths` месяцев включая текущий;
// - если есть: докачаем от последнего сохранённого месяца до текущего включительно.
export const syncMonthHistory = async ({
  userId,
  getMonthlySummary,
  targetYM,
  prefillMonths = 12,
}) => {
  if (!userId) return [];

  const history = loadMonthHistory(userId);
  const targetNum = ymToNumber(targetYM);

  let startYM;

  if (history.length === 0) {
    startYM = addMonthsYM(targetYM, -(prefillMonths - 1));
  } else {
    const last = history[history.length - 1];
    startYM = addMonthsYM({ year: last.year, month: last.month }, +1);
  }

  let cur = startYM;
  let curNum = ymToNumber(cur);

  if (curNum > targetNum) return history;

  let nextHistory = history;

  while (curNum <= targetNum) {
    const data = await getMonthlySummary(userId, cur.year, cur.month);

    const snapshot = {
      year: cur.year,
      month: cur.month,
      total_income: data?.total_income ?? 0,
      total_expenses: data?.total_expenses ?? 0,
      balance: data?.balance ?? 0,
      savings: data?.savings ?? 0,
      savings_rate_percent: data?.savings_rate_percent ?? 0,
      savedAt: new Date().toISOString(),
    };

    nextHistory = upsertMonthSnapshot(userId, snapshot);

    cur = addMonthsYM(cur, +1);
    curNum = ymToNumber(cur);
  }

  return nextHistory;
};

// ====== LIVE-UPDATE истории (для Dashboard без перезагрузки) ======
export const MONTH_HISTORY_EVENT_NAME = 'fintracker:monthHistoryUpdated';

export const notifyMonthHistoryUpdated = (detail) => {
  window.dispatchEvent(new CustomEvent(MONTH_HISTORY_EVENT_NAME, { detail }));
};

export const refreshMonthSnapshot = async (userId, year, month, getMonthlySummary) => {
  const data = await getMonthlySummary(userId, year, month);

  const snapshot = {
    year,
    month,
    total_income: data?.total_income ?? 0,
    total_expenses: data?.total_expenses ?? 0,
    balance: data?.balance ?? 0,
    savings: data?.savings ?? 0,
    savings_rate_percent: data?.savings_rate_percent ?? 0,
    savedAt: new Date().toISOString(),
  };

  const nextHistory = upsertMonthSnapshot(userId, snapshot);
  notifyMonthHistoryUpdated({ userId, year, month, size: nextHistory.length });

  return nextHistory;
};
