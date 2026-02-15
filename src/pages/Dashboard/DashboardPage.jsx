import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';

import { useAuth } from '../../contexts/AuthContext';
import { getMonthlySummary } from '../../api/summaryApi';

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const unwrap = (raw) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === 'object') return raw.data;
  return raw;
};

const ymNum = (y, m) => y * 12 + (m - 1);
const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

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
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
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
        {/* Без сокращений: на xs разрешаем 2 строки */}
        <Typography
          variant="overline"
          sx={{
            color: 'rgba(15, 23, 42, 0.65)',
            letterSpacing: 0.6,
            lineHeight: 1.15,
            minWidth: 0,
            whiteSpace: 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: { xs: 2, sm: 1 },
            fontSize: { xs: 10.5, sm: 11.5 },
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
          lineHeight: 1.2,
          minHeight: { xs: 32, md: 18 },
          whiteSpace: { xs: 'normal', md: 'nowrap' },
          overflow: 'hidden',
          textOverflow: { xs: 'clip', md: 'ellipsis' },
        }}
      >
        {sub && String(sub).trim() ? sub : ' '}
      </Typography>
    </CardContent>
  </Card>
);

/* “Табличные” строки для итогов месяца */
function SummaryRow({ label, value, color }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 1.25,
        py: 1.1,
        minWidth: 0,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: 999,
            bgcolor: color,
            flex: '0 0 auto',
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(15, 23, 42, 0.7)',
            fontWeight: 800,
            minWidth: 0,
            whiteSpace: 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        sx={{
          fontWeight: 950,
          color: '#0F172A',
          whiteSpace: 'nowrap',
          letterSpacing: -0.2,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fmtRub = useMemo(
    () =>
      new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }),
    []
  );

  const fmtToday = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    []
  );
  const todayLabel = useMemo(() => fmtToday.format(new Date()), [fmtToday]);

  const fmtMonth = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  const monthTitle = (y, m) => fmtMonth.format(new Date(y, m - 1, 1));

  const kpiModeKey = useMemo(
    () => `fintracker:kpiMode:${userId || 'anon'}`,
    [userId]
  );
  const [kpiMode, setKpiMode] = useState('month');

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(kpiModeKey);
      if (v === 'month' || v === 'year') setKpiMode(v);
      else setKpiMode('month');
    } catch {
      setKpiMode('month');
    }
  }, [kpiModeKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(kpiModeKey, kpiMode);
    } catch {}
  }, [kpiModeKey, kpiMode]);

  const onKpiModeChange = (_e, next) => {
    if (!next) return;
    setKpiMode(next);
  };

  const historyDesc = useMemo(
    () => [...history].sort((a, b) => b.year - a.year || b.month - a.month),
    [history]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        if (!userId)
          throw new Error('Нет user.id (проверь authUser в localStorage).');

        const rawCur = await getMonthlySummary(userId, year, month);
        const cur = unwrap(rawCur);
        if (!cancelled) setSummary(cur);

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
          setError(e?.message || 'Ошибка загрузки сводки/истории');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, year, month]);

  const incomeMonth = n(summary?.total_income);
  const expenseMonth = n(summary?.total_expenses);
  const balanceMonth = n(summary?.balance);
  const savingsMonth = n(summary?.savings);
  const savingsRateMonth = n(summary?.savings_rate_percent);

  const yearMonths = useMemo(() => {
    const curNum = ymNum(year, month);
    return history.filter(
      (h) => h.year === year && ymNum(h.year, h.month) <= curNum
    );
  }, [history, year, month]);

  const yearIncome = useMemo(
    () => yearMonths.reduce((acc, h) => acc + n(h.total_income), 0),
    [yearMonths]
  );
  const yearExpenses = useMemo(
    () => yearMonths.reduce((acc, h) => acc + n(h.total_expenses), 0),
    [yearMonths]
  );
  const yearBalance = useMemo(
    () => yearIncome - yearExpenses,
    [yearIncome, yearExpenses]
  );
  const yearSavings = useMemo(
    () => yearMonths.reduce((acc, h) => acc + n(h.savings), 0),
    [yearMonths]
  );

  const yearSavingsRate = useMemo(() => {
    if (yearIncome <= 0) return 0;
    const r = Math.round((yearBalance / yearIncome) * 100);
    return Number.isFinite(r) ? r : 0;
  }, [yearIncome, yearBalance]);

  const isYear = kpiMode === 'year';
  const periodLabel = isYear
    ? `Показаны данные: ${year} год`
    : `Показаны данные: ${monthTitle(year, month)}`;

  const displayIncome = isYear ? yearIncome : incomeMonth;
  const displayExpenses = isYear ? yearExpenses : expenseMonth;
  const displayBalance = isYear ? yearBalance : balanceMonth;
  const displayRate = isYear ? yearSavingsRate : savingsRateMonth;
  const displaySavings = isYear ? yearSavings : savingsMonth;

  const displayName = user?.userName || user?.email || 'пользователь';

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
            Привет, {displayName}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: 'rgba(15, 23, 42, 0.65)', mt: 0.5 }}
          >
            Сегодня: {todayLabel}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(15, 23, 42, 0.75)',
              mt: 0.5,
              fontWeight: 500,
            }}
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
            label={loading ? 'Загрузка…' : 'Актуально'}
            variant="filled"
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 999,
              bgcolor: alpha('#6366F1', 0.1),
              color: '#6366F1',
              fontWeight: 700,
            }}
          />

          <ToggleButtonGroup
            value={kpiMode}
            exclusive
            onChange={onKpiModeChange}
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
        <StatCard label="Баланс" value={fmtRub.format(displayBalance)} sub=" " accent="#6366F1" />
        <StatCard label="Доходы" value={fmtRub.format(displayIncome)} sub={`Расходы: ${fmtRub.format(displayExpenses)}`} accent="#22C55E" />
        <StatCard label="Расходы" value={fmtRub.format(displayExpenses)} sub=" " accent="#F97316" />
        <StatCard label="Норма сбережений" value={`${displayRate}%`} sub={`Сбережения: ${fmtRub.format(displaySavings)}`} accent="#A78BFA" />
      </Box>

      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: 'rgba(15, 23, 42, 0.08)',
          backgroundColor: alpha('#FFFFFF', 0.96),
          backdropFilter: 'blur(10px)',
          width: '100%',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A' }}>
              Итоги операций за месяц
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: 'rgba(15, 23, 42, 0.55)',
                fontWeight: 700,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {monthTitle(year, month)}
            </Typography>
          </Stack>

          <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.1)' }} />

          {/* “Табличный” вид вместо карточек */}
          <Box
            sx={{
              border: '1px solid rgba(15, 23, 42, 0.08)',
              borderRadius: 2.5,
              bgcolor: alpha('#FFFFFF', 0.9),
              overflow: 'hidden',
            }}
          >
            <Box sx={{ px: { xs: 1.25, sm: 1.5 } }}>
              <SummaryRow label="Доходы" value={fmtRub.format(incomeMonth)} color="#22C55E" />
            </Box>
            <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.08)' }} />
            <Box sx={{ px: { xs: 1.25, sm: 1.5 } }}>
              <SummaryRow label="Расходы" value={fmtRub.format(expenseMonth)} color="#F97316" />
            </Box>
            <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.08)' }} />
            <Box sx={{ px: { xs: 1.25, sm: 1.5 } }}>
              <SummaryRow label="Сбережения" value={fmtRub.format(savingsMonth)} color="#A78BFA" />
            </Box>
            <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.08)' }} />
            <Box sx={{ px: { xs: 1.25, sm: 1.5 } }}>
              <SummaryRow label="Норма сбережений" value={`${savingsRateMonth}%`} color="#A78BFA" />
            </Box>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.1)' }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 0.25, sm: 1.25 }}
            sx={{ color: 'rgba(15, 23, 42, 0.6)' }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              История сохранена: {history.length} месяцев
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Обновлено: {todayLabel}
            </Typography>
          </Stack>

          <Box sx={{ mt: 1.25 }}>
            {historyDesc.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.65)' }}>
                Пока нет сохранённых месяцев.
              </Typography>
            ) : (
              historyDesc.map((h) => (
                <Accordion
                  key={`${h.year}-${h.month}`}
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    bgcolor: 'transparent',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: '#0F172A',
                        textTransform: 'capitalize',
                      }}
                    >
                      {monthTitle(h.year, h.month)}
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0 }}>
                    <Stack spacing={0.75}>
                      <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                        Доходы:{' '}
                        <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {fmtRub.format(n(h.total_income))}
                        </Box>
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                        Расходы:{' '}
                        <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {fmtRub.format(n(h.total_expenses))}
                        </Box>
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                        Баланс:{' '}
                        <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {fmtRub.format(n(h.balance))}
                        </Box>
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                        Сбережения:{' '}
                        <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {fmtRub.format(n(h.savings))}
                        </Box>
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                        Норма сбережений:{' '}
                        <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {n(h.savings_rate_percent)}%
                        </Box>
                      </Typography>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </PageWrap>
  );
}