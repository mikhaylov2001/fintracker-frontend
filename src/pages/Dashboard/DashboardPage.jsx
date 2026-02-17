import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Skeleton from "@mui/material/Skeleton";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { getMonthlySummary } from "../../api/summaryApi";

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

const colors = {
  bg0: "#060A14",
  bg1: "#071022",
  card: "rgba(10, 16, 32, 0.45)",
  card2: "rgba(10, 16, 32, 0.55)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.62)",
  primary: "#7C5CFF",
  success: "#2FE7A1",
  warning: "#FF8A3D",
  accent: "#6DA8FF",
};

const surfaceSx = {
  borderRadius: { xs: 3, md: 5 },
  border: "none",
  backgroundColor: colors.card,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 25px 70px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const StatCard = memo(({ label, value, sub, accent = colors.primary, onClick }) => {
  const handleKeyDown = useCallback((e) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

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
        minHeight: 120,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "&:before": {
          content: '""',
          position: "absolute",
          left: 16,
          right: 16,
          top: 12,
          height: 3,
          borderRadius: 999,
          background: `linear-gradient(90deg, transparent 0%, ${alpha(accent, 0.95)} 30%, ${alpha(accent, 0.55)} 70%, transparent 100%)`,
          opacity: 0.95,
          pointerEvents: "none",
          animation: "neonPulse 2s ease-in-out infinite alternate",
        },
        "&:after": {
          content: '""',
          position: "absolute",
          right: -80,
          top: -90,
          width: 240,
          height: 240,
          borderRadius: 999,
          background: `radial-gradient(circle at 30% 30%, ${alpha(accent, 0.22)} 0%, transparent 60%)`,
          pointerEvents: "none",
          animation: "orbFloat 6s ease-in-out infinite",
        },
        "&:hover": onClick ? {
          transform: "translateY(-4px) scale(1.02)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12)",
        } : {},
        "@keyframes neonPulse": {
          "0%": { opacity: 0.9, boxShadow: "0 0 5px currentColor" },
          "100%": { opacity: 1, boxShadow: "0 0 25px currentColor" },
        },
        "@keyframes orbFloat": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-15px) rotate(180deg)" },
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="overline" sx={{ color: colors.muted, fontWeight: 900, letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 950, color: colors.text, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ mt: 0.75, color: colors.muted }}>
          {sub?.trim() || " "}
        </Typography>
      </CardContent>
    </Card>
  );
});

const SummaryRow = memo(({ label, value, color }) => (
  <Box sx={{
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: 1.5,
    py: 1.5,
  }}>
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, boxShadow: `0 0 12px ${alpha(color, 0.6)}` }} />
      <Typography variant="body2" sx={{ color: alpha(colors.text, 0.9), fontWeight: 900, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </Typography>
    </Stack>
    <Typography variant="body2" sx={{ fontWeight: 950, color: colors.text, letterSpacing: -0.2 }}>
      {value}
    </Typography>
  </Box>
));

const accordionSx = {
  borderRadius: { xs: 3, md: 4 },
  mb: 1.5,
  border: "none",
  backgroundColor: colors.card2,
  boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  "&:before": { display: "none" },
};

const HistoryAccordion = memo(({ h, monthTitle, fmtRub }) => {
  const raw = Number(h?.savings_rate_percent);
  const v = Number.isFinite(raw) ? Math.round(raw) : null;
  const pctColor = !v ? colors.muted : v > 0 ? colors.success : v < 0 ? "#FF4D4D" : colors.muted;
  const pctText = v !== null ? `(${v}%)` : "(—%)";

  return (
    <Accordion disableGutters elevation={0} sx={accordionSx}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.muted }} />}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%", gap: 1 }}>
          <Typography sx={{ fontWeight: 950, color: colors.text, textTransform: "capitalize" }}>
            {monthTitle(h.year, h.month)}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 950, color: pctColor }}>
            {pctText}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, px: 2.5 }}>
        <Stack spacing={1} sx={{ color: alpha(colors.text, 0.85) }}>
          <Typography variant="body2">
            Доходы: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{fmtRub.format(n(h.total_income))}</Box>
          </Typography>
          <Typography variant="body2">
            Расходы: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{fmtRub.format(n(h.total_expenses))}</Box>
          </Typography>
          <Typography variant="body2">
            Баланс: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{fmtRub.format(n(h.balance))}</Box>
          </Typography>
          <Typography variant="body2">
            Сбережения: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{fmtRub.format(n(h.savings))}</Box>
          </Typography>
          <Typography variant="body2">
            Норма сбережений: <Box component="span" sx={{ fontWeight: 950, color: colors.text }}>{n(h.savings_rate_percent)}%</Box>
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
});

function DashboardSkeleton() {
  return (
    <Box sx={{ width: "100%", minHeight: "100vh", position: "relative" }}>
      <Box sx={{ px: { xs: 1, sm: 1.5, md: 2.5 }, py: 2.5 }}>
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 12, mb: 3, bgcolor: alpha("white", 0.06), boxShadow: "0 25px 70px rgba(0,0,0,0.65)" }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(4,1fr)" }, gap: 2, mb: 3 }}>
          {[0,1,2,3].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3, bgcolor: alpha("white", 0.06), boxShadow: "0 25px 50px rgba(0,0,0,0.6)" }} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={450} sx={{ borderRadius: 12, bgcolor: alpha("white", 0.06), boxShadow: "0 25px 70px rgba(0,0,0,0.65)" }} />
      </Box>
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

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fmtRub = useMemo(() => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }), []);
  const fmtToday = useMemo(() => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }), []);
  const todayLabel = useMemo(() => fmtToday.format(now), [fmtToday, now]);
  const fmtMonth = useMemo(() => new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }), []);
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
      window.localStorage.setItem(kpiModeKey, kpiMode);
    } catch {}
  }, [kpiModeKey, kpiMode]);

  const onKpiModeChange = useCallback((_e, next) => next && setKpiMode(next), []);

  const historyDesc = useMemo(() => [...history].sort((a, b) => b.year - a.year || b.month - a.month), [history]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        if (!userId) throw new Error("Нет user.id (проверь authUser в localStorage).");

        const rawCur = await getMonthlySummary(userId, year, month);
        if (!cancelled) setSummary(unwrap(rawCur));

        const baseYM = { year, month };
        const rows = [];
        const tasks = Array.from({ length: 12 }, (_, i) => {
          const ym = addMonthsYM(baseYM, -i);
          return getMonthlySummary(userId, ym.year, ym.month).then(raw => {
            const d = unwrap(raw);
            if (d && (n(d.total_income) || n(d.total_expenses) || n(d.balance) || n(d.savings))) {
              rows.push({ ...d, year: ym.year, month: ym.month });
            }
          }).catch(() => {});
        });
        await Promise.all(tasks);
        if (!cancelled) setHistory(rows);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [userId, year, month]);

  const incomeMonth = n(summary?.total_income);
  const expenseMonth = n(summary?.total_expenses);
  const balanceMonth = n(summary?.balance);
  const savingsMonth = n(summary?.savings);
  const savingsRateMonth = n(summary?.savings_rate_percent);

  const yearMonths = useMemo(() => {
    const curNum = ymNum(year, month);
    return history.filter(h => h.year === year && ymNum(h.year, h.month) <= curNum);
  }, [history, year, month]);

  const yearIncome = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_income), 0), [yearMonths]);
  const yearExpenses = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.total_expenses), 0), [yearMonths]);
  const yearBalance = yearIncome - yearExpenses;
  const yearSavings = useMemo(() => yearMonths.reduce((acc, h) => acc + n(h.savings), 0), [yearMonths]);
  const yearSavingsRate = useMemo(() => yearIncome > 0 ? Math.round((yearBalance / yearIncome) * 100) : 0, [yearIncome, yearBalance]);

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
    <Box sx={{
      width: "100%",
      minHeight: "100vh",
      color: colors.text,
      p: 0,
      position: "relative",
      overflow: "hidden",
      background: `
        radial-gradient(1200px 600px at 10% 5%, ${alpha(colors.primary, 0.12)} 0%, transparent 50%),
        radial-gradient(1100px 550px at 90% 10%, ${alpha(colors.success, 0.1)} 0%, transparent 50%),
        radial-gradient(900px 500px at 20% 90%, ${alpha(colors.accent, 0.08)} 0%, transparent 50%),
        radial-gradient(800px 400px at 80% 85%, ${alpha(colors.warning, 0.06)} 0%, transparent 50%),
        linear-gradient(180deg, ${colors.bg1} 0%, ${colors.bg0} 100%)
      `,
      "&:before": {
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.08,
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        mixBlendMode: "soft-light",
      },
      "& > *": { position: "relative", zIndex: 1 },
    }}>
      <Box sx={{ px: { xs: 1, sm: 1.5, md: 2.5 }, py: 2.5 }}>
        {/* HERO */}
        <Card sx={{ ...surfaceSx, borderRadius: 12, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1.15, color: colors.text }}>
                  Финансовая свобода
                </Typography>
                <Typography variant="body1" sx={{ color: colors.muted, mt: 0.5 }}>
                  Привет, {displayName} • Сегодня: {todayLabel}
                </Typography>
                <Typography variant="body2" sx={{ color: alpha(colors.text, 0.8), mt: 0.25, fontWeight: 700 }}>
                  {periodLabel}
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Chip label="Актуально" sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderRadius: 999,
                  bgcolor: alpha(colors.card, 0.8),
                  border: "none",
                  color: colors.text,
                  fontWeight: 850,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }} />
                <ToggleButtonGroup value={kpiMode} exclusive onChange={onKpiModeChange} size="small" sx={{
                  width: { xs: "100%", sm: "auto" },
                  bgcolor: alpha(colors.card, 0.6),
                  border: "none",
                  borderRadius: 999,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  "& .MuiToggleButton-root": {
                    border: "none",
                    px: 2,
                    flex: { xs: 1, sm: "unset" },
                    color: alpha(colors.text, 0.6),
                    fontWeight: 900,
                    textTransform: "none",
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    color: colors.text,
                    backgroundColor: alpha(colors.primary, 0.2),
                  },
                  "& .MuiToggleButton-root:hover": {
                    backgroundColor: alpha(colors.primary, 0.12),
                  },
                }}>
                  <ToggleButton value="month">Месяц</ToggleButton>
                  <ToggleButton value="year">Год</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
            {error && (
              <Box sx={{
                mt: 2,
                p: 2,
                borderRadius: 8,
                bgcolor: alpha("#7F1D1D", 0.3),
                backdropFilter: "blur(16px)",
                color: "#FEE2E2",
                fontWeight: 700,
                boxShadow: "0 15px 40px rgba(239,68,68,0.3)",
              }}>
                {error}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* KPIs */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(4,minmax(0,1fr))" }, gap: 2.5, mb: 3 }}>
          <StatCard label="Баланс" value={fmtRub.format(displayBalance)} accent={colors.primary} />
          <StatCard label="Доходы" value={fmtRub.format(displayIncome)} sub={`Расходы: ${fmtRub.format(displayExpenses)}`} accent={colors.success} onClick={goIncome} />
          <StatCard label="Расходы" value={fmtRub.format(displayExpenses)} accent={colors.warning} onClick={goExpenses} />
          <StatCard label="Норма сбережений" value={`${displayRate}%`} sub={`Сбережения: ${fmtRub.format(displaySavings)}`} accent={colors.accent} />
        </Box>

        {/* DETAILS */}
        <Card sx={{ ...surfaceSx, borderRadius: 12 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 950, color: colors.text }}>
                Итоги операций за месяц
              </Typography>
              <Typography variant="caption" sx={{ color: colors.muted, fontWeight: 900 }}>
                {monthTitle(year, month)}
              </Typography>
            </Stack>
            <Box sx={{ borderRadius: 8, bgcolor: colors.card2, p: 2.5, backdropFilter: "blur(20px)" }}>
              <SummaryRow label="Доходы" value={fmtRub.format(incomeMonth)} color={colors.success} />
              <Divider sx={{ my: 1, bgcolor: alpha(colors.border, 0.3), height: 1 }} />
              <SummaryRow label="Расходы" value={fmtRub.format(expenseMonth)} color={colors.warning} />
              <Divider sx={{ my: 1, bgcolor: alpha(colors.border, 0.3), height: 1 }} />
              <SummaryRow label="Сбережения" value={fmtRub.format(savingsMonth)} color={colors.accent} />
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 3, color: colors.muted, fontWeight: 800 }}>
              <Typography variant="caption">
                История: {history.length} месяцев
              </Typography>
              <Typography variant="caption">
                Обновлено: {todayLabel}
              </Typography>
            </Stack>
            <Box sx={{ mt: 3 }}>
              {historyDesc.length === 0 ? (
                <Typography variant="body2" sx={{ color: colors.muted, textAlign: "center", py: 4 }}>
                  Пока нет сохранённых месяцев.
                </Typography>
              ) : (
                historyDesc.map((h) => (
                  <HistoryAccordion key={`${h.year}-${h.month}`} h={h} monthTitle={monthTitle} fmtRub={fmtRub} />
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
