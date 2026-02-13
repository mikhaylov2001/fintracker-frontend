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

/* ────────── StatCard ────────── */
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

/* ────────── date helpers ────────── */
const ymNum = (y, m) => y * 12 + (m - 1);

const monthTitleRu = (y, m) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));

const monthShortRu = (y, m) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(y, m - 1, 1));

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

/* ════════════════════════════════════════════
   AnalyticsPage  (исправленная версия)
   ════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ── стабильный год/месяц ── */
  const [year] = useState(() => new Date().getFullYear());
  const [month] = useState(() => new Date().getMonth() + 1);

  /* ── режим: месяц / год ── */
  const modeKey = useMemo(() => `fintracker:analyticsMode:${userId || 'anon'}`, [userId]);
  const [mode, setMode] = useState('month');

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(modeKey);
      if (v === 'month' || v === 'year') setMode(v);
    } catch {
      /* ignore */
    }
  }, [modeKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(modeKey, mode);
    } catch {
      /* ignore */
    }
  }, [modeKey, mode]);

  const onModeChange = (_e, next) => {
    if (!next) return;
    setMode(next);
  };

  /* ── вкладка: расходы / доходы ── */
  const [topTab, setTopTab] = useState('expenses');

  /* ── форматтер ── */
  const fmtRub = useMemo(
    () =>
      new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }),
    [],
  );

  /* ══════════════════════════════════════
     FIX 1 — Загрузка истории
     • Ранний return вместо throw при !userId
     • syncMonthHistory обёрнут в свой try/catch
     ══════════════════════════════════════ */
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
          if (!cancelled) setHistory(next);
        } catch (syncErr) {
          console.warn('[Analytics] syncMonthHistory failed:', syncErr);
          if (!cancelled && existing.length === 0) {
            setError('Не удалось синхронизировать историю. Показаны кэшированные данные.');
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

  /* ── Live-обновление ── */
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

  /* ── 12 месяцев для cashflow ── */
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
  const ytdRate = useMemo(() => (ytdIncome > 0 ? Math.round((ytdBalance / ytdIncome) * 100) : 0), [ytdIncome, ytdBalance]);

  /* ── Текущий месяц (summary) ── */
  const [monthSummary, setMonthSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) return;
      try {
        const s = await getMonthlySummary(userId, year, month);
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
  const kpiSubRate = isYear
    ? `Месяцев: ${yearMonths.length}`
    : `Сбережения: ${fmtRub.format(mSavings)}`;

  /* ══════════════════════════════════════
     FIX 2 — Загрузка категорий
     Проблемы в оригинале:
       a) getExpensesByMonth / getIncomesByMonth — legacy-API
          с userId в path. Нужно использовать /me-endpoints
          (или тот же fallback-подход).
       b) Последовательный for-of по месяцам → N*2 запросов
          последовательно. Нужно параллелить через Promise.all.
       c) При ошибке одного месяца — падает всё.
       d) yAxis width: 150 — обрезает текст, если label
          короткий, и не вмещает длинный.
       e) margin.left: 40 — слишком мало для horizontal bar
          с кириллическими метками.
     ══════════════════════════════════════ */
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

        /*
         * FIX 2a: Параллельная загрузка всех месяцев.
         * Если один месяц упадёт — остальные всё равно загрузятся.
         */
        const tasks = monthsForCats.flatMap((ym) => [
          getExpensesByMonth(ym.year, ym.month, 0, 500)
            .then((resp) => {
              /* FIX 2b: resp может быть axios-обёрткой (resp.data) или чистым объектом */
              const content = resp?.data?.content ?? resp?.content ?? [];
              content.forEach((x) => {
                const cat = String(x.category || 'Другое');
                accExp.set(cat, (accExp.get(cat) || 0) + n(x.amount));
              });
            })
            .catch((err) => {
              console.warn(`[Analytics] expenses ${ym.year}-${ym.month} failed:`, err?.message);
            }),

          getIncomesByMonth(ym.year, ym.month, 0, 500)
            .then((resp) => {
              const content = resp?.data?.content ?? resp?.content ?? [];
              content.forEach((x) => {
                const cat = String(x.category || 'Другое');
                accInc.set(cat, (accInc.get(cat) || 0) + n(x.amount));
              });
            })
            .catch((err) => {
              console.warn(`[Analytics] income ${ym.year}-${ym.month} failed:`, err?.message);
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

  /* ══════════════════════════════════════
     FIX 3 — ранний возврат при !userId
     ══════════════════════════════════════ */
  if (!userId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'rgba(15, 23, 42, 0.65)' }}>
          Загрузка профиля…
        </Typography>
      </Box>
    );
  }

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <>
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
          <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.70)', mt: 0.5 }}>
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
              bgcolor: error
                ? alpha('#F97316', 0.10)
                : alpha(COLORS.analytics, 0.10),
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
          <StatCard
            label="Норма сбережений"
            value={`${kpiRate}%`}
            sub={kpiSubRate}
            accent="#A78BFA"
          />
        </Grid>

        {/* ── Cashflow ── */}
        <Grid item xs={12}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: 'rgba(15, 23, 42, 0.08)',
              backgroundColor: alpha('#FFFFFF', 0.86),
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent sx={{ p: 2.25 }}>
              <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A' }}>
                Cashflow за 12 месяцев
              </Typography>

              <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.10)' }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <BarChart
                    height={300}
                    xAxis={[
                      {
                        data: cashflowRows.map((r) => r.label),
                        scaleType: 'band',
                      },
                    ]}
                    series={[
                      {
                        data: cashflowRows.map((r) => r.income),
                        label: 'Доходы',
                        color: COLORS.income,
                      },
                      {
                        data: cashflowRows.map((r) => r.expenses),
                        label: 'Расходы',
                        color: COLORS.expenses,
                      },
                    ]}
                  />
                </Grid>

                <Grid item xs={12} md={5}>
                  <LineChart
                    height={300}
                    xAxis={[
                      {
                        data: cashflowRows.map((r) => r.label),
                        scaleType: 'point',
                      },
                    ]}
                    series={[
                      {
                        data: cashflowRows.map((r) => r.balance),
                        label: 'Баланс',
                        color: COLORS.balance,
                      },
                    ]}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Топ категорий ── */}
        <Grid item xs={12}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: 'rgba(15, 23, 42, 0.08)',
              backgroundColor: alpha('#FFFFFF', 0.86),
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent sx={{ p: 2.25 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 850, color: '#0F172A', flexGrow: 1 }}
                >
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
                sx={{
                  mt: 1,
                  minHeight: 40,
                  '& .MuiTab-root': { minHeight: 40 },
                }}
              >
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
                  yAxis={[
                    {
                      data: activeTopRows.map((x) => x.category),
                      scaleType: 'band',
                    },
                  ]}
                  series={[
                    {
                      data: activeTopRows.map((x) => x.amount),
                      label: 'Сумма',
                      color: topBarColor,
                    },
                  ]}
                  margin={{ left: 120, right: 20, top: 10, bottom: 30 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
