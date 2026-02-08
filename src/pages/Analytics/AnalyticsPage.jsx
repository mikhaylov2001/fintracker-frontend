import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

import { useAuth } from '../../contexts/AuthContext';

import { getMonthlySummary } from '../../api/summaryApi';
import { getExpensesByMonth } from '../../api/expensesApi';
import { getIncomesByMonth } from '../../api/incomeApi';

import { loadMonthHistory, syncMonthHistory, MONTH_HISTORY_EVENT_NAME } from '../../utils/monthHistoryStorage';

const COLORS = {
  income: '#22C55E',
  expenses: '#F97316',
  balance: '#6366F1',
  analytics: '#6366F1',
};

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const StatCard = ({ label, value, sub, accent = '#6366F1' }) => (
  <Card
    variant="outlined"
    sx={{
      height: '100%',
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      backgroundColor: alpha('#FFFFFF', 0.86),
      backdropFilter: 'blur(10px)',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: accent,
        opacity: 0.75,
      },
    }}
  >
    <CardContent sx={{ p: 2.1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: accent, opacity: 0.9 }} />
        <Typography variant="overline" sx={{ color: 'rgba(15, 23, 42, 0.65)', letterSpacing: 0.6 }}>
          {label}
        </Typography>
      </Stack>

      <Typography variant="h5" sx={{ mt: 0.6, fontWeight: 850, color: '#0F172A' }}>
        {value}
      </Typography>

      {sub ? (
        <Typography variant="body2" sx={{ mt: 0.55, color: 'rgba(15, 23, 42, 0.65)' }}>
          {sub}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);

const ymNum = (y, m) => y * 12 + (m - 1);

const monthTitleRu = (y, m) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));

const monthShortRu = (y, m) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(y, m - 1, 1));

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, (month - 1) + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

