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

import { getMyMonthlySummary, getMyMonthlySummaries } from "../../api/summaryApi";
import { getMyExpensesByMonth } from "../../api/expensesApi";
import { getMyIncomesByMonth } from "../../api/incomeApi";

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const COLORS = ["#6366F1", "#22C55E", "#F97316", "#A78BFA", "#06B6D4", "#EF4444", "#F59E0B", "#10B981"];

const extractContent = (resp) => {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.content)) return resp.content;
  return [];
};

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

  const fmtMonthShort = useMemo(
    () => new Intl.DateTimeFormat("ru-RU", { month: "short" }),
    []
  );

  const [monthSummary, setMonthSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState({ expenses: [], incomes: [] });

  const [loading, setLoading] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState("");

  // summary + history (fetch-style)
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

  // categories for current month
  useEffect(() => {
    let cancelled = false;

    const runCats = async () => {
      try {
        setLoadingCats(true);

        const respE = await getMyExpensesByMonth(year, month, 0, 500);
        const respI = await getMyIncomesByMonth(year, month, 0, 500);

        const eItems = extractContent(respE);
        const iItems = extractContent(respI);

        const toAgg = (items) => {
          const map = new Map();
          for (const it of items) {
            const name = String(it?.category || "Без категории").trim() || "Без категории";
            map.set(name, (map.get(name) || 0) + n(it?.amount));
          }
          return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        };

        if (cancelled) return;

        setCategories({
          expenses: toAgg(eItems),
          incomes: toAgg(iItems),
        });
      } catch (e) {
        if (!cancelled) setCategories({ expenses: [], incomes: [] });
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    };

    runCats();
    return () => {
      cancelled = true;
    };
  }, [year, month]);

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
        name: fmtMonthShort.format(d),
        income: n(h.totalIncome),
        expense: n(h.totalExpenses),
      };
    });
  }, [historySorted, fmtMonthShort]);

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
          <Card variant="outlined" sx={{ borderRadius: 3, backgroundColor: alpha("#FFFFFF", 0.86), borderColor: "rgba(15, 23, 42, 0.08)" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>Доходы (месяц)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{fmtRub.format(income)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 3, backgroundColor: alpha("#FFFFFF", 0.86), borderColor: "rgba(15, 23, 42, 0.08)" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>Расходы (месяц)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{fmtRub.format(expense)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 3, backgroundColor: alpha("#FFFFFF", 0.86), borderColor: "rgba(15, 23, 42, 0.08)" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>Баланс (месяц)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{fmtRub.format(balance)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 3, backgroundColor: alpha("#FFFFFF", 0.86), borderColor: "rgba(15, 23, 42, 0.08)" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "rgba(15, 23, 42, 0.65)" }}>Норма сбережений</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{`${savingsRate}%`}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Bar chart */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: 3, backgroundColor: alpha("#FFFFFF", 0.86), borderColor: "rgba(15, 23, 42, 0.08)" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "#0F172A" }}>
                Доходы и расходы (последние 6 месяцев)
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: "rgba(15, 23, 42, 0.10)" }} />

              {/* FIX for recharts width(-1)/height(-1) */}
              <Box sx={{ width: "100%", height: 320, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last6}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v) => fmtRub.format(n(v))} />
                    <Legend />
                    <Bar dataKey="income" name="Доходы" fill="#22C55E" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Расходы" fill="#F97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie chart expenses */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, backgroundColor: alpha("#FFFFFF", 0.86), borderColor: "rgba(15, 23, 42, 0.08)" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "#0F172A" }}>
                Расходы по категориям
              </Typography>

              <Typography variant="body2" sx={{ color: "rgba(15, 23, 42, 0.65)", mt: 0.25 }}>
                {loadingCats ? "Загрузка…" : "Текущий месяц"}
              </Typography>

              <Divider sx={{ my: 1.5, borderColor: "rgba(15, 23, 42, 0.10)" }} />

              {/* FIX for recharts width(-1)/height(-1) */}
              <Box sx={{ width: "100%", height: 320, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories.expenses}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                    >
                      {(categories.expenses || []).map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
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
