// src/pages/Analytics/AnalyticsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  getMyMonthlySummary,
  getMyMonthlySummaries,
} from "../../api/summaryApi";
import { getMyExpensesByMonth } from "../../api/expensesApi";
import { getMyIncomesByMonth } from "../../api/incomeApi";

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const ymKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;

const COLORS = [
  "#6366F1",
  "#22C55E",
  "#F97316",
  "#A78BFA",
  "#06B6D4",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EC4899",
];

export default function AnalyticsPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fmtRub = useMemo(
    () =>
      new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }),
    []
  );

  const fmtMonth = useMemo(
    () => new Intl.DateTimeFormat("ru-RU", { month: "short" }),
    []
  );

  const [monthSummary, setMonthSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState({
    expenses: [],
    incomes: [],
  });

  const [loading, setLoading] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState("");

  // 1) summary + history
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const curData = await getMyMonthlySummary(year, month);
        const allData = await getMyMonthlySummaries();

        if (cancelled) return;

        setMonthSummary(curData || null);
        setHistory(Array.isArray(allData) ? allData : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Ошибка загрузки аналитики");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  // 2) category breakdown for current month
  useEffect(() => {
    let cancelled = false;

    const runCats = async () => {
      try {
        setLoadingCats(true);

        const respE = await getMyExpensesByMonth(year, month, 0, 500);
        const respI = await getMyIncomesByMonth(year, month, 0, 500);

        const pageE = respE; // fetch-style: уже JSON
        const pageI = respI; // fetch-style: уже JSON

        const eItems = Array.isArray(pageE?.content) ? pageE.content : [];
        const iItems = Array.isArray(pageI?.content) ? pageI.content : [];

        const byCategory = (items, amountField = "amount") => {
          const map = new Map();
          for (const it of items) {
            const cat = String(it?.category || "Без категории").trim() || "Без категории";
            const amt = n(it?.[amountField]);
            map.set(cat, (map.get(cat) || 0) + amt);
          }
          return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        };

        const expensesCats = byCategory(eItems, "amount");
        const incomesCats = byCategory(iItems, "amount");

        if (cancelled) return;

        setCategories({
          expenses: expensesCats,
          incomes: incomesCats,
        });
      } catch {
        if (!cancelled) {
          setCategories({ expenses: [], incomes: [] });
        }
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    };

    runCats();
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  // chart data: last 6 months from history (includes current if backend already has it)
  const historySorted = useMemo(() => {
    const arr = Array.isArray(history) ? [...history] : [];
    arr.sort((a, b) => (a.year - b.year) || (a.month - b.month));
    return arr;
  }, [history]);

  const last6 = useMemo(() => {
    const take = historySorted.slice(-6);
    return take.map((h) => {
      const d = new Date(h.year, (h.month || 1) - 1, 1);
      return {
        key: ymKey(h.year, h.month),
        name: fmtMonth.format(d),
        income: n(h.totalIncome),
        expense: n(h.totalExpenses),
        savings: n(h.savings),
        balance: n(h.balance),
        savingsRate: n(h.savingsRatePercent),
      };
    });
  }, [historySorted, fmtMonth]);

  const income = n(monthSummary?.totalIncome);
  const expense = n(monthSummary?.totalExpenses);
  const balance = n(monthSummary?.balance);
  const savingsRate = n(monthSummary?.savingsRatePercent);

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: "#0F172A" }}>
          Аналитика
        </Typography>

        <Typography variant="body2" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>
          {loading ? "Загрузка…" : `Текущий месяц: ${month}/${year}`}
        </Typography>

        {error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : null}
      </Stack>

      <Grid container spacing={2}>
        {/* KPIs */}
        <Grid item xs={12} md={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              backgroundColor: alpha("#FFFFFF", 0.86),
              borderColor: "rgba(15, 23, 42, 0.08)",
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>
                Доходы (месяц)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {fmtRub.format(income)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              backgroundColor: alpha("#FFFFFF", 0.86),
              borderColor: "rgba(15, 23, 42, 0.08)",
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>
                Расходы (месяц)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {fmtRub.format(expense)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              backgroundColor: alpha("#FFFFFF", 0.86),
              borderColor: "rgba(15, 23, 42, 0.08)",
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>
                Баланс (месяц)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {fmtRub.format(balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              backgroundColor: alpha("#FFFFFF", 0.86),
              borderColor: "rgba(15, 23, 42, 0.08)",
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>
                Норма сбережений
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {`${savingsRate}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Bar chart: last 6 months */}
        <Grid item xs={12} md={8}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              backgroundColor: alpha("#FFFFFF", 0.86),
              borderColor: "rgba(15, 23, 42, 0.08)",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "#0F172A" }}>
                Доходы и расходы (последние 6 месяцев)
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: "rgba(15, 23, 42, 0.10)" }} />

              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={last6}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(v) => fmtRub.format(n(v))}
                      labelFormatter={(label) => `Месяц: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Доходы" fill="#22C55E" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Расходы" fill="#F97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie: expenses by category */}
        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              backgroundColor: alpha("#FFFFFF", 0.86),
              borderColor: "rgba(15, 23, 42, 0.08)",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "#0F172A" }}>
                Расходы по категориям
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(15, 23, 42, 0.65)", mt: 0.25 }}>
                {loadingCats ? "Загрузка…" : "Текущий месяц"}
              </Typography>

              <Divider sx={{ my: 1.5, borderColor: "rgba(15, 23, 42, 0.10)" }} />

              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categories.expenses}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                    >
                      {(categories.expenses || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmtRub.format(n(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {(!categories.expenses || categories.expenses.length === 0) && !loadingCats ? (
                <Typography variant="body2" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>
                  Нет данных за месяц.
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
