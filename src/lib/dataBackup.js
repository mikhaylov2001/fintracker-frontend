import { mapApiRow, unwrapList } from "./ftUtils";
import { parseYM, unwrapSummariesList } from "./periodUtils";

const PAGE_SIZE = 200;

async function fetchAllPages(fetchPage) {
  const all = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const res = await fetchPage(page, PAGE_SIZE);
    const chunk = unwrapList(res?.data ?? res);
    all.push(...chunk);
    const tp = res?.totalPages ?? res?.data?.totalPages;
    if (typeof tp === "number" && tp > 0) {
      totalPages = tp;
    } else if (chunk.length < PAGE_SIZE) {
      break;
    }
    page += 1;
  }

  return all;
}

function monthsFromSummaries(summaries) {
  const set = new Set();
  (summaries || []).forEach((s) => {
    if (s?.year && s?.month) {
      set.add(`${s.year}-${String(s.month).padStart(2, "0")}`);
    } else if (s?.ym) {
      set.add(s.ym);
    }
  });
  return [...set].sort();
}

export async function fetchAllUserData({ incomeApi, expensesApi, summaryApi }) {
  const summariesRaw = await summaryApi.getMyMonthlySummaries();
  const summaries = unwrapSummariesList(summariesRaw);

  let months = monthsFromSummaries(summaries);
  if (months.length === 0) {
    try {
      const used = await summaryApi.getMyUsedMonths?.();
      if (Array.isArray(used)) months = used;
    } catch {
      /* optional endpoint */
    }
  }

  const incomeByMonth = await Promise.all(
    months.map(async (ym) => {
      const p = parseYM(ym);
      if (!p) return [];
      const res = await incomeApi.getMyIncomesByMonth(p.year, p.month, 0, PAGE_SIZE);
      return unwrapList(res?.data ?? res).map((x) => mapApiRow(x, "income"));
    })
  );

  const expenseByMonth = await Promise.all(
    months.map(async (ym) => {
      const p = parseYM(ym);
      if (!p) return [];
      const res = await expensesApi.getMyExpensesByMonth(p.year, p.month, 0, PAGE_SIZE);
      return unwrapList(res?.data ?? res).map((x) => mapApiRow(x, "expense"));
    })
  );

  let income = incomeByMonth.flat();
  let expenses = expenseByMonth.flat();

  if (income.length === 0) {
    const raw = await fetchAllPages((page, size) => incomeApi.getMyIncomes(page, size));
    income = raw.map((x) => mapApiRow(x, "income"));
  }
  if (expenses.length === 0) {
    const raw = await fetchAllPages((page, size) => expensesApi.getMyExpenses(page, size));
    expenses = raw.map((x) => mapApiRow(x, "expense"));
  }

  const uniq = (rows) => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.id != null) map.set(String(r.id), r);
    });
    return [...map.values()];
  };

  return { income: uniq(income), expenses: uniq(expenses), summaries };
}

export function toBackupPayload({ user, settings, income, expenses }) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      name: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      currency: settings?.displayCurrency ?? settings?.currency ?? "RUB",
      hideAmounts: !!settings?.hideAmounts,
    },
    income: income.map((t) => ({
      amount: t.amount,
      category: t.category,
      source: t.source || "Другое",
      comment: t.comment,
      date: t.date,
    })),
    expenses: expenses.map((t) => ({
      amount: t.amount,
      category: t.category,
      description: t.comment || t.category || "Расход",
      date: t.date,
    })),
  };
}

export function downloadJsonBackup(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fintracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackupFile(file, { incomeApi, expensesApi }) {
  const text = await file.text();
  const data = JSON.parse(text);

  const incomes = Array.isArray(data.income) ? data.income : [];
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];

  for (const row of incomes) {
    await incomeApi.createIncome({
      amount: String(row.amount),
      category: row.category || "Другое",
      source: row.source || "Другое",
      date: row.date,
    });
  }

  for (const row of expenses) {
    await expensesApi.createExpense({
      amount: String(row.amount),
      category: row.category || "Другое",
      description: row.description || row.comment || row.category || "Расход",
      date: row.date,
    });
  }

  return { incomeCount: incomes.length, expenseCount: expenses.length };
}

export async function deleteAllUserData({ deleteData, summaryApi, income, expenses }) {
  const months = new Set();

  (income || []).forEach((t) => {
    if (t.date) months.add(t.date.slice(0, 7));
  });
  (expenses || []).forEach((t) => {
    if (t.date) months.add(t.date.slice(0, 7));
  });

  if (months.size === 0) {
    try {
      const summaries = unwrapSummariesList(await summaryApi.getMyMonthlySummaries());
      monthsFromSummaries(summaries).forEach((m) => months.add(m));
    } catch {
      /* ignore */
    }
  }

  for (const ym of months) {
    const p = parseYM(ym);
    if (p) await deleteData(p.year, p.month, "all");
  }
}
