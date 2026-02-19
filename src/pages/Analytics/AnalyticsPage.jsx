// src/pages/Analytics/AnalyticsPage.jsx
import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Typography, Box, Stack, Chip, Tabs, Tab } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { ChartsTooltipContainer, ChartsItemTooltipContent } from '@mui/x-charts/ChartsTooltip';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowCircleUpOutlinedIcon from '@mui/icons-material/ArrowCircleUpOutlined';
import ArrowCircleDownOutlinedIcon from '@mui/icons-material/ArrowCircleDownOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

import { useAuth } from '../../contexts/AuthContext';
import { getMonthlySummary } from '../../api/summaryApi';
import { getMyExpensesByMonth } from '../../api/expensesApi';
import { getMyIncomesByMonth } from '../../api/incomeApi';

import { bankingColors as colors, surfaceOutlinedSx } from '../../styles/bankingTokens';
import { useCurrency } from '../../contexts/CurrencyContext';

const COLORS = {
  income: colors.primary,
  expenses: colors.warning,
  balance: '#6366F1',
  rate: '#A78BFA',
};

const WHITE = '#FFFFFF';

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

// Короткий формат оси для мобилки, чтобы не съедало левый край
const fmtAxisShort = (v) => {
  const val = n(v);
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `${Math.round(val / 1_000_000)}м`;
  if (abs >= 1_000) return `${Math.round(val / 1_000)}к`;
  return `${Math.round(val)}`;
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

const fmtMonthLong = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
const fmtMonthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short' });

const monthTitleRu = (y, m) => fmtMonthLong.format(new Date(y, m - 1, 1));
const monthShortRu = (y, m) => fmtMonthShort.format(new Date(y, m - 1, 1));

const roundUpToStep = (value, step) => Math.ceil(value / step) * step;

const niceStep = (maxVal) => {
  if (maxVal <= 50_000) return 10_000;
  if (maxVal <= 200_000) return 25_000;
  if (maxVal <= 500_000) return 50_000;
  return 100_000;
};

/** +25% запаса вверх для шкалы */
const withHeadroom = (maxVal) => {
  const raw = maxVal + maxVal * 0.25;
  const step = niceStep(raw);
  return roundUpToStep(raw, step);
};

const KpiCard = memo(function KpiCard({ label, value, sub, icon, accent, onClick }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <Box
      component="div"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      sx={{
        ...surfaceOutlinedSx,
        height: '100%',
        minHeight: { xs: 96, sm: 104, md: 116 },
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
        borderColor: alpha(accent, 0.34),
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 1.5, md: 2 },
        '&:before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(accent, 0.20)} 0%, transparent 62%)`,
          pointerEvents: 'none',
        },
        '@media (hover: hover) and (pointer: fine)': onClick
          ? {
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 22px 70px rgba(0,0,0,0.58)',
                borderColor: alpha(accent, 0.58),
              },
            }
          : {},
      }}
    >
      <Stack direction="row" spacing={1.1} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            width: { xs: 30, md: 34 },
            height: { xs: 30, md: 34 },
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(accent, 0.14),
            border: `1px solid ${alpha(accent, 0.28)}`,
            flex: '0 0 auto',
          }}
        >
          {icon
            ? React.cloneElement(icon, {
                sx: { fontSize: { xs: 17, md: 18 }, color: alpha(accent, 0.98) },
              })
            : null}
        </Box>

        <Typography
          variant="overline"
          sx={{
            color: colors.muted,
            fontWeight: 950,
            letterSpacing: 0.55,
            lineHeight: 1.1,
            minWidth: 0,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: { xs: 2, sm: 1 },
            overflow: 'hidden',
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        variant="h5"
        sx={{
          mt: { xs: 0.7, md: 0.9 },
          fontWeight: 950,
          color: colors.text,
          lineHeight: 1.05,
          letterSpacing: -0.25,
          fontSize: { xs: '1.15rem', sm: '1.22rem', md: '1.35rem' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {value}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          color: colors.muted,
          display: { xs: 'none', md: 'block' },
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {sub && String(sub).trim() ? sub : '\u00A0'}
      </Typography>
    </Box>
  );
});

function BalanceAreaGradient({ id = 'balanceGradient', color = COLORS.balance }) {
  const { top, height } = useDrawingArea();
  const y1 = top;
  const y2 = top + height;

  return (
    <defs>
      <linearGradient id={id} x1="0" x2="0" y1={y1} y2={y2} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={alpha(color, 0.34)} />
        <stop offset="55%" stopColor={alpha(color, 0.12)} />
        <stop offset="100%" stopColor={alpha(color, 0.02)} />
      </linearGradient>
    </defs>
  );
}

function BalancePinnedTooltip(props) {
  return (
    <ChartsTooltipContainer
      {...props}
      trigger="item"
      anchor="node"
      position="top"
      placement="top"
      disablePortal
      slotProps={{
        popper: {
          placement: 'top',
          modifiers: [
            { name: 'offset', options: { offset: [0, 8] } },
            { name: 'preventOverflow', options: { padding: 8 } },
            { name: 'flip', options: { fallbackPlacements: ['top', 'bottom'] } },
          ],
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          width: 2,
          height: 14,
          transform: 'translateX(-50%)',
          bgcolor: alpha(COLORS.balance, 0.55),
          borderRadius: 999,
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          bgcolor: alpha('#0B1220', 0.94),
          color: '#fff',
          borderRadius: 2,
          px: 1.25,
          py: 0.85,
          boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
          border: 0,
          pointerEvents: 'none',
          maxWidth: 240,
        }}
      >
        <ChartsItemTooltipContent />
      </Box>
    </ChartsTooltipContainer>
  );
}

const CashflowLegend = memo(function CashflowLegend() {
  return (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mt: 0.25, mb: 1.0 }}>
      <Stack direction="row" spacing={0.9} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: COLORS.income }} />
        <Typography sx={{ color: WHITE, fontWeight: 900, fontSize: 12 }}>Доходы</Typography>
      </Stack>
      <Stack direction="row" spacing={0.9} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: COLORS.expenses }} />
        <Typography sx={{ color: WHITE, fontWeight: 900, fontSize: 12 }}>Расходы</Typography>
      </Stack>
    </Stack>
  );
});

export default function AnalyticsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { formatAmount } = useCurrency();

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

  // Полные числа — для десктопа
  const fmtAxis = useMemo(
    () => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }),
    []
  );

  // Мобилка: к/м, десктоп: полные числа
  const axisMoneyFormatter = useCallback(
    (v) => (isMobile ? fmtAxisShort(v) : fmtAxis.format(Number(v || 0))),
    [isMobile, fmtAxis]
  );

  const cashflowMargin = useMemo(
    () => (isMobile ? { left: 34, right: 10, top: 18, bottom: 50 } : { left: 70, right: 16, top: 18, bottom: 50 }),
    [isMobile]
  );

  const balanceMargin = useMemo(
    () => (isMobile ? { left: 34, right: 10, top: 14, bottom: 28 } : { left: 70, right: 16, top: 14, bottom: 28 }),
    [isMobile]
  );

  const topCatsYAxisWidth = isMobile ? 72 : 110;
  const topCatsMargin = useMemo(
    () => (isMobile ? { left: 4, right: 10, top: 10, bottom: 28 } : { left: 10, right: 12, top: 10, bottom: 28 }),
    [isMobile]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        if (!userId) throw new Error('Нет user.id (проверь authUser в localStorage).');

        const baseYM = { year, month };
        const tasks = [];
        const rows = [];

        for (let i = 0; i < 12; i++) {
          const ym = addMonthsYM(baseYM, -i);
          tasks.push(
            getMonthlySummary(userId, ym.year, ym.month)
              .then((raw) => {
                const d = unwrap(raw);
                if (d && (n(d.total_income) || n(d.total_expenses) || n(d.balance) || n(d.savings))) {
                  rows.push({ ...d, year: ym.year, month: ym.month });
                }
              })
              .catch(() => {})
          );
        }

        await Promise.all(tasks);
        if (!cancelled) setHistory(rows);
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
    mode === 'year' ? `Показаны данные: ${year} год` : `Показаны данные: ${monthTitleRu(year, month)}`;

  const yearMonths = useMemo(() => {
    const cur = ymNum(year, month);
    return history.filter((h) => h.year === year && ymNum(h.year, h.month) <= cur);
  }, [history, year, month]);

  const ytdIncome = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_income), 0), [yearMonths]);
  const ytdExpenses = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_expenses), 0), [yearMonths]);
  const ytdBalance = useMemo(() => ytdIncome - ytdExpenses, [ytdIncome, ytdExpenses]);
  const ytdSavings = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.savings), 0), [yearMonths]);
  const ytdRate = useMemo(() => (ytdIncome > 0 ? Math.round((ytdBalance / ytdIncome) * 100) : 0), [ytdIncome, ytdBalance]);

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
    <PageWrap>
      {/* Header */}
      <Box
        sx={{
          mb: { xs: 3, md: 3 },
          position: 'relative',
          px: 0,
          pt: { xs: 1, md: 1.5 },
          pb: { xs: 1.5, md: 2 },
          borderRadius: 0,
          border: 0,
          boxShadow: 'none',
          backgroundColor: 'transparent',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'none' }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.25, sm: 1 }}
          alignItems={{ sm: 'center' }}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: { xs: 38, md: 44 },
                height: { xs: 38, md: 44 },
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(COLORS.balance, 0.14),
                border: 0,
                boxShadow: 'none',
                flex: '0 0 auto',
              }}
            >
              <CalendarMonthOutlinedIcon sx={{ fontSize: { xs: 20, md: 22 }, color: alpha('#FFFFFF', 0.92) }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 980,
                  color: colors.text,
                  letterSpacing: -0.35,
                  lineHeight: 1.05,
                  fontSize: { xs: '1.35rem', sm: '1.55rem', md: '1.8rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Аналитика
              </Typography>

              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.55, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.muted,
                    fontWeight: 700,
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {periodLabel}
                </Typography>

                <Box sx={{ width: 6, height: 6, borderRadius: 999, bgcolor: alpha('#FFFFFF', 0.18), flex: '0 0 auto' }} />

                <Typography
                  variant="caption"
                  sx={{
                    color: alpha('#FFFFFF', 0.62),
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cashflow • Категории • KPI
                </Typography>
              </Stack>
            </Box>
          </Stack>

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
                borderRadius: 999,
                border: 0,
                bgcolor: error ? alpha(COLORS.expenses, 0.14) : alpha(colors.primary, 0.14),
                color: error ? COLORS.expenses : colors.primary,
                fontWeight: 900,
                width: { xs: '100%', sm: 'auto' },
              }}
            />

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_e, next) => next && setMode(next)}
              size="small"
              sx={{
                width: { xs: '100%', sm: 'auto' },
                bgcolor: alpha(colors.card2, 0.70),
                border: 0,
                borderRadius: 999,
                p: 0.25,
                boxShadow: '0 14px 42px rgba(0,0,0,0.35)',
                '& .MuiToggleButtonGroup-grouped': { border: '0 !important' },
                '& .MuiToggleButton-root': {
                  border: 0,
                  px: 1.6,
                  flex: { xs: 1, sm: 'unset' },
                  color: alpha(colors.text, 0.78),
                  fontWeight: 950,
                  textTransform: 'none',
                  borderRadius: 999,
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  color: '#05140C',
                  backgroundColor: colors.primary,
                  boxShadow: `0 14px 40px ${alpha(colors.primary, 0.22)}`,
                },
              }}
            >
              <ToggleButton value="month">Месяц</ToggleButton>
              <ToggleButton value="year">Год</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Box>

      {/* KPI */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          gap: { xs: 1.5, sm: 1.75, md: 2 },
          mb: { xs: 5, md: 3 },
        }}
      >
        <KpiCard
          label="Баланс"
          value={formatAmount(kpiBalance)}
          sub=" "
          accent={COLORS.balance}
          icon={<AccountBalanceWalletOutlinedIcon />}
        />
        <KpiCard
          label="Доходы"
          value={formatAmount(kpiIncome)}
          sub=" "
          accent={COLORS.income}
          icon={<ArrowCircleUpOutlinedIcon />}
        />
        <KpiCard
          label="Расходы"
          value={formatAmount(kpiExpenses)}
          sub=" "
          accent={COLORS.expenses}
          icon={<ArrowCircleDownOutlinedIcon />}
        />
        <KpiCard
          label="Норма сбережений"
          value={`${kpiRate}%`}
          sub={`Сбережения: ${formatAmount(kpiSavings)}`}
          accent={COLORS.rate}
          icon={<PercentOutlinedIcon />}
        />
      </Box>

      {/* Cashflow */}
      <Box sx={{ mb: { xs: 5, md: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 950, color: colors.text, letterSpacing: -0.2, mb: 0.75 }}>
          Cashflow за 12 месяцев
        </Typography>

        <CashflowLegend />

        <Box sx={{ width: '100%', height: { xs: 280, md: 340 } }}>
          <BarChart
            height={340}
            hideLegend
            xAxis={[
              {
                data: cashflowRows.map((r) => r.label),
                scaleType: 'band',
                tickSpacing: 14,
                tickLabelStyle: { fontSize: 11, fill: WHITE, fontWeight: 800 },
                categoryGapRatio: 0.28,
                barGapRatio: 0.12,
              },
            ]}
            yAxis={[
              {
                min: 0,
                tickNumber: 6,
                valueFormatter: (v) => axisMoneyFormatter(v),
                tickLabelStyle: { fontSize: 11, fill: WHITE, fontWeight: 800 },
                domainLimit: (_minVal, maxVal) => {
                  const max = withHeadroom(Number(maxVal || 0));
                  return { min: 0, max };
                },
              },
            ]}
            series={[
              { data: cashflowRows.map((r) => r.income), label: 'Доходы', color: COLORS.income },
              { data: cashflowRows.map((r) => r.expenses), label: 'Расходы', color: COLORS.expenses },
            ]}
            grid={{ horizontal: true }}
            margin={cashflowMargin}
            sx={{
              '& .MuiChartsAxis-line': { stroke: 'rgba(255,255,255,0.16)' },
              '& .MuiChartsAxis-tick': { stroke: 'rgba(255,255,255,0.12)' },
              '& .MuiChartsAxis-tickLabel': { fill: WHITE, fontSize: 11 },
              '& .MuiChartsGrid-line': { stroke: 'rgba(255,255,255,0.06)' },
            }}
          />
        </Box>

        <Box sx={{ mt: { xs: 6, md: 4.5 } }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: { xs: 2, md: 1.5 } }}>
            <Box sx={{ width: 6, height: 6, borderRadius: 999, bgcolor: COLORS.balance }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 900,
                color: WHITE,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                fontSize: 11,
              }}
            >
              Баланс
            </Typography>
            <Box sx={{ width: 6, height: 6, borderRadius: 999, bgcolor: COLORS.balance }} />
          </Stack>

          <Box sx={{ width: '100%', height: { xs: 260, md: 320 } }}>
            <LineChart
              height={320}
              xAxis={[
                {
                  data: cashflowRows.map((r) => r.label),
                  scaleType: 'point',
                  tickSpacing: 18,
                  tickLabelStyle: { fontSize: 11, fill: WHITE, fontWeight: 800 },
                },
              ]}
              yAxis={[
                {
                  min: 0,
                  tickNumber: 7,
                  domainLimit: (_minVal, maxVal) => {
                    const max = withHeadroom(Number(maxVal || 0));
                    return { min: 0, max };
                  },
                  valueFormatter: (v) => axisMoneyFormatter(v),
                  tickLabelStyle: { fontSize: 11, fill: WHITE, fontWeight: 800 },
                },
              ]}
              series={[
                {
                  data: cashflowRows.map((r) => r.balance),
                  label: 'Баланс',
                  color: COLORS.balance,
                  curve: 'linear',
                  area: true,
                  showMark: true,
                },
              ]}
              slots={{ tooltip: BalancePinnedTooltip }}
              grid={{ horizontal: true }}
              margin={balanceMargin}
              sx={{
                '& .MuiChartsAxis-line': { stroke: 'rgba(255,255,255,0.16)' },
                '& .MuiChartsAxis-tick': { stroke: 'rgba(255,255,255,0.12)' },
                '& .MuiChartsAxis-tickLabel': { fill: WHITE, fontSize: 11 },
                '& .MuiChartsGrid-line': { stroke: 'rgba(255,255,255,0.06)' },
                '& .MuiLineElement-root': { strokeWidth: 3 },
                '& .MuiMarkElement-root': {
                  r: 4,
                  strokeWidth: 2,
                  stroke: COLORS.balance,
                  fill: '#0B1220',
                },
                '& .MuiAreaElement-root': { fill: "url('#balanceGradient')" },
                '.MuiChartsLegend-root': { display: 'none' },
              }}
            >
              <BalanceAreaGradient id="balanceGradient" color={COLORS.balance} />
            </LineChart>
          </Box>
        </Box>
      </Box>

      {/* Топ категорий */}
      <Box sx={{ mt: { xs: 6, md: 3.5 }, mb: { xs: 2.5, md: 0 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mb: 1.75 }}>
          <Typography variant="h6" sx={{ fontWeight: 950, color: colors.text, flexGrow: 1, letterSpacing: -0.2 }}>
            {topTab === 'expenses' ? 'Топ категорий расходов' : 'Топ категорий доходов'}
          </Typography>

          <Chip
            label={catsLoading ? 'Считаю…' : mode === 'year' ? `${year} год` : monthTitleRu(year, month)}
            variant="filled"
            sx={{
              borderRadius: 999,
              border: 0,
              color: topTab === 'expenses' ? COLORS.expenses : COLORS.income,
              bgcolor: alpha(topTab === 'expenses' ? COLORS.expenses : COLORS.income, 0.12),
              fontWeight: 900,
            }}
          />
        </Stack>

        <Tabs
          value={topTab}
          onChange={(_e, v) => setTopTab(v)}
          variant="scrollable"
          allowScrollButtonsMobile
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            mb: { xs: 2, md: 1.5 },
            '& .MuiTab-root': {
              minHeight: 40,
              color: alpha(colors.text, 0.70),
              textTransform: 'none',
              fontWeight: 900,
            },
            '& .MuiTab-root.Mui-selected': { color: colors.text },
            '& .MuiTabs-indicator': { backgroundColor: COLORS.balance, height: 3, borderRadius: 999 },
          }}
        >
          <Tab label="Расходы" value="expenses" />
          <Tab label="Доходы" value="income" />
        </Tabs>

        {catsLoading ? (
          <Typography variant="body2" sx={{ color: colors.muted }}>
            Загрузка данных по категориям…
          </Typography>
        ) : (topTab === 'expenses' ? topCatsExpenses : topCatsIncome).length === 0 ? (
          <Typography variant="body2" sx={{ color: colors.muted }}>
            Нет данных по категориям за выбранный период.
          </Typography>
        ) : (
          <Box sx={{ width: '100%', height: { xs: 280, md: 280 }, minWidth: 0 }}>
            <BarChart
              height={280}
              layout="horizontal"
              yAxis={[
                {
                  data: (topTab === 'expenses' ? topCatsExpenses : topCatsIncome).map((x) => x.category),
                  scaleType: 'band',
                  width: topCatsYAxisWidth,
                  tickLabelStyle: { fontSize: isMobile ? 10 : 11, fill: WHITE, fontWeight: 800 },
                },
              ]}
              xAxis={[
                {
                  valueFormatter: (v) => axisMoneyFormatter(v),
                  tickLabelStyle: { fontSize: 11, fill: WHITE, fontWeight: 800 },
                },
              ]}
              series={[
                {
                  data: (topTab === 'expenses' ? topCatsExpenses : topCatsIncome).map((x) => x.amount),
                  label: 'Сумма',
                  color: topTab === 'expenses' ? COLORS.expenses : COLORS.income,
                },
              ]}
              grid={{ vertical: true }}
              margin={topCatsMargin}
              sx={{
                '& .MuiChartsAxis-line': { stroke: 'rgba(255,255,255,0.16)' },
                '& .MuiChartsAxis-tick': { stroke: 'rgba(255,255,255,0.12)' },
                '& .MuiChartsAxis-tickLabel': { fill: WHITE, fontSize: 11 },
                '& .MuiChartsGrid-line': { stroke: 'rgba(255,255,255,0.06)' },
                '.MuiChartsLegend-root': { display: 'none' },
              }}
            />
          </Box>
        )}
      </Box>
    </PageWrap>
  );
}
