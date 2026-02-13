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

import {
  loadMonthHistory,
  syncMonthHistory,
  MONTH_HISTORY_EVENT_NAME,
} from '../../utils/monthHistoryStorage';

/* ────────── constants ────────── */
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

const ymNum = (y, m) => y * 12 + (m - 1);

const fmtMonthLong = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
const fmtMonthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short' });

const monthTitleRu = (y, m) => fmtMonthLong.format(new Date(y, m - 1, 1));
const monthShortRu = (y, m) => fmtMonthShort.format(new Date(y, m - 1, 1));

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const unwrap = (raw) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === 'object' && ('total_income' in raw.data || 'totalIncome' in raw.data)) {
    return raw.data;
  }
  return raw;
};

const unwrapList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.data && typeof raw.data === 'object') {
    if (Array.isArray(raw.data.content)) return raw.data.content;
    if (Array.isArray(raw.data)) return raw.data;
  }
  if (Array.isArray(raw.content)) return raw.content;
  return [];
};

/* ────────── StatCard (светлая тема, мобильная) ────────── */
const StatCard = ({ label, value, sub, accent = '#6366F1' }) => (
  <Card
    variant="outlined"
    sx={{
      height: '100%',
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      borderColor: '#E2E8F0',
      backgroundColor: '#FFFFFF',
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
    <CardContent sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: accent, opacity: 0.9 }} />
        <Typography variant="overline" sx={{ color: '#64748B', letterSpacing: 0.6 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 850, color: '#0F172A' }}>
        {value}
      </Typography>
      {sub ? (
        <Typography variant="body2" sx={{ mt: 0.5, color: '#64748B' }}>
          {sub}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);

/* ════════════════════════════════════════════
   AnalyticsPage
   ════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [year] = useState(() => new Date().getFullYear());
  const [month] = useState(() => new Date().getMonth() + 1);

  const modeKey = useMemo(() => `fintracker:analyticsMode:${userId || 'anon'}`, [userId]);
  const [mode, setMode] = useState('month');

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

  const onModeChange = (_e, next) => {
    if (!next) return;
    setMode(next);
  };

  const [topTab, setTopTab] = useState('expenses');

  const fmtRub = useMemo(
    () =>
      new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }),
    []
  );

  /* ── Загрузка истории ── */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const existing = loadMonthHistory(userId);
        if (!cancelled) setHistory(existing);

        try {
          const next = await syncMonthHistory({
            userId,
            getMonthlySummary,
            targetYM: { year, month },
            prefillMonths: 12,
          });
          if (!cancelled && next && next.length > 0) setHistory(next);
        } catch (syncErr) {
          console.warn('[Analytics] syncMonthHistory failed:', syncErr);
          if (existing.length === 0) {
            try {
              const directHistory = [];
              const cur = { year, month };
              const fetches = [];
              for (let i = 0; i < 12; i++) {
                const ym = addMonthsYM(cur, -i);
                fetches.push(
                  getMonthlySummary(userId, ym.year, ym.month)
                    .then((raw) => {
                      const d = unwrap(raw);
                      if (d && (n(d.total_income) > 0 || n(d.total_expenses) > 0)) {
                        directHistory.push({ ...d, year: ym.year, month: ym.month });
                      }
                    })
                    .catch(() => {})
                );
              }
              await Promise.all(fetches);
              if (!cancelled && directHistory.length > 0) {
                setHistory(directHistory);
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Ошибка загрузки аналитики');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, year, month]);

  /* ── Live update ── */
  useEffect(() => {
    if (!userId) return;

    const handler = (e) => {
      const detail = e?.detail;
      if (!detail?.userId || detail.userId !== userId) return;
      setHistory(loadMonthHistory(userId));
    };

    window.addEventListener(MONTH_HISTORY_EVENT_NAME, handler);
    return () => window.removeEventListener(MONTH_HISTORY_EVENT_NAME, handler);
  }, [userId]);

  /* ── Cashflow ── */
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

  const cashflowRows = useMemo(
    () =>
      last12.map((ym) => {
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
      }),
    [last12, historyMap]
  );

  /* ── KPI ── */
  const isYear = mode === 'year';

  const periodLabel = isYear
    ? `Показаны данные: ${year} год`
    : `Показаны данные: ${monthTitleRu(year, month)}`;

  const yearMonths = useMemo(() => {
    const cur = ymNum(year, month);
    return history.filter((h) => h?.year === year && ymNum(h.year, h.month) <= cur);
  }, [history, year, month]);

  const ytdIncome = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_income), 0), [yearMonths]);
  const ytdExpenses = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_expenses), 0), [yearMonths]);
  const ytdBalance = useMemo(() => ytdIncome - ytdExpenses, [ytdIncome, ytdExpenses]);
  const ytdSavings = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.savings), 0), [yearMonths]);
  const ytdRate = useMemo(
    () => (ytdIncome > 0 ? Math.round((ytdBalance / ytdIncome) * 100) : 0),
    [ytdIncome, ytdBalance]
  );

  /* ── Summary текущего месяца ── */
  const [monthSummary, setMonthSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!userId) return;
      try {
        const raw = await getMonthlySummary(userId, year, month);
        const s = unwrap(raw);
        if (!cancelled) setMonthSummary(s);
      } catch {
        if (!cancelled) setMonthSummary(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [userId, year, month]);

  const mIncome = n(monthSummary?.total_income);
  const mExpenses = n(monthSummary?.total_expenses);
  const mBalance = n(monthSummary?.balance);
  const mSavings = n(monthSummary?.savings);
  const mRate = n(monthSummary?.savings_rate_percent);

  const kpiIncome = isYear ? ytdIncome : mIncome;
  const kpiExpenses = isYear ? ytdExpenses : mExpenses;
  const kpiBalance = isYear ? ytdBalance : mBalance;
  const kpiRate = isYear ? ytdRate : mRate;
  const kpiSavings = isYear ? ytdSavings : mSavings;

  /* ── Топ категорий ── */
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
      if (!userId) return;

      try {
        setCatsLoading(true);

        const accExp = new Map();
        const accInc = new Map();

        const tasks = monthsForCats.flatMap((ym) => [
          getExpensesByMonth(ym.year, ym.month, 0, 500)
            .then((resp) => {
              unwrapList(resp).forEach((x) => {
                const cat = String(x.category || 'Другое');
                accExp.set(cat, (accExp.get(cat) || 0) + n(x.amount));
              });
            })
            .catch((err) => {
              console.warn(`[Analytics] expenses ${ym.year}-${ym.month}:`, err?.message);
            }),

          getIncomesByMonth(ym.year, ym.month, 0, 500)
            .then((resp) => {
              unwrapList(resp).forEach((x) => {
                const cat = String(x.category || 'Другое');
                accInc.set(cat, (accInc.get(cat) || 0) + n(x.amount));
              });
            })
            .catch((err) => {
              console.warn(`[Analytics] income ${ym.year}-${ym.month}:`, err?.message);
            }),
        ]);

        await Promise.all(tasks);

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
  }, [userId, monthsForCats]);

  const activeTopRows = topTab === 'expenses' ? topCatsExpenses : topCatsIncome;
  const topTitle = topTab === 'expenses' ? 'Топ категорий расходов' : 'Топ категорий доходов';
  const topBarColor = topTab === 'expenses' ? COLORS.expenses : COLORS.income;

  if (!userId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#64748B' }}>
          Загрузка профиля…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ mb: 2 }}
        alignItems={{ sm: 'center' }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.15, color: '#0F172A' }}>
            Аналитика
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
            {periodLabel}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}
        >
          <Chip
            label={loading ? 'Загрузка…' : error ? 'Частично' : 'Актуально'}
            variant="filled"
            sx={{
              borderRadius: 999,
              bgcolor: error ? alpha('#F97316', 0.1) : '#EEF2FF',
              color: error ? '#F97316' : COLORS.analytics,
              fontWeight: 700,
            }}
          />
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={onModeChange}
            size="small"
            sx={{
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 999,
              '& .MuiToggleButton-root': {
                border: 0,
                px: 1.5,
                color: '#64748B',
                '&.Mui-selected': { color: '#0F172A', fontWeight: 700, bgcolor: '#F1F5F9' },
              },
            }}
          >
            <ToggleButton value="month">Месяц</ToggleButton>
            <ToggleButton value="year">Год</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {error ? (
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2, borderColor: '#FECACA', bgcolor: '#FFF' }}>
          <CardContent sx={{ py: 1.75 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={1.5}>
        {/* KPI — xs=12, sm=6 для мобилы */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Баланс" value={fmtRub.format(kpiBalance)} accent={COLORS.balance} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Доходы" value={fmtRub.format(kpiIncome)} accent={COLORS.income} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Расходы" value={fmtRub.format(kpiExpenses)} accent={COLORS.expenses} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Норма сбережений"
            value={`${kpiRate}%`}
            sub={`Сбережения: ${fmtRub.format(kpiSavings)}`}
            accent="#A78BFA"
          />
        </Grid>

        {/* Cashflow */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#E2E8F0', bgcolor: '#FFFFFF' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A' }}>
                Cashflow за 12 месяцев
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <BarChart
                    height={260}
                    xAxis={[{ data: cashflowRows.map((r) => r.label), scaleType: 'band' }]}
                    series={[
                      { data: cashflowRows.map((r) => r.income), label: 'Доходы', color: COLORS.income },
                      { data: cashflowRows.map((r) => r.expenses), label: 'Расходы', color: COLORS.expenses },
                    ]}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <LineChart
                    height={260}
                    xAxis={[{ data: cashflowRows.map((r) => r.label), scaleType: 'point' }]}
                    series={[{ data: cashflowRows.map((r) => r.balance), label: 'Баланс', color: COLORS.balance }]}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Топ категорий */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#E2E8F0', bgcolor: '#FFFFFF' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A', flexGrow: 1 }}>
                  {topTitle}
                </Typography>
                <Chip
                  label={catsLoading ? 'Считаю…' : isYear ? `${year} год` : monthTitleRu(year, month)}
                  sx={{
                    borderRadius: 999,
                    borderColor: alpha(topBarColor, 0.35),
                    color: topBarColor,
                    bgcolor: alpha(topBarColor, 0.08),
                  }}
                  variant="outlined"
                />
              </Stack>

              <Tabs
                value={topTab}
                onChange={(_e, v) => setTopTab(v)}
                sx={{ mt: 1, minHeight: 40, '& .MuiTab-root': { minHeight: 40, color: '#64748B' } }}
              >
                <Tab label="Расходы" value="expenses" />
                <Tab label="Доходы" value="income" />
              </Tabs>

              <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />

              {catsLoading ? (
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Загрузка данных по категориям…
                </Typography>
              ) : activeTopRows.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  Нет данных по категориям за выбранный период.
                </Typography>
              ) : (
                <BarChart
                  height={230}
                  layout="horizontal"
                  yAxis={[{ data: activeTopRows.map((x) => x.category), scaleType: 'band' }]}
                  series={[{ data: activeTopRows.map((x) => x.amount), label: 'Сумма', color: topBarColor }]}
                  margin={{ left: 120, right: 20, top: 10, bottom: 30 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
