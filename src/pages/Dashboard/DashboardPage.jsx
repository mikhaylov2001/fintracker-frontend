import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Skeleton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import { useNavigate } from "react-router-dom";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ArrowCircleUpOutlinedIcon from "@mui/icons-material/ArrowCircleUpOutlined";
import ArrowCircleDownOutlinedIcon from "@mui/icons-material/ArrowCircleDownOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import { useAuth } from "../../contexts/AuthContext";
import { getMonthlySummary } from "../../api/summaryApi";

import { bankingColors as colors, surfaceSx, pillSx } from "../../styles/bankingTokens";

/* helpers */
const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const unwrap = (raw) => (raw?.data && typeof raw.data === "object" ? raw.data : raw);

const ymNum = (y, m) => y * 12 + (m - 1);
const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const SectionTitle = memo(function SectionTitle({ title, right }) {
  return (
    <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 950, color: colors.text, letterSpacing: -0.2 }}>
        {title}
      </Typography>
      {right ? (
        <Typography variant="caption" sx={{ color: colors.muted, fontWeight: 900, textTransform: "capitalize" }}>
          {right}
        </Typography>
      ) : null}
    </Stack>
  );
});

const StatCard = memo(function StatCard({ label, value, sub, icon, accent = colors.primary, onClick }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      sx={{
        ...surfaceSx,
        height: "100%",
        minHeight: 116,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        borderColor: alpha(accent, 0.30),
        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(accent, 0.16)} 0%, transparent 62%)`,
          pointerEvents: "none",
        },
        "&:hover": onClick
          ? {
              transform: "translateY(-1px)",
              boxShadow: "0 16px 40px rgba(15,23,42,0.16)",
              borderColor: alpha(accent, 0.48),
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 2, position: "relative", zIndex: 1 }}>
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(accent, 0.12),
              border: `1px solid ${alpha(accent, 0.24)}`,
              flex: "0 0 auto",
            }}
          >
            {icon
              ? React.cloneElement(icon, {
                  sx: { fontSize: 18, color: alpha(accent, 0.95) },
                })
              : null}
          </Box>

          <Typography variant="overline" sx={{ color: colors.muted, fontWeight: 950, letterSpacing: 0.55 }}>
            {label}
          </Typography>
        </Stack>

        <Typography variant="h5" sx={{ mt: 0.9, fontWeight: 950, color: colors.text, lineHeight: 1.05, letterSpacing: -0.25 }}>
          {value}
        </Typography>

        <Typography variant="caption" sx={{ mt: 0.6, color: colors.muted, display: "block" }}>
          {sub && String(sub).trim() ? sub : "\u00A0"}
        </Typography>
      </CardContent>
    </Card>
  );
});

const SummaryRow = memo(function SummaryRow({ label, value, color }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 1.5,
        py: 1.25,
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: color }} />
        <Typography
          variant="body2"
          sx={{
            color: alpha(colors.text, 0.92),
            fontWeight: 900,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ fontWeight: 950, color: colors.text, whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Box>
  );
});

const accordionSx = {
  borderRadius: 4,
  mb: 1,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.card2,
  boxShadow: "0 10px 24px rgba(15,23,42,0.10)",
  "&:before": { display: "none" },
};

const HistoryAccordion = memo(function HistoryAccordion({ h, monthTitle, fmtRub }) {
  const raw = Number(h?.savings_rate_percent);
  const has = Number.isFinite(raw);
  const v = has ? Math.round(raw) : null;

  const pctColor = !has
    ? colors.muted
    : v > 0
    ? colors.success
    : v < 0
    ? colors.danger
    : colors.muted;

  const pctText = has ? `(${v}%)` : "(—%)";

  return (
    <Accordion disableGutters elevation={0} sx={accordionSx} TransitionProps={{ unmountOnExit: true }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: colors.muted }} />}
        sx={{ px: 2, "& .MuiAccordionSummary-content": { my: 1 } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%", gap: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 950, color: colors.text, textTransform: "capitalize", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {monthTitle(h.year, h.month)}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 950, color: pctColor, whiteSpace: "nowrap" }}>
            {pctText}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
        <Stack spacing={0.75} sx={{ color: alpha(colors.text, 0.84) }}>
          <Typography variant="body2">Доходы: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{fmtRub.format(n(h.total_income))}</Box></Typography>
          <Typography variant="body2">Расходы: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{fmtRub.format(n(h.total_expenses))}</Box></Typography>
          <Typography variant="body2">Баланс: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{fmtRub.format(n(h.balance))}</Box></Typography>
          <Typography variant="body2">Сбережения: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{fmtRub.format(n(h.savings))}</Box></Typography>
          <Typography variant="body2">Норма сбережений: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{has ? `${v}%` : "—%"}</Box></Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
});

function DashboardSkeleton() {
  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Skeleton variant="rounded" height={128} sx={{ borderRadius: 4, mb: 2, bgcolor: "rgba(15,23,42,0.06)" }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={116} sx={{ borderRadius: 4, bgcolor: "rgba(15,23,42,0.06)" }} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={340} sx={{ borderRadius: 4, bgcolor: "rgba(15,23,42,0.06)" }} />
    </Box>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fmtRub = useMemo(
    () =>
      new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }),
    []
  );

  const fmtToday = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    []
  );

  const fmtMonth = useMemo(
    () => new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }),
    []
  );

  const monthTitle = useCallback((y, m) => fmtMonth.format(new Date(y, m - 1, 1)), [fmtMonth]);

  const kpiModeKey = useMemo(() => `fintracker:kpiMode:${userId || "anon"}`, [userId]);

  const [kpiMode, setKpiMode] = useState(() => {
    try {
      const v = window.localStorage.getItem(kpiModeKey);
      return v === "month" || v === "year" ? v : "month";
    } catch {
      return "month";
    }
  });

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(kpiModeKey);
      if (v === "month" || v === "year") setKpiMode(v);
    } catch {}
  }, [kpiModeKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(kpiModeKey, kpiMode);
    } catch {}
  }, [kpiModeKey, kpiMode]);

  const onKpiModeChange = useCallback((_e, next) => {
    if (next) setKpiMode(next);
  }, []);

  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, todayLabel: "" };
  });

  useEffect(() => {
    const now = new Date();
    setPeriod({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      todayLabel: fmtToday.format(now),
    });
  }, [fmtToday]);

  const year = period.year;
  const month = period.month;
  const todayLabel = period.todayLabel || fmtToday.format(new Date());

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        if (!userId) throw new Error("Нет user.id (проверь authUser в localStorage).");

        const baseYM = { year, month };

        const rawCur = await getMonthlySummary(userId, year, month);
        const cur = unwrap(rawCur);
        if (!cancelled) setSummary(cur);

        const rows = [];
        const tasks = Array.from({ length: 11 }, (_, idx) => {
          const i = idx + 1;
          const ym = addMonthsYM(baseYM, -i);
          return getMonthlySummary(userId, ym.year, ym.month)
            .then((raw) => {
              const d = unwrap(raw);
              if (d && (n(d.total_income) || n(d.total_expenses) || n(d.balance) || n(d.savings))) {
                rows.push({ ...d, year: ym.year, month: ym.month });
              }
            })
            .catch(() => {});
        });

        await Promise.all(tasks);

        if (cur && (n(cur.total_income) || n(cur.total_expenses) || n(cur.balance) || n(cur.savings))) {
          rows.push({ ...cur, year, month });
        }

        if (!cancelled) setHistory(rows);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Ошибка загрузки сводки/истории");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, year, month]);

  const historyDesc = useMemo(() => [...history].sort((a, b) => b.year - a.year || b.month - a.month), [history]);

  const incomeMonth = n(summary?.total_income);
  const expenseMonth = n(summary?.total_expenses);
  const balanceMonth = n(summary?.balance);
  const savingsMonth = n(summary?.savings);
  const savingsRateMonth = n(summary?.savings_rate_percent);

  const yearMonths = useMemo(() => {
    const curNum = ymNum(year, month);
    return history.filter((h) => h.year === year && ymNum(h.year, h.month) <= curNum);
  }, [history, year, month]);

  const yearIncome = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_income), 0), [yearMonths]);
  const yearExpenses = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_expenses), 0), [yearMonths]);
  const yearBalance = yearIncome - yearExpenses;
  const yearSavings = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.savings), 0), [yearMonths]);

  const yearSavingsRate = useMemo(() => {
    if (yearIncome <= 0) return 0;
    const r = Math.round((yearBalance / yearIncome) * 100);
    return Number.isFinite(r) ? r : 0;
  }, [yearIncome, yearBalance]);

  const isYear = kpiMode === "year";
  const periodLabel = isYear ? `Показаны данные: ${year} год` : `Показаны данные: ${monthTitle(year, month)}`;

  const displayIncome = isYear ? yearIncome : incomeMonth;
  const displayExpenses = isYear ? yearExpenses : expenseMonth;
  const displayBalance = isYear ? yearBalance : balanceMonth;
  const displayRate = isYear ? yearSavingsRate : savingsRateMonth;
  const displaySavings = isYear ? yearSavings : savingsMonth;

  const displayName = user?.userName || user?.email || "пользователь";

  const goIncome = useCallback(() => navigate("/income"), [navigate]);
  const goExpenses = useCallback(() => navigate("/expenses"), [navigate]);

  if (loading) return <DashboardSkeleton />;

  return (
    <Box sx={{ width: "100%", color: colors.text }}>
      <Card
        variant="outlined"
        sx={{
          ...surfaceSx,
          borderRadius: 22,
          mb: 2,
          borderColor: alpha(colors.primary, 0.22),
          backgroundImage: `
            linear-gradient(135deg,
              ${alpha(colors.primary, 0.22)} 0%,
              ${alpha(colors.accent, 0.12)} 38%,
              transparent 72%
            )
          `,
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 950, color: colors.text, letterSpacing: -0.25 }}>
                Дашборд
              </Typography>
              <Typography variant="body2" sx={{ color: colors.muted, mt: 0.5 }}>
                Привет, {displayName} • Сегодня: {todayLabel}
              </Typography>
              <Typography variant="body2" sx={{ color: alpha(colors.text, 0.78), mt: 0.5, fontWeight: 700 }}>
                {periodLabel}
              </Typography>

              {error ? (
                <Box
                  role="alert"
                  sx={{
                    mt: 1.25,
                    p: 1.25,
                    borderRadius: 3,
                    border: `1px solid ${alpha(colors.danger, 0.22)}`,
                    bgcolor: alpha(colors.danger, 0.08),
                    color: colors.text,
                    fontWeight: 750,
                  }}
                >
                  {error}
                </Box>
              ) : null}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ width: { xs: "100%", md: "auto" } }}>
              <Chip label="Актуально" sx={{ ...pillSx, width: { xs: "100%", sm: "auto" }, borderColor: alpha(colors.primary, 0.18) }} />

              <Chip
                icon={<CalendarMonthOutlinedIcon sx={{ color: alpha(colors.primary, 0.95) }} />}
                label={isYear ? "Режим: Год" : "Режим: Месяц"}
                sx={{ ...pillSx, width: { xs: "100%", sm: "auto" }, borderColor: alpha(colors.primary, 0.18), "& .MuiChip-icon": { ml: 1, mr: -0.25 } }}
              />

              <ToggleButtonGroup
                value={kpiMode}
                exclusive
                onChange={onKpiModeChange}
                size="small"
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  bgcolor: "rgba(255,255,255,0.92)",
                  border: `1px solid ${alpha(colors.primary, 0.22)}`,
                  borderRadius: 999,
                  "& .MuiToggleButton-root": {
                    border: 0,
                    px: 1.5,
                    flex: { xs: 1, sm: "unset" },
                    color: alpha(colors.text, 0.70),
                    fontWeight: 900,
                    textTransform: "none",
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    color: "#FFFFFF",
                    backgroundColor: colors.primary,
                  },
                }}
              >
                <ToggleButton value="month">Месяц</ToggleButton>
                <ToggleButton value="year">Год</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 2 }}>
        <StatCard label="Баланс" value={fmtRub.format(displayBalance)} accent={colors.primary} icon={<AccountBalanceWalletOutlinedIcon />} />
        <StatCard label="Доходы" value={fmtRub.format(displayIncome)} sub={`Расходы: ${fmtRub.format(displayExpenses)}`} accent={colors.primary} onClick={goIncome} icon={<ArrowCircleUpOutlinedIcon />} />
        <StatCard label="Расходы" value={fmtRub.format(displayExpenses)} accent={colors.warning} onClick={goExpenses} icon={<ArrowCircleDownOutlinedIcon />} />
        <StatCard label="Норма сбережений" value={`${displayRate}%`} sub={`Сбережения: ${fmtRub.format(displaySavings)}`} accent={colors.primary} icon={<PercentOutlinedIcon />} />
      </Box>

      <Card variant="outlined" sx={{ ...surfaceSx, borderRadius: 22 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <SectionTitle title="Итоги месяца" right={monthTitle(year, month)} />

          <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 18, overflow: "hidden", bgcolor: colors.card2 }}>
            <SummaryRow label="Доходы" value={fmtRub.format(incomeMonth)} color={colors.primary} />
            <Divider sx={{ borderColor: colors.border }} />
            <SummaryRow label="Расходы" value={fmtRub.format(expenseMonth)} color={colors.warning} />
            <Divider sx={{ borderColor: colors.border }} />
            <SummaryRow label="Сбережения" value={fmtRub.format(savingsMonth)} color={colors.accent} />
          </Box>

          <Divider sx={{ my: 2, borderColor: colors.border }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.25 }} sx={{ color: colors.muted }}>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              История сохранена: {history.length} месяцев
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              Обновлено: {todayLabel}
            </Typography>
          </Stack>

          <Box sx={{ mt: 1.25 }}>
            {historyDesc.length === 0 ? (
              <Typography variant="body2" sx={{ color: colors.muted }}>
                Пока нет сохранённых месяцев.
              </Typography>
            ) : (
              historyDesc.map((h) => <HistoryAccordion key={`${h.year}-${h.month}`} h={h} monthTitle={monthTitle} fmtRub={fmtRub} />)
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
