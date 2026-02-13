import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Box,
  Grid,
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

import {
  loadMonthHistory,
  syncMonthHistory,
  MONTH_HISTORY_EVENT_NAME,
} from '../../utils/monthHistoryStorage';

/* ────────── helpers (вне компонента) ────────── */
const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const fmtMonthFormatter = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
});

const monthTitle = (y, m) => {
  const d = new Date(y, m - 1, 1);
  return fmtMonthFormatter.format(d);
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
      transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
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
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.10)',
      },
    }}
  >
    <CardContent sx={{ p: 2.25 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: accent, opacity: 0.9 }} />
        <Typography variant="overline" sx={{ color: 'rgba(15, 23, 42, 0.65)', letterSpacing: 0.6 }}>
          {label}
        </Typography>
      </Stack>

      <Typography variant="h5" sx={{ mt: 0.75, fontWeight: 700, color: '#0F172A' }}>
        {value}
      </Typography>

      {sub ? (
        <Typography variant="body2" sx={{ mt: 0.75, color: 'rgba(15, 23, 42, 0.65)' }}>
          {sub}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);

/* ════════════════════════════════════════════
   DashboardPage
   ════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [year] = useState(() => new Date().getFullYear());
  const [month] = useState(() => new Date().getMonth() + 1);

  const fmtRub = useMemo(
    () =>
      new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }),
    [],
  );

  const fmtToday = useMemo(
    () => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [],
  );
  const todayLabel = useMemo(() => fmtToday.format(new Date()), [fmtToday]);

  /* ── KPI режим ── */
  const kpiModeKey = useMemo(() => `fintracker:kpiMode:${userId || 'anon'}`, [userId]);
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
    } catch {
      /* ignore */
    }
  }, [kpiModeKey, kpiMode]);

  const onKpiModeChange = (_event, nextMode) => {
    if (!nextMode) return;
    setKpiMode(nextMode);
  };

  const historyDesc = useMemo(
    () => [...history].sort((a, b) => (b.year - a.year) || (b.month - a.month)),
    [history],
  );

  /* ── Загрузка summary + истории ── */
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

        let cur = null;
        try {
          cur = await getMonthlySummary(userId, year, month);
        } catch (apiErr) {
          console.warn('[Dashboard] getMonthlySummary failed:', apiErr);
          if (!cancelled) {
            setError(
              `Не удалось загрузить сводку за ${monthTitle(year, month)}: ${apiErr?.message || 'неизвестная ошибка'}. Показаны кэшированные данные.`,
            );
          }
        }

        if (!cancelled && cur) setSummary(cur);

        try {
          const nextHistory = await syncMonthHistory({
            userId,
            getMonthlySummary,
            targetYM: { year, month },
            prefillMonths: 12,
          });
          if (!cancelled) setHistory(nextHistory);
        } catch (syncErr) {
          console.warn('[Dashboard] syncMonthHistory failed:', syncErr);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Ошибка загрузки сводки/истории');
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

      if (detail.year === year && detail.month === month) {
        getMonthlySummary(userId, year, month)
          .then((data) => {
            if (data) setSummary(data);
          })
          .catch(() => {});
      }
    };

    window.addEventListener(MONTH_HISTORY_EVENT_NAME, handler);
    return () => window.removeEventListener(MONTH_HISTORY_EVENT_NAME, handler);
  }, [userId, year, month]);

  /* ── Месяц ── */
  const incomeMonth = n(summary?.total_income);
  const expenseMonth = n(summary?.total_expenses);
  const balanceMonth = n(summary?.balance);
  const savingsMonth = n(summary?.savings);
  const savingsRateMonth = n(summary?.savings_rate_percent);

  /* ── Год (YTD) ── */
  const ymNum = (y, m) => y * 12 + (m - 1);

  const yearMonths = useMemo(() => {
    const curNum = ymNum(year, month);
    return history.filter((h) => h?.year === year && ymNum(h.year, h.month) <= curNum);
  }, [history, year, month]);

  const yearIncome = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_income), 0), [yearMonths]);
  const yearExpenses = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_expenses), 0), [yearMonths]);
  const yearBalance = useMemo(() => yearIncome - yearExpenses, [yearIncome, yearExpenses]);

  const yearSavingsRate = useMemo(() => {
    if (yearIncome <= 0) return 0;
    const r = Math.round((yearBalance / yearIncome) * 100);
    return Number.isFinite(r) ? r : 0;
  }, [yearIncome, yearBalance]);

  /* ── KPI ── */
  const isYear = kpiMode === 'year';
  const periodLabel = isYear
    ? `Показаны данные: ${year} год`
    : `Показаны данные: ${monthTitle(year, month)}`;

  const displayIncome = isYear ? yearIncome : incomeMonth;
  const displayExpenses = isYear ? yearExpenses : expenseMonth;
  const displayBalance = isYear ? yearBalance : balanceMonth;
  const displayRate = isYear ? yearSavingsRate : savingsRateMonth;
  const displaySavings = isYear ? yearBalance : savingsMonth;

  const displayName = user?.userName || user?.email || 'пользователь';

  if (!userId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'rgba(15, 23, 42, 0.65)' }}>
          Загрузка профиля…
        </Typography>
      </Box>
    );
  }

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
            Привет, {displayName}
          </Typography>

          <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.65)', mt: 0.5 }}>
            Сегодня: {todayLabel}
          </Typography>

          <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)', mt: 0.5, fontWeight: 500 }}>
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
            label={loading ? 'Загрузка…' : error ? 'Ошибка' : 'Актуально'}
            variant="filled"
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 999,
              bgcolor: error ? alpha('#EF4444', 0.10) : alpha('#6366F1', 0.10),
              color: error ? '#EF4444' : '#6366F1',
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
              bgcolor: alpha('#FFFFFF', 0.70),
              border: '1px solid rgba(15, 23, 42, 0.10)',
              borderRadius: 999,
              '& .MuiToggleButton-root': { border: 0, px: 1.5, flex: { xs: 1, sm: 'unset' } },
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
          <StatCard label="Баланс" value={fmtRub.format(displayBalance)} accent="#6366F1" />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard label="Доходы" value={fmtRub.format(displayIncome)} accent="#22C55E" />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard label="Расходы" value={fmtRub.format(displayExpenses)} accent="#F97316" />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard
            label="Норма сбережений"
            value={`${displayRate}%`}
            sub={isYear ? `Месяцев учтено: ${yearMonths.length}` : `Сбережения: ${fmtRub.format(displaySavings)}`}
            accent="#A78BFA"
          />
        </Grid>

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
                Итоги операций за месяц
              </Typography>

              <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.10)' }} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                  Доходы:{' '}
                  <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {fmtRub.format(incomeMonth)}
                  </Box>
                </Typography>

                <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                  Расходы:{' '}
                  <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {fmtRub.format(expenseMonth)}
                  </Box>
                </Typography>

                <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                  Сбережения:{' '}
                  <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {fmtRub.format(savingsMonth)}
                  </Box>
                </Typography>

                <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.75)' }}>
                  Норма сбережений:{' '}
                  <Box component="span" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {savingsRateMonth}%
                  </Box>
                </Typography>
              </Stack>

              <Divider sx={{ my: 1.5, borderColor: 'rgba(15, 23, 42, 0.10)' }} />

              <Typography variant="body2" sx={{ color: 'rgba(15, 23, 42, 0.65)' }}>
                История сохранена: {history.length} месяцев
              </Typography>

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
                        <Typography sx={{ fontWeight: 800, color: '#0F172A', textTransform: 'capitalize' }}>
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

                          {h.savedAt ? (
                            <Typography variant="caption" sx={{ color: 'rgba(15, 23, 42, 0.55)' }}>
                              Сохранено: {new Date(h.savedAt).toLocaleString('ru-RU')}
                            </Typography>
                          ) : null}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}