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

import { useAuth } from "../../contexts/AuthContext";
import { getMonthlySummary } from "../../api/summaryApi";

/* ───────── helpers ───────── */

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const unwrap = (raw) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === "object") return raw.data;
  return raw;
};

const ymNum = (y, m) => y * 12 + (m - 1);

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

/* ───────── design tokens ───────── */

const colors = {
  bg0: "#060A14",
  bg1: "#071022",
  card: "rgba(10, 16, 32, 0.62)",
  card2: "rgba(10, 16, 32, 0.72)",
  border: "rgba(255,255,255,0.08)",
  border2: "rgba(255,255,255,0.12)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.62)",
  primary: "#7C5CFF",
  success: "#2FE7A1",
  warning: "#FF8A3D",
  accent: "#6DA8FF",
};

const surfaceSx = {
  borderRadius: 5,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.card,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
};

/* ───────── StatCard (memoized) ───────── */

const StatCard = memo(function StatCard({
  label,
  value,
  sub,
  accent = colors.primary,
  onClick,
}) {
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
        minHeight: 112,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition:
          "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        borderColor: alpha(accent, 0.22),
        "&:before": {
          content: '""',
          position: "absolute",
          left: 14,
          right: 14,
          top: 10,
          height: 3,
          borderRadius: 999,
          background: `linear-gradient(90deg, transparent 0%, ${alpha(
            accent,
            0.95
          )} 30%, ${alpha(accent, 0.55)} 70%, transparent 100%)`,
          opacity: 0.95,
          pointerEvents: "none",
        },
        "&:after": {
          content: '""',
          position: "absolute",
          right: -70,
          top: -80,
          width: 220,
          height: 220,
          borderRadius: 999,
          background: `radial-gradient(circle at 30% 30%, ${alpha(
            accent,
            0.18
          )} 0%, transparent 60%)`,
          pointerEvents: "none",
        },
        "&:hover": onClick
          ? {
              transform: "translateY(-2px)",
              boxShadow: "0 26px 70px rgba(0,0,0,0.62)",
              borderColor: alpha(accent, 0.45),
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="overline"
          sx={{ color: colors.muted, fontWeight: 900, letterSpacing: 0.55 }}
        >
          {label}
        </Typography>
        <Typography
          variant="h5"
          sx={{ mt: 0.6, fontWeight: 950, color: colors.text, lineHeight: 1.05 }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{ mt: 0.5, color: colors.muted, display: "block" }}
        >
          {sub && String(sub).trim() ? sub : "\u00A0"}
        </Typography>
      </CardContent>
    </Card>
  );
});

/* ───────── SummaryRow (memoized) ───────── */

const SummaryRow = memo(function SummaryRow({ label, value, color }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 1.25,
        py: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: color }} />
        <Typography
          variant="body2"
          sx={{
            color: alpha(colors.text, 0.9),
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
      <Typography
        variant="body2"
        sx={{
          fontWeight: 950,
          color: colors.text,
          whiteSpace: "nowrap",
          letterSpacing: -0.15,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
});

/* ───────── HistoryAccordion (memoized) ───────── */

const accordionSx = {
  borderRadius: 4,
  mb: 1,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.card2,
  boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  "&:before": { display: "none" },
};

const HistoryAccordion = memo(function HistoryAccordion({
  h,
  monthTitle,
  fmtRub,
}) {
  const raw = Number(h?.savings_rate_percent);
  const has = Number.isFinite(raw);
  const v = has ? Math.round(raw) : null;

  const pctColor = !has
    ? colors.muted
    : v > 0
    ? colors.success
    : v < 0
    ? "#FF4D4D"
    : colors.muted;

  const pctText = has ? `(${v}%)` : "(—%)";

  return (
    <Accordion disableGutters elevation={0} sx={accordionSx}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: colors.muted }} />}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", gap: 1, minWidth: 0 }}
        >
          <Typography
            sx={{
              fontWeight: 950,
              color: colors.text,
              textTransform: "capitalize",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {monthTitle(h.year, h.month)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 950, color: pctColor, whiteSpace: "nowrap" }}
          >
            {pctText}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={0.75} sx={{ color: alpha(colors.text, 0.82) }}>
          <Typography variant="body2">
            Доходы:{" "}
            <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>
              {fmtRub.format(n(h.total_income))}
            </Box>
          </Typography>
          <Typography variant="body2">
            Расходы:{" "}
            <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>
              {fmtRub.format(n(h.total_expenses))}
            </Box>
          </Typography>
          <Typography variant="body2">
            Баланс:{" "}
            <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>
              {fmtRub.format(n(h.balance))}
            </Box>
          </Typography>
          <Typography variant="body2">
            Сбережения:{" "}
            <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>
              {fmtRub.format(n(h.savings))}
            </Box>
          </Typography>
          <Typography variant="body2">
            Норма сбережений:{" "}
            <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>
              {n(h.savings_rate_percent)}%
            </Box>
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
});

/* ───────── Skeleton Loader ───────── */

function DashboardSkeleton() {
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Skeleton
        variant="rounded"
        height={120}
        sx={{ borderRadius: 6, mb: 2, bgcolor: "rgba(255,255,255,0.04)" }}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 2,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={112}
            sx={{ borderRadius: 5, bgcolor: "rgba(255,255,255,0.04)" }}
          />
        ))}
      </Box>
      <Skeleton
        variant="rounded"
        height={300}
        sx={{ borderRadius: 6, bgcolor: "rgba(255,255,255,0.04)" }}
      />
    </Box>
  );
}

/* ═══════════════════════════════════════════
   DashboardPage — main component
   ═══════════════════════════════════════════ */

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  /* ── formatters (stable refs) ── */

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

  const todayLabel = useMemo(() => fmtToday.format(now), [fmtToday, now]);

  const fmtMonth = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }),
    []
  );

  const monthTitle = useCallback(
    (y, m) => fmtMonth.format(new Date(y, m - 1, 1)),
    [fmtMonth]
  );

  /* ── KPI mode (month / year) with localStorage ── */

  const kpiModeKey = useMemo(
    () => `fintracker:kpiMode:${userId || "anon"}`,
    [userId]
  );

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
      window.localStorage.setItem(kpiModeKey, kpiMode);
    } catch {}
  }, [kpiModeKey, kpiMode]);

  const onKpiModeChange = useCallback((_e, next) => {
    if (next) setKpiMode(next);
  }, []);

  /* ── sorted history (descending) ── */

  const historyDesc = useMemo(
    () => [...history].sort((a, b) => b.year - a.year || b.month - a.month),
    [history]
  );

  /* ── data fetching ── */

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        if (!userId) {
          throw new Error("Нет user.id (проверь authUser в localStorage).");
        }

        const rawCur = await getMonthlySummary(userId, year, month);
        const cur = unwrap(rawCur);
        if (!cancelled) setSummary(cur);

        const baseYM = { year, month };
        const rows = [];

        const tasks = Array.from({ length: 12 }, (_, i) => {
          const ym = addMonthsYM(baseYM, -i);
          return getMonthlySummary(userId, ym.year, ym.month)
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
            .catch(() => {});
        });

        await Promise.all(tasks);
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

  /* ── derived KPI values ── */

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
  const yearBalance = yearIncome - yearExpenses;
  const yearSavings = useMemo(
    () => yearMonths.reduce((acc, h) => acc + n(h.savings), 0),
    [yearMonths]
  );

  const yearSavingsRate = useMemo(() => {
    if (yearIncome <= 0) return 0;
    const r = Math.round((yearBalance / yearIncome) * 100);
    return Number.isFinite(r) ? r : 0;
  }, [yearIncome, yearBalance]);

  const isYear = kpiMode === "year";
  const periodLabel = isYear
    ? `Показаны данные: ${year} год`
    : `Показаны данные: ${monthTitle(year, month)}`;

  const displayIncome = isYear ? yearIncome : incomeMonth;
  const displayExpenses = isYear ? yearExpenses : expenseMonth;
  const displayBalance = isYear ? yearBalance : balanceMonth;
  const displayRate = isYear ? yearSavingsRate : savingsRateMonth;
  const displaySavings = isYear ? yearSavings : savingsMonth;

  const displayName = user?.userName || user?.email || "пользователь";

  /* ── navigation callbacks (stable refs) ── */

  const goIncome = useCallback(() => navigate("/income"), [navigate]);
  const goExpenses = useCallback(() => navigate("/expenses"), [navigate]);

  /* ── loading state ── */

  if (loading) return <DashboardSkeleton />;

  /* ── render ── */

  return (
    <Box
      sx={{
        width: "100%",
        color: colors.text,
        borderRadius: 6,
        p: { xs: 1, sm: 1.5, md: 2 },
        background: `
          radial-gradient(900px 520px at 12% 10%, ${alpha(colors.success, 0.14)} 0%, transparent 55%),
          radial-gradient(900px 520px at 88% 18%, ${alpha(colors.primary, 0.16)} 0%, transparent 55%),
          radial-gradient(900px 520px at 65% 90%, ${alpha(colors.accent, 0.12)} 0%, transparent 55%),
          linear-gradient(180deg, ${colors.bg1} 0%, ${colors.bg0} 100%)
        `,
      }}
    >
      {/* ══════ HERO ══════ */}
      <Card variant="outlined" sx={{ ...surfaceSx, borderRadius: 6, mb: 2 }}>
        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 950, lineHeight: 1.15, color: colors.text }}
              >
                Финансовая свобода
              </Typography>
              <Typography variant="body2" sx={{ color: colors.muted, mt: 0.5 }}>
                Привет, {displayName} • Сегодня: {todayLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: alpha(colors.text, 0.78), mt: 0.5, fontWeight: 700 }}
              >
                {periodLabel}
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Chip
                label={loading ? "Загрузка…" : "Актуально"}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderRadius: 999,
                  bgcolor: alpha("#0B1226", 0.55),
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  fontWeight: 850,
                }}
              />
              <ToggleButtonGroup
                value={kpiMode}
                exclusive
                onChange={onKpiModeChange}
                size="small"
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  bgcolor: alpha("#0B1226", 0.55),
                  border: `1px solid ${colors.border}`,
                  borderRadius: 999,
                  "& .MuiToggleButton-root": {
                    border: 0,
                    px: 1.5,
                    flex: { xs: 1, sm: "unset" },
                    color: alpha(colors.text, 0.78),
                    fontWeight: 900,
                    textTransform: "none",
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    color: colors.text,
                    backgroundColor: alpha(colors.primary, 0.85),
                  },
                }}
              >
                <ToggleButton value="month">Месяц</ToggleButton>
                <ToggleButton value="year">Год</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>

          {error && (
            <Box
              role="alert"
              sx={{
                mt: 1.25,
                p: 1.25,
                borderRadius: 2.5,
                border: `1px solid ${alpha("#EF4444", 0.28)}`,
                bgcolor: alpha("#7F1D1D", 0.25),
                color: alpha("#FEE2E2", 0.95),
                fontWeight: 700,
              }}
            >
              {error}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ══════ KPI CARDS ══════ */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 2,
        }}
      >
        <StatCard
          label="Баланс"
          value={fmtRub.format(displayBalance)}
          accent={colors.primary}
        />
        <StatCard
          label="Доходы"
          value={fmtRub.format(displayIncome)}
          sub={`Расходы: ${fmtRub.format(displayExpenses)}`}
          accent={colors.success}
          onClick={goIncome}
        />
        <StatCard
          label="Расходы"
          value={fmtRub.format(displayExpenses)}
          accent={colors.warning}
          onClick={goExpenses}
        />
        <StatCard
          label="Норма сбережений"
          value={`${displayRate}%`}
          sub={`Сбережения: ${fmtRub.format(displaySavings)}`}
          accent={colors.accent}
        />
      </Box>

      {/* ══════ DETAILS + HISTORY ══════ */}
      <Card variant="outlined" sx={{ ...surfaceSx, borderRadius: 6 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 950, color: colors.text }}>
              Итоги операций за месяц
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: colors.muted,
                fontWeight: 900,
                textTransform: "capitalize",
              }}
            >
              {monthTitle(year, month)}
            </Typography>
          </Stack>

          <Divider sx={{ my: 1.5, borderColor: colors.border }} />

          <Box
            sx={{
              border: `1px solid ${colors.border}`,
              borderRadius: 4,
              bgcolor: colors.card2,
              overflow: "hidden",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <Box sx={{ px: { xs: 1.25, sm: 1.75 } }}>
              <SummaryRow
                label="Доходы"
                value={fmtRub.format(incomeMonth)}
                color={colors.success}
              />
            </Box>
            <Divider sx={{ borderColor: colors.border }} />
            <Box sx={{ px: { xs: 1.25, sm: 1.75 } }}>
              <SummaryRow
                label="Расходы"
                value={fmtRub.format(expenseMonth)}
                color={colors.warning}
              />
            </Box>
            <Divider sx={{ borderColor: colors.border }} />
            <Box sx={{ px: { xs: 1.25, sm: 1.75 } }}>
              <SummaryRow
                label="Сбережения"
                value={fmtRub.format(savingsMonth)}
                color={colors.accent}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: colors.border }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 0.25, sm: 1.25 }}
            sx={{ color: colors.muted }}
          >
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
              historyDesc.map((h) => (
                <HistoryAccordion
                  key={`${h.year}-${h.month}`}
                  h={h}
                  monthTitle={monthTitle}
                  fmtRub={fmtRub}
                />
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}