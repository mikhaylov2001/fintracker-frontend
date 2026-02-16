import React, { useEffect, useMemo, useState } from "react";
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

const surfaceSx = {
  borderRadius: 4,
  border: "1px solid rgba(15,23,42,0.06)",
  backgroundColor: "rgba(255,255,255,0.92)",
  boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
};

const StatCard = ({ label, value, sub, accent = "#4F46E5", onClick }) => (
  <Card
    variant="outlined"
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
    sx={{
      ...surfaceSx,
      height: "100%",
      minHeight: 116,
      cursor: onClick ? "pointer" : "default",
      transition: "transform 140ms ease, box-shadow 140ms ease",
      position: "relative",
      overflow: "hidden",
      "&:before": {
        content: '""',
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        bgcolor: accent,
        opacity: 0.95,
      },
      "&:hover": {
        transform: onClick ? "translateY(-2px)" : "none",
        boxShadow: onClick ? "0 22px 55px rgba(15,23,42,0.12)" : surfaceSx.boxShadow,
      },
    }}
  >
    <CardContent sx={{ p: 2.1 }}>
      <Typography
        variant="overline"
        sx={{
          color: "rgba(30,41,59,0.72)",
          letterSpacing: 0.6,
          lineHeight: 1.15,
          display: "block",
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="h5"
        sx={{
          mt: 0.75,
          fontWeight: 950,
          color: "rgba(15,23,42,0.92)",
          lineHeight: 1.05,
        }}
      >
        {value}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          mt: 0.6,
          color: "rgba(30,41,59,0.70)",
          display: "block",
          lineHeight: 1.2,
          minHeight: { xs: 32, md: 18 },
        }}
      >
        {sub && String(sub).trim() ? sub : " "}
      </Typography>
    </CardContent>
  </Card>
);

