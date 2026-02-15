import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Box,
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
import { getMyExpensesByMonth } from '../../api/expensesApi';
import { getMyIncomesByMonth } from '../../api/incomeApi';

const COLORS = {
  income: '#22C55E',
  expenses: '#F97316',
  balance: '#6366F1',
};

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const ymNum = (y, m) => y * 12 + (m - 1);
const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const unwrap = (raw) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === 'object') return raw.data;
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

const fmtMonthLong = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
});
const fmtMonthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short' });

const monthTitleRu = (y, m) => fmtMonthLong.format(new Date(y, m - 1, 1));
const monthShortRu = (y, m) => fmtMonthShort.format(new Date(y, m - 1, 1));

const StatCard = ({ label, value, sub, accent = '#6366F1' }) => (
  <Card
    variant="outlined"
    sx={{
      height: '100%',
      minHeight: 118,
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      backgroundColor: alpha('#FFFFFF', 0.9),
      backdropFilter: 'blur(10px)',
      transition:
        'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
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
      '&:hover': {
        transform: 'translateY(-2px)',
        borderColor: 'rgba(15, 23, 42, 0.12)',
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.1)',
      },
    }}
  >
    <CardContent sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: 999,
            bgcolor: accent,
            opacity: 0.9,
            flex: '0 0 auto',
          }}
        />
        <Typography
          variant="overline"
          sx={{
            color: 'rgba(15, 23, 42, 0.65)',
            letterSpacing: 0.6,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        variant="h5"
        sx={{
          mt: 0.75,
          fontWeight: 800,
          color: '#0F172A',
          lineHeight: 1.05,
        }}
      >
        {value}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          mt: 0.6,
          color: 'rgba(15, 23, 42, 0.62)',
          display: 'block',
          minHeight: 18,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {sub && String(sub).trim() ? sub : ' '}
      </Typography>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [mode, setMode] = useState('month');
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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        if (!userId)
          throw new Error('Нет user.id (проверь authUser в localStorage).');

        const baseYM = { year, month };
        const tasks = [];
        const rows = [];

        for (let i = 0; i < 12; i++) {
          const ym = addMonthsYM(baseYM, -i);
          tasks.push(
            getMonthlySummary(userId, ym.year, ym.month)
              .then((raw) => {
                const d = unwrap(raw);
                if (
                  d &&
                  (n(d.total_income) ||
                    n(d.total_expenses) ||
                    n(d.balance) ||
                    n(d.savings))
                ) {
                  rows.push({ ...d, year: ym.year, month: ym.month });
                }
              })
              .catch(() => {})
          );
        }

        await Promise.all(tasks);
        if (!cancelled) setHistory(rows);
      } catch (e) {
        if (!cancelled)
          setError(e?.message || 'Ошибка загрузки аналитики');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, year, month]);

  const last12 = useMemo(() => {
    const base = { year, month };
    const arr = [];
    for (let i = 11; i >= 0; i--) arr.push(addMonthsYM(base, -i));
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

  const periodLabel =
    mode === 'year'
      ? `Показаны данные: ${year} год`
      : `Показаны данные: ${monthTitleRu(year, month)}`;

  const yearMonths = useMemo(() => {
    const cur = ymNum(year, month);
    return history.filter(
      (h) => h.year === year && ymNum(h.year, h.month) <= cur
    );
  }, [history, year, month]);

  const ytdIncome = useMemo(
    () => yearMonths.reduce((acc, h) => acc + n(h.total_income), 0),
    [yearMonths]
  );
  const ytdExpenses = useMemo(
    () => yearMonths.reduce((acc, h) => acc + n(h.total_expenses), 0),
    [yearMonths]
  );
  const ytdBalance = useMemo(
    () => ytdIncome - ytdExpenses,
    [ytdIncome, ytdExpenses]
  );
  const ytdSavings = useMemo(
    () => yearMonths.reduce((acc, h) => acc + n(h.savings), 0),
    [yearMonths]
  );
  const ytdRate = useMemo(
    () => (ytdIncome > 0 ? Math.round((ytdBalance / ytdIncome) * 100) : 0),
    [ytdIncome, ytdBalance]
  );

  const currentMonthSummary = useMemo(
    () => history.find((h) => h.year === year && h.month === month) || null,
    [history, year, month]
  );

  const mIncome = n(currentMonthSummary?.total_income);
  const mExpenses = n(currentMonthSummary?.total_expenses);
  const mBalance = n(currentMonthSummary?.balance);
  const mSavings = n(currentMonthSummary?.savings);
  const mRate = n(currentMonthSummary?.savings_rate_percent);

  const kpiIncome = mode === 'year' ? ytdIncome : mIncome;
  const kpiExpenses = mode === 'year' ? ytdExpenses : mExpenses;
  const kpiBalance = mode === 'year' ? ytdBalance : mBalance;
  const kpiRate = mode === 'year' ? ytdRate : mRate;
  const kpiSavings = mode === 'year' ? ytdSavings : mSavings;

  const [topCatsExpenses, setTopCatsExpenses] = useState([]);
  const [topCatsIncome, setTopCatsIncome] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  const monthsForCats = useMemo(() => {
    if (mode !== 'year') return [{ year, month }];
    const arr = [];
    for (let m = 1; m <= month; m++) arr.push({ year, month: m });
    return arr;
  }, [mode, year, month]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) return;

      try {
        setCatsLoading(true);

        const accExp = new Map();
        const accInc = new Map();

        const tasks = monthsForCats.flatMap((ym) => [
          getMyExpensesByMonth(ym.year, ym.month, 0, 500)
            .then((resp) => {
              unwrapList(resp?.data ?? resp).forEach((x) => {
                const cat = String(x.category || 'Другое');
                accExp.set(cat, (accExp.get(cat) || 0) + n(x.amount));
              });
            })
            .catch(() => {}),

          getMyIncomesByMonth(ym.year, ym.month, 0, 500)
            .then((resp) => {
              unwrapList(resp?.data ?? resp).forEach((x) => {
                const cat = String(x.category || 'Другое');
                accInc.set(cat, (accInc.get(cat) || 0) + n(x.amount));
              });
            })
            .catch(() => {}),
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
  const topTitle =
    topTab === 'expenses'
      ? 'Топ категорий расходов'
      : 'Топ категорий доходов';
  const topBarColor = topTab === 'expenses' ? COLORS.expenses : COLORS.income;

  // Общий контейнер — одинаковая ширина на всех страницах
  const PageWrap = ({ children }) => (
    <Box
      sx={{
        width: '100%',
        mx: 'auto',
        px: { xs: 2, md: 3, lg: 4 },
        maxWidth: { xs: '100%', sm: 720, md: 1040, lg: 1240, xl: 1400 },
      }}
    >
      {children}
    </Box>
  );

  return (
    <>
      <PageWrap>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ mb: 2 }}
          alignItems={{ sm: 'center' }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 900, lineHeight: 1.15, color: '#0F172A' }}
            >
              Аналитика
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(15, 23, 42, 0.75)', mt: 0.5, fontWeight: 500 }}
            >
              {periodLabel}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Chip
              label={loading ? 'Загрузка…' : error ? 'Частично' : 'Актуально'}
              variant="filled"
              sx={{
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 999,
                bgcolor: error ? alpha('#F97316', 0.1) : alpha('#6366F1', 0.1),
                color: error ? '#F97316' : '#6366F1',
                fontWeight: 700,
              }}
            />

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_e, next) => next && setMode(next)}
              size="small"
              sx={{
                width: { xs: '100%', sm: 'auto' },
                bgcolor: alpha('#FFFFFF', 0.7),
                border: '1px solid rgba(15, 23, 42, 0.1)',
                borderRadius: 999,
                '& .MuiToggleButton-root': {
                  border: 0,
                  px: 1.5,
                  flex: { xs: 1, sm: 'unset' },
                },
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

        {/* KPI: мобилка 2×2, десктоп 4×1 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
            mb: 2,
          }}
        >
          <StatCard
            label="Баланс"
            value={fmtRub.format(kpiBalance)}
            sub=" "
            accent={COLORS.balance}
          />
          <StatCard
            label="Доходы"
            value={fmtRub.format(kpiIncome)}
            sub=" "
            accent={COLORS.income}
          />
          <StatCard
            label="Расходы"
            value={fmtRub.format(kpiExpenses)}
            sub=" "
            accent={COLORS.expenses}
          />
          <StatCard
            label="Норма сбережений"
            value={`${kpiRate}%`}
            sub={`Сбережения: ${fmtRub.format(kpiSavings)}`}
            accent="#A78BFA"
          />
        </Box>

        {/* Cashflow */}
        <Card
          variant="outlined"
          sx={{
            mb: 2,
            borderRadius: 3,
            borderColor: 'rgba(15, 23, 42, 0.08)',
            backgroundColor: alpha('#FFFFFF', 0.96),
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
            <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A' }}>
              Cashflow за 12 месяцев
            </Typography>
            <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.1)' }} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' },
                gap: 2,
              }}
            >
              <Box sx={{ width: '100%', height: { xs: 280, md: 320 } }}>
                <BarChart
                  height={320}
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
              </Box>

              <Box sx={{ width: '100%', height: { xs: 280, md: 320 } }}>
                <LineChart
                  height={320}
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
                      curve: 'natural',
                    },
                  ]}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Топ категорий */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: 'rgba(15, 23, 42, 0.08)',
            backgroundColor: alpha('#FFFFFF', 0.96),
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
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
                label={
                  catsLoading
                    ? 'Считаю…'
                    : mode === 'year'
                    ? `${year} год`
                    : monthTitleRu(year, month)
                }
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
                '& .MuiTab-root': {
                  minHeight: 40,
                  color: 'rgba(15,23,42,0.65)',
                },
              }}
            >
              <Tab label="Расходы" value="expenses" />
              <Tab label="Доходы" value="income" />
            </Tabs>

            <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.1)' }} />

            {catsLoading ? (
              <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.65)' }}>
                Загрузка данных по категориям…
              </Typography>
            ) : activeTopRows.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(148, 163, 184, 1)' }}>
                Нет данных по категориям за выбранный период.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: { xs: 260, md: 280 }, minWidth: 0 }}>
                <BarChart
                  height={280}
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
              </Box>
            )}
          </CardContent>
        </Card>
      </PageWrap>
    </>
  );
}