export default function AnalyticsPage() {
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const modeKey = useMemo(() => `fintracker:analyticsMode:${user?.id || 'anon'}`, [user?.id]);
  const [mode, setMode] = useState('month'); // 'month' | 'year'

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(modeKey);
      if (v === 'month' || v === 'year') setMode(v);
    } catch {}
  }, [modeKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(modeKey, mode);
    } catch {}
  }, [modeKey, mode]);

  const onModeChange = (e, next) => {
    if (!next) return;
    setMode(next);
  };

  const [topTab, setTopTab] = useState('expenses'); // 'expenses' | 'income'

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fmtRub = useMemo(
    () => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError('');
        if (!user?.id) throw new Error('Нет user.id');

        const existing = loadMonthHistory(user.id);
        if (!cancelled) setHistory(existing);

        const next = await syncMonthHistory({
          userId: user.id,
          getMonthlySummary,
          targetYM: { year, month },
          prefillMonths: 12,
        });

        if (!cancelled) setHistory(next);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Ошибка загрузки аналитики');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, year, month]);

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail;
      if (!detail?.userId || detail.userId !== user?.id) return;
      setHistory(loadMonthHistory(user.id));
    };

    window.addEventListener(MONTH_HISTORY_EVENT_NAME, handler);
    return () => window.removeEventListener(MONTH_HISTORY_EVENT_NAME, handler);
  }, [user?.id]);

  const last12 = useMemo(() => {
    const cur = { year, month };
    const arr = [];
    for (let i = 11; i >= 0; i--) arr.push(addMonthsYM(cur, -i));
    return arr;
  }, [year, month]);

  const historyMap = useMemo(() => {
    const m = new Map();
    history.forEach((h) => m.set(`${h.year}-${h.month}`, h));
    return m;
  }, [history]);

  const cashflowRows = useMemo(() => {
    return last12.map((ym) => {
      const h = historyMap.get(`${ym.year}-${ym.month}`);
      const income = n(h?.total_income);
      const expenses = n(h?.total_expenses);
      const balance = income - expenses;
      return {
        label: `${monthShortRu(ym.year, ym.month)} ${String(ym.year).slice(2)}`,
        income,
        expenses,
        balance,
      };
    });
  }, [last12, historyMap]);

  const isYear = mode === 'year';

  const periodLabel = useMemo(() => {
    return isYear ? `Показаны данные: ${year} год` : `Показаны данные: ${monthTitleRu(year, month)}`;
  }, [isYear, year, month]);

  const yearMonths = useMemo(() => {
    const cur = ymNum(year, month);
    return history.filter((h) => h?.year === year && ymNum(h.year, h.month) <= cur);
  }, [history, year, month]);

  const ytdIncome = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_income), 0), [yearMonths]);
  const ytdExpenses = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_expenses), 0), [yearMonths]);
  const ytdBalance = useMemo(() => ytdIncome - ytdExpenses, [ytdIncome, ytdExpenses]);
  const ytdRate = useMemo(() => (ytdIncome > 0 ? Math.round((ytdBalance / ytdIncome) * 100) : 0), [ytdIncome, ytdBalance]);

  const [monthSummary, setMonthSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user?.id) return;
      try {
        const s = await getMonthlySummary(user.id, year, month);
        if (!cancelled) setMonthSummary(s);
      } catch {
        if (!cancelled) setMonthSummary(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, year, month]);

  const mIncome = n(monthSummary?.total_income);
  const mExpenses = n(monthSummary?.total_expenses);
  const mBalance = n(monthSummary?.balance);
  const mSavings = n(monthSummary?.savings);
  const mRate = n(monthSummary?.savings_rate_percent);

  const kpiIncome = isYear ? ytdIncome : mIncome;
  const kpiExpenses = isYear ? ytdExpenses : mExpenses;
  const kpiBalance = isYear ? ytdBalance : mBalance;
  const kpiRate = isYear ? ytdRate : mRate;

  const kpiSubRate = isYear ? `Месяцев: ${yearMonths.length}` : `Сбережения: ${fmtRub.format(mSavings)}`;

  const [topCatsExpenses, setTopCatsExpenses] = useState([]);
  const [topCatsIncome, setTopCatsIncome] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  const monthsForCats = useMemo(() => {
    if (!isYear) return [{ year, month }];
    const arr = [];
    for (let m = 1; m <= month; m++) arr.push({ year, month: m });
    return arr;
  }, [isYear, year, month]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user?.id) return;

      try {
        setCatsLoading(true);

        const accExp = new Map();
        const accInc = new Map();

        for (const ym of monthsForCats) {
          const respE = await getExpensesByMonth(user.id, ym.year, ym.month, 0, 500);
          (respE?.content ?? []).forEach((x) => {
            const cat = String(x.category || 'Другое');
            accExp.set(cat, (accExp.get(cat) || 0) + n(x.amount));
          });

          const respI = await getIncomesByMonth(user.id, ym.year, ym.month, 0, 500);
          (respI?.content ?? []).forEach((x) => {
            const cat = String(x.category || 'Другое');
            accInc.set(cat, (accInc.get(cat) || 0) + n(x.amount));
          });
        }

        const topExp = [...accExp.entries()]
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6);

        const topInc = [...accInc.entries()]
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6);

        if (!cancelled) {
          setTopCatsExpenses(topExp);
          setTopCatsIncome(topInc);
        }
      } catch {
        if (!cancelled) {
          setTopCatsExpenses([]);
          setTopCatsIncome([]);
        }
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, monthsForCats]);

  const activeTopRows = topTab === 'expenses' ? topCatsExpenses : topCatsIncome;
  const topTitle = topTab === 'expenses' ? 'Топ категорий расходов' : 'Топ категорий доходов';
  const topBarColor = topTab === 'expenses' ? COLORS.expenses : COLORS.income;

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.15, color: '#0F172A' }}>
            Аналитика
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.70)', mt: 0.5 }}>
            {periodLabel}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
          <Chip
            label={loading ? 'Загрузка…' : 'Актуально'}
            variant="filled"
            sx={{
              borderRadius: 999,
              bgcolor: alpha(COLORS.analytics, 0.10),
              color: COLORS.analytics,
              fontWeight: 700,
            }}
          />

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={onModeChange}
            size="small"
            sx={{
              bgcolor: alpha('#FFFFFF', 0.70),
              border: '1px solid rgba(15, 23, 42, 0.10)',
              borderRadius: 999,
              '& .MuiToggleButton-root': { border: 0, px: 1.5 },
            }}
          >
            <ToggleButton value="month">Месяц</ToggleButton>
            <ToggleButton value="year">Год</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {error ? (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            mb: 2,
            borderColor: alpha('#EF4444', 0.35),
            backgroundColor: alpha('#FFFFFF', 0.86),
          }}
        >
          <CardContent sx={{ py: 1.75 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <StatCard label="Баланс" value={fmtRub.format(kpiBalance)} accent={COLORS.balance} />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard label="Доходы" value={fmtRub.format(kpiIncome)} accent={COLORS.income} />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard label="Расходы" value={fmtRub.format(kpiExpenses)} accent={COLORS.expenses} />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard label="Норма сбережений" value={`${kpiRate}%`} sub={kpiSubRate} accent="#A78BFA" />
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'rgba(15, 23, 42, 0.08)', backgroundColor: alpha('#FFFFFF', 0.86), backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ p: 2.25 }}>
              <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A' }}>
                Cashflow за 12 месяцев
              </Typography>

              <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.10)' }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <BarChart
                    height={300}
                    xAxis={[{ data: cashflowRows.map((r) => r.label), scaleType: 'band' }]}
                    series={[
                      { data: cashflowRows.map((r) => r.income), label: 'Доходы', color: COLORS.income },
                      { data: cashflowRows.map((r) => r.expenses), label: 'Расходы', color: COLORS.expenses },
                    ]}
                  />
                </Grid>

                <Grid item xs={12} md={5}>
                  <LineChart
                    height={300}
                    xAxis={[{ data: cashflowRows.map((r) => r.label), scaleType: 'point' }]}
                    series={[{ data: cashflowRows.map((r) => r.balance), label: 'Баланс', color: COLORS.balance }]}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'rgba(15, 23, 42, 0.08)', backgroundColor: alpha('#FFFFFF', 0.86), backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ p: 2.25 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A', flexGrow: 1 }}>
                  {topTitle}
                </Typography>

                <Chip
                  label={catsLoading ? 'Считаю…' : (isYear ? 'Год' : 'Месяц')}
                  sx={{
                    borderRadius: 999,
                    borderColor: alpha(topBarColor, 0.35),
                    color: topBarColor,
                    bgcolor: alpha(topBarColor, 0.08),
                  }}
                  variant="outlined"
                />
              </Stack>

              <Tabs value={topTab} onChange={(e, v) => setTopTab(v)} sx={{ mt: 1, minHeight: 40, '& .MuiTab-root': { minHeight: 40 } }}>
                <Tab label="Расходы" value="expenses" />
                <Tab label="Доходы" value="income" />
              </Tabs>

              <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.10)' }} />

              {activeTopRows.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'rgba(15,23,42,0.65)' }}>
                  Нет данных по категориям за выбранный период.
                </Typography>
              ) : (
                <BarChart
                  height={270}
                  layout="horizontal"
                  yAxis={[{ data: activeTopRows.map((x) => x.category), scaleType: 'band', width: 150 }]}
                  series={[{ data: activeTopRows.map((x) => x.amount), label: 'Сумма', color: topBarColor }]}
                  margin={{ left: 40, right: 20, top: 10, bottom: 10 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