function SummaryRow({ label, value, color }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 1.25,
        py: 1.05,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: color }} />
        <Typography
          variant="body2"
          sx={{
            color: "rgba(30,41,59,0.82)",
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
          color: "rgba(15,23,42,0.92)",
          whiteSpace: "nowrap",
          letterSpacing: -0.2,
        }}
      >
        {value}
      </Typography>
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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

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
  const todayLabel = useMemo(() => fmtToday.format(new Date()), [fmtToday]);

  const fmtMonth = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        month: "long",
        year: "numeric",
      }),
    []
  );
  const monthTitle = (y, m) => fmtMonth.format(new Date(y, m - 1, 1));

  const kpiModeKey = useMemo(
    () => `fintracker:kpiMode:${userId || "anon"}`,
    [userId]
  );
  const [kpiMode, setKpiMode] = useState("month");

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
        setError("");

        if (!userId)
          throw new Error("Нет user.id (проверь authUser в localStorage).");

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
          setError(e?.message || "Ошибка загрузки сводки/истории");
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
  const yearBalance = useMemo(() => yearIncome - yearExpenses, [yearIncome, yearExpenses]);
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

  return (
    <Box sx={{ width: "100%" }}>
      {/* HERO */}
      <Card
        variant="outlined"
        sx={{
          ...surfaceSx,
          borderRadius: 5,
          mb: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `
              radial-gradient(900px 420px at 8% 0%, ${alpha("#60A5FA", 0.22)} 0%, transparent 60%),
              radial-gradient(900px 420px at 92% 0%, ${alpha("#A78BFA", 0.22)} 0%, transparent 60%)
            `,
          }}
        />
        <CardContent sx={{ p: { xs: 2.25, md: 3 }, position: "relative" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 950, lineHeight: 1.15, color: "rgba(15,23,42,0.92)" }}
              >
                Финансовая свобода
              </Typography>

              <Typography variant="body2" sx={{ color: "rgba(30,41,59,0.70)", mt: 0.5 }}>
                Привет, {displayName} • Сегодня: {todayLabel}
              </Typography>

              <Typography variant="body2" sx={{ color: "rgba(30,41,59,0.78)", mt: 0.5, fontWeight: 700 }}>
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
                  bgcolor: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(15,23,42,0.08)",
                  color: "rgba(15,23,42,0.80)",
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
                  bgcolor: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(15,23,42,0.08)",
                  borderRadius: 999,
                  "& .MuiToggleButton-root": {
                    border: 0,
                    px: 1.5,
                    flex: { xs: 1, sm: "unset" },
                    color: "rgba(30,41,59,0.75)",
                    fontWeight: 900,
                    textTransform: "none",
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    color: "white",
                    backgroundColor: "#4F46E5",
                  },
                }}
              >
                <ToggleButton value="month">Месяц</ToggleButton>
                <ToggleButton value="year">Год</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>

          {error ? (
            <Box
              sx={{
                mt: 1.25,
                p: 1.25,
                borderRadius: 2.5,
                border: `1px solid ${alpha("#EF4444", 0.35)}`,
                bgcolor: alpha("#EF4444", 0.08),
                color: "rgba(127,29,29,0.95)",
                fontWeight: 700,
              }}
            >
              {error}
            </Box>
          ) : null}
        </CardContent>
      </Card>

      {/* KPI */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
          gap: 2,
          mb: 2,
        }}
      >
        <StatCard label="Баланс" value={fmtRub.format(displayBalance)} sub=" " accent="#4F46E5" />

        <StatCard
          label="Доходы"
          value={fmtRub.format(displayIncome)}
          sub={`Расходы: ${fmtRub.format(displayExpenses)}`}
          accent="#16A34A"
          onClick={() => navigate("/income")}
        />

        <StatCard
          label="Расходы"
          value={fmtRub.format(displayExpenses)}
          sub=" "
          accent="#F97316"
          onClick={() => navigate("/expenses")}
        />

        <StatCard
          label="Норма сбережений"
          value={`${displayRate}%`}
          sub={`Сбережения: ${fmtRub.format(displaySavings)}`}
          accent="#7C3AED"
        />
      </Box>

      {/* DETAILS + HISTORY */}
      <Card variant="outlined" sx={{ ...surfaceSx, borderRadius: 5 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 950, color: "rgba(15,23,42,0.92)" }}>
              Итоги операций за месяц
            </Typography>

            <Typography variant="caption" sx={{ color: "rgba(30,41,59,0.66)", fontWeight: 900, textTransform: "capitalize" }}>
              {monthTitle(year, month)}
            </Typography>
          </Stack>

          <Divider sx={{ my: 1.5, borderColor: "rgba(15,23,42,0.06)" }} />

          <Box
            sx={{
              border: "1px solid rgba(15,23,42,0.06)",
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.70)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: { xs: 1.25, sm: 1.75 } }}>
              <SummaryRow label="Доходы" value={fmtRub.format(incomeMonth)} color="#16A34A" />
            </Box>
            <Divider sx={{ borderColor: "rgba(15,23,42,0.06)" }} />
            <Box sx={{ px: { xs: 1.25, sm: 1.75 } }}>
              <SummaryRow label="Расходы" value={fmtRub.format(expenseMonth)} color="#F97316" />
            </Box>
            <Divider sx={{ borderColor: "rgba(15,23,42,0.06)" }} />
            <Box sx={{ px: { xs: 1.25, sm: 1.75 } }}>
              <SummaryRow label="Сбережения" value={fmtRub.format(savingsMonth)} color="#7C3AED" />
            </Box>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: "rgba(15,23,42,0.06)" }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.25 }} sx={{ color: "rgba(30,41,59,0.60)" }}>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              История сохранена: {history.length} месяцев
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              Обновлено: {todayLabel}
            </Typography>
          </Stack>

          <Box sx={{ mt: 1.25 }}>
            {historyDesc.length === 0 ? (
              <Typography variant="body2" sx={{ color: "rgba(30,41,59,0.65)" }}>
                Пока нет сохранённых месяцев.
              </Typography>
            ) : (
              historyDesc.map((h) => {
                const raw = Number(h?.savings_rate_percent);
                const has = Number.isFinite(raw);
                const v = has ? Math.round(raw) : null;

                const pctColor = !has ? "rgba(30,41,59,0.65)" : v > 0 ? "#16A34A" : v < 0 ? "#DC2626" : "rgba(30,41,59,0.65)";
                const pctText = has ? `(${v}%)` : "(—%)";

                return (
                  <Accordion
                    key={`${h.year}-${h.month}`}
                    disableGutters
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      mb: 1,
                      border: "1px solid rgba(15,23,42,0.06)",
                      backgroundColor: "rgba(255,255,255,0.86)",
                      boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "rgba(30,41,59,0.60)" }} />}
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
                            color: "rgba(15,23,42,0.90)",
                            textTransform: "capitalize",
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {monthTitle(h.year, h.month)}
                        </Typography>

                        <Typography variant="caption" sx={{ fontWeight: 950, color: pctColor, whiteSpace: "nowrap" }}>
                          {pctText}
                        </Typography>
                      </Stack>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={0.75} sx={{ color: "rgba(30,41,59,0.78)" }}>
                        <Typography variant="body2">
                          Доходы:{" "}
                          <Box component="span" sx={{ fontWeight: 950, color: "rgba(15,23,42,0.92)" }}>
                            {fmtRub.format(n(h.total_income))}
                          </Box>
                        </Typography>

                        <Typography variant="body2">
                          Расходы:{" "}
                          <Box component="span" sx={{ fontWeight: 950, color: "rgba(15,23,42,0.92)" }}>
                            {fmtRub.format(n(h.total_expenses))}
                          </Box>
                        </Typography>

                        <Typography variant="body2">
                          Баланс:{" "}
                          <Box component="span" sx={{ fontWeight: 950, color: "rgba(15,23,42,0.92)" }}>
                            {fmtRub.format(n(h.balance))}
                          </Box>
                        </Typography>

                        <Typography variant="body2">
                          Сбережения:{" "}
                          <Box component="span" sx={{ fontWeight: 950, color: "rgba(15,23,42,0.92)" }}>
                            {fmtRub.format(n(h.savings))}
                          </Box>
                        </Typography>

                        <Typography variant="body2">
                          Норма сбережений:{" "}
                          <Box component="span" sx={{ fontWeight: 950, color: "rgba(15,23,42,0.92)" }}>
                            {n(h.savings_rate_percent)}%
                          </Box>
                        </Typography>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
