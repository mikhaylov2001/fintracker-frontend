// src/pages/Analytics/AnalyticsPage.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  memo,
  useRef,
} from "react";
import {
  Typography,
  Box,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
import {
  ChartsTooltipContainer,
  ChartsItemTooltipContent,
} from "@mui/x-charts/ChartsTooltip";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/ru";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ArrowCircleUpOutlinedIcon from "@mui/icons-material/ArrowCircleUpOutlined";
import ArrowCircleDownOutlinedIcon from "@mui/icons-material/ArrowCircleDownOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import { useAuth } from "../../contexts/AuthContext";
import { useSummaryApi } from "../../api/summaryApi";
import { useExpensesApi } from "../../api/expensesApi";
import { useIncomeApi } from "../../api/incomeApi";

import {
  bankingColors as colors,
  surfaceOutlinedSx,
} from "../../styles/bankingTokens";
import { useCurrency } from "../../contexts/CurrencyContext";

dayjs.locale("ru");

const COLORS = {
  income: colors.primary,
  expenses: colors.warning,
  balance: "#6366F1",
  rate: "#A78BFA",
};

const WHITE = "#FFFFFF";

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

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
  if (raw.data && typeof raw.data === "object") return raw.data;
  return raw;
};

const unwrapList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.data && typeof raw.data === "object") {
    if (Array.isArray(raw.data.content)) return raw.data.content;
    if (Array.isArray(raw.data)) return raw.data;
  }
  if (Array.isArray(raw.content)) return raw.content;
  return [];
};

const fmtMonthLong = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
});
const fmtMonthShort = new Intl.DateTimeFormat("ru-RU", { month: "short" });

const monthTitleRu = (y, m) => fmtMonthLong.format(new Date(y, m - 1, 1));
const monthShortRu = (y, m) => fmtMonthShort.format(new Date(y, m - 1, 1));

const parseFullDateString = (str) => {
  if (!str || typeof str !== "string") return null;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(str.trim());
  if (!m) return null;
  const dd = m[1];
  const MM = m[2];
  const yyyy = m[3];
  const parsed = dayjs(`${yyyy}-${MM}-${dd}`, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed : null;
};

const parseDayjsToYM = (d) => {
  if (!d || !dayjs.isDayjs(d) || !d.isValid()) return null;
  return { year: d.year(), month: d.month() + 1 };
};

const KpiCard = memo(function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
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

  const clickable = Boolean(onClick);

  return (
    <Box
      component="div"
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      sx={{
        ...surfaceOutlinedSx,
        height: "100%",
        minHeight: { xs: 96, sm: 104, md: 116 },
        cursor: clickable ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition:
          "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        borderColor: alpha(accent, 0.34),
        display: "flex",
        flexDirection: "column",
        p: { xs: 1.5, md: 2 },
        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(
            accent,
            0.2
          )} 0%, transparent 62%)`,
          pointerEvents: "none",
        },
        "@media (hover: hover) and (pointer: fine)": clickable
          ? {
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 22px 70px rgba(0,0,0,0.58)",
                borderColor: alpha(accent, 0.58),
              },
            }
          : {},
      }}
    >
      <Stack
        direction="row"
        spacing={1.1}
        alignItems="center"
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Box
          sx={{
            width: { xs: 30, md: 34 },
            height: { xs: 30, md: 34 },
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(accent, 0.14),
            border: `1px solid ${alpha(accent, 0.28)}`,
            flex: "0 0 auto",
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
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: { xs: 2, sm: 1 },
            overflow: "hidden",
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
          fontSize: { xs: "1.15rem", sm: "1.22rem", md: "1.35rem" },
          position: "relative",
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
          display: { xs: "none", md: "block" },
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          position: "relative",
          zIndex: 1,
        }}
      >
        {sub && String(sub).trim() ? sub : "\u00A0"}
      </Typography>
    </Box>
  );
});

function BalanceAreaGradient({ id = "balanceGradient", color = COLORS.balance }) {
  const { top, height } = useDrawingArea();
  const y1 = top;
  const y2 = top + height;

  return (
    <defs>
      <linearGradient
        id={id}
        x1="0"
        x2="0"
        y1={y1}
        y2={y2}
        gradientUnits="userSpaceOnUse"
      >
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
    >
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: "100%",
          width: 2,
          height: 14,
          transform: "translateX(-50%)",
          bgcolor: alpha(COLORS.balance, 0.55),
          borderRadius: 999,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          bgcolor: alpha("#0B1220", 0.94),
          color: "#fff",
          borderRadius: 2,
          px: 1.25,
          py: 0.85,
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          border: 0,
          pointerEvents: "none",
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
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{ mt: 0.25, mb: 1.0 }}
    >
      <Stack direction="row" spacing={0.9} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: COLORS.income }} />
        <Typography sx={{ color: WHITE, fontWeight: 900, fontSize: 12 }}>
          Доходы
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.9} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: COLORS.expenses }} />
        <Typography sx={{ color: WHITE, fontWeight: 900, fontSize: 12 }}>
          Расходы
        </Typography>
      </Stack>
    </Stack>
  );
});

// Стили для DatePicker, которые «пробивают» MUI
const datePickerSx = {
  flex: 1,
  minWidth: 0,
  "& .MuiInputBase-root": {
    borderRadius: "999px !important",
    backgroundColor: "rgba(4, 47, 46, 0.95) !important",
    height: 32,
    padding: "0 12px",
    border: "none !important",
    "&.Mui-focused": { boxShadow: "none" },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none !important",
    display: "none !important",
  },
  "& .MuiInputBase-input": {
    color: "#FFFFFF !important",
    "-webkit-text-fill-color": "#FFFFFF !important",
    opacity: "1 !important",
    textAlign: "center",
    fontWeight: "950 !important",
    fontSize: "13px",
    padding: "0 !important",
  },
  "& .MuiSvgIcon-root": {
    color: "#FFFFFF !important",
    fontSize: "18px",
    opacity: 0.85
  },
};

export default function AnalyticsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { formatAmount } = useCurrency();

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const userId = user?.id;

  const summaryApi = useSummaryApi();
  const expensesApi = useExpensesApi();
  const incomeApi = useIncomeApi();

  const getMonthlySummaryRef = useRef(summaryApi.getMonthlySummary);
  const getMyExpensesByMonthRef = useRef(expensesApi.getMyExpensesByMonth);
  const getMyIncomesByMonthRef = useRef(incomeApi.getMyIncomesByMonth);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const now = new Date();
  const yearNow = now.getFullYear();
  const monthNow = now.getMonth() + 1;

  const [mode, setMode] = useState("month");
  const [topTab, setTopTab] = useState("expenses");

  const fmtAxis = useMemo(
    () =>
      new Intl.NumberFormat("ru-RU", {
        maximumFractionDigits: 0,
      }),
    []
  );

  const axisMoneyFormatter = useCallback(
    (v) => (isMobile ? fmtAxisShort(v) : fmtAxis.format(Number(v || 0))),
    [isMobile, fmtAxis]
  );

  const cashflowMargin = useMemo(
    () =>
      isMobile
        ? { left: 34, right: 10, top: 18, bottom: 50 }
        : { left: 70, right: 16, top: 18, bottom: 50 },
    [isMobile]
  );

  const balanceMargin = useMemo(
    () =>
      isMobile
        ? { left: 34, right: 10, top: 14, bottom: 28 }
        : { left: 70, right: 16, top: 14, bottom: 28 },
    [isMobile]
  );

  const topCatsYAxisWidth = isMobile ? 72 : 110;
  const topCatsMargin = useMemo(
    () =>
      isMobile
        ? { left: 4, right: 10, top: 10, bottom: 28 }
        : { left: 10, right: 12, top: 10, bottom: 28 },
    [isMobile]
  );

  // Исправлено: используем только нужные переменные
  const [rangeFrom, setRangeFrom] = useState(dayjs("2025-01-01"));
  const [rangeTo, setRangeTo] = useState(dayjs());

  const rangeParsed = useMemo(() => {
    if (!rangeFrom || !rangeTo || rangeFrom.isAfter(rangeTo)) return null;

    const a = parseDayjsToYM(rangeFrom);
    const b = parseDayjsToYM(rangeTo);
    if (!a || !b) return null;

    const fromN = ymNum(a.year, a.month);
    const toN = ymNum(b.year, b.month);

    return {
      from: { year: a.year, month: a.month },
      to: { year: b.year, month: b.month },
      fromN,
      toN,
    };
  }, [rangeFrom, rangeTo]);

  const PageWrap = ({ children }) => (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        px: { xs: 2, md: 3, lg: 4 },
        maxWidth: { xs: "100%", sm: 720, md: 1040, lg: 1240, xl: 1400 },
      }}
    >
      {children}
    </Box>
  );

  useEffect(() => {
    setHistory([]);
    setError("");
    setLoading(true);
  }, [userId]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !userId) return;

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const getMonthlySummary = getMonthlySummaryRef.current;
        const baseYM = { year: yearNow, month: monthNow };
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
        if (!cancelled) setError(e?.message || "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, yearNow, monthNow, authLoading, isAuthenticated]);

  const last12 = useMemo(() => {
    const base = { year: yearNow, month: monthNow };
    const arr = [];
    for (let i = 11; i >= 0; i--) arr.push(addMonthsYM(base, -i));
    return arr;
  }, [yearNow, monthNow]);

  const historyMap = useMemo(() => {
    const m = new Map();
    history.forEach((h) => m.set(`${h.year}-${h.month}`, h));
    return m;
  }, [history]);

  const cashflowRowsBase = useMemo(
    () =>
      last12.map((ym) => {
        const h = historyMap.get(`${ym.year}-${ym.month}`);
        const income = n(h?.total_income);
        const expenses = n(h?.total_expenses);
        const balance = income - expenses;
        return {
          year: ym.year,
          month: ym.month,
          label: `${monthShortRu(ym.year, ym.month)} ${String(ym.year).slice(
            2
          )}`,
          income,
          expenses,
          balance,
        };
      }),
    [last12, historyMap]
  );

  const isYear = mode === "year";
  const isRange = mode === "range";

  const periodLabel = isYear
    ? `Показаны данные: ${yearNow} год`
    : isRange && rangeParsed
    ? `Период: ${monthTitleRu(
        rangeParsed.from.year,
        rangeParsed.from.month
      )} — ${monthTitleRu(rangeParsed.to.year, rangeParsed.to.month)}`
    : `Показаны данные: ${monthTitleRu(yearNow, monthNow)}`;

  const monthsFiltered = useMemo(() => {
    if (isRange) {
      if (!rangeParsed) return [];
      return cashflowRowsBase.filter((r) => {
        const x = ymNum(r.year, r.month);
        return x >= rangeParsed.fromN && x <= rangeParsed.toN;
      });
    }
    if (isYear) {
      return cashflowRowsBase.filter((r) => r.year === yearNow);
    }
    return cashflowRowsBase.filter(
      (r) => r.year === yearNow && r.month === monthNow
    );
  }, [cashflowRowsBase, isYear, isRange, rangeParsed, yearNow, monthNow]);

  const cashflowRows = useMemo(() => {
    if (mode === "month") return cashflowRowsBase;
    return monthsFiltered;
  }, [mode, cashflowRowsBase, monthsFiltered]);

  const totalIncome = useMemo(
    () => monthsFiltered.reduce((acc, r) => acc + r.income, 0),
    [monthsFiltered]
  );
  const totalExpenses = useMemo(
    () => monthsFiltered.reduce((acc, r) => acc + r.expenses, 0),
    [monthsFiltered]
  );
  const totalBalance = useMemo(
    () => totalIncome - totalExpenses,
    [totalIncome, totalExpenses]
  );
  const totalSavings = useMemo(
    () =>
      history
        .filter((h) =>
          monthsFiltered.some((r) => r.year === h.year && r.month === h.month)
        )
        .reduce((acc, h) => acc + n(h.savings), 0),
    [history, monthsFiltered]
  );
  const totalRate = useMemo(
    () => (totalIncome > 0 ? Math.round((totalBalance / totalIncome) * 100) : 0),
    [totalIncome, totalBalance]
  );

  const [topCatsExpenses, setTopCatsExpenses] = useState([]);
  const [topCatsIncome, setTopCatsIncome] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !userId) return;
    if (!monthsFiltered.length) {
      setTopCatsExpenses([]);
      setTopCatsIncome([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        setCatsLoading(true);
        const accExp = new Map();
        const accInc = new Map();
        const tasks = monthsFiltered.flatMap((ym) => [
          getMyExpensesByMonthRef.current(ym.year, ym.month, 0, 500).then((resp) => {
            unwrapList(resp?.data ?? resp).forEach((x) => {
              const cat = String(x.category || "Другое");
              accExp.set(cat, (accExp.get(cat) || 0) + n(x.amount));
            });
          }),
          getMyIncomesByMonthRef.current(ym.year, ym.month, 0, 500).then((resp) => {
            unwrapList(resp?.data ?? resp).forEach((x) => {
              const cat = String(x.category || "Другое");
              accInc.set(cat, (accInc.get(cat) || 0) + n(x.amount));
            });
          }),
        ]);
        await Promise.all(tasks);
        if (!cancelled) {
          setTopCatsExpenses([...accExp.entries()].map(([category, amount]) => ({ category, amount })).sort((a,b)=>b.amount-a.amount).slice(0,6));
          setTopCatsIncome([...accInc.entries()].map(([category, amount]) => ({ category, amount })).sort((a,b)=>b.amount-a.amount).slice(0,6));
        }
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [userId, monthsFiltered, authLoading, isAuthenticated]);

  if (authLoading) return null;

  return (
    <PageWrap>
      {/* HEADER SECTION */}
      <Box sx={{ mb: 3.5, pt: 1.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ sm: "center" }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ flexGrow: 1 }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(COLORS.balance, 0.12),
                border: `1px solid ${alpha(COLORS.balance, 0.2)}`,
              }}
            >
              <CalendarMonthOutlinedIcon
                sx={{ fontSize: 22, color: COLORS.balance }}
              />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 980,
                  color: colors.text,
                  letterSpacing: -0.35,
                  lineHeight: 1.2,
                }}
              >
                Аналитика
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.muted, fontWeight: 700, mt: -0.2 }}
              >
                {periodLabel}
              </Typography>
            </Box>
          </Stack>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(e, next) => next && setMode(next)}
            size="small"
            sx={{
              bgcolor: alpha(colors.card2, 0.7),
              borderRadius: "999px",
              p: 0.25,
              border: `1px solid ${alpha(colors.white, 0.08)}`,
              "& .MuiToggleButton-root": {
                border: 0,
                px: 2,
                color: alpha(colors.text, 0.6),
                fontWeight: 950,
                borderRadius: "999px",
                textTransform: "none",
                fontSize: "13px",
                "&.Mui-selected": {
                  color: "#05140C",
                  backgroundColor: colors.primary,
                  "&:hover": { backgroundColor: colors.primary },
                },
              },
            }}
          >
            <ToggleButton value="month">Месяц</ToggleButton>
            <ToggleButton value="year">Год</ToggleButton>
            <ToggleButton value="range">Период</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {isRange && (
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Stack
              direction="column"
              spacing={0.6}
              sx={{ mt: 2.5, maxWidth: 420 }}
            >
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ width: "100%" }}
              >
                <DatePicker
                  value={rangeFrom}
                  onChange={(v) => v?.isValid() && setRangeFrom(v)}
                  format="DD.MM.YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: datePickerSx,
                    },
                  }}
                />

                <Typography
                  sx={{
                    px: 0.25,
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 950,
                    fontSize: 14,
                  }}
                >
                  —
                </Typography>

                <DatePicker
                  value={rangeTo}
                  onChange={(v) => v?.isValid() && setRangeTo(v)}
                  format="DD.MM.YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: datePickerSx,
                    },
                  }}
                />
              </Stack>
            </Stack>
          </LocalizationProvider>
        )}
      </Box>

      {/* KPI GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: { xs: 1.5, md: 2 },
          mb: 4,
        }}
      >
        <KpiCard
          label="Баланс"
          value={formatAmount(totalBalance)}
          accent={COLORS.balance}
          icon={<AccountBalanceWalletOutlinedIcon />}
        />
        <KpiCard
          label="Доходы"
          value={formatAmount(totalIncome)}
          accent={COLORS.income}
          icon={<ArrowCircleUpOutlinedIcon />}
        />
        <KpiCard
          label="Расходы"
          value={formatAmount(totalExpenses)}
          accent={COLORS.expenses}
          icon={<ArrowCircleDownOutlinedIcon />}
        />
        <KpiCard
          label="Сбережения"
          value={`${totalRate}%`}
          sub={formatAmount(totalSavings)}
          accent={COLORS.rate}
          icon={<PercentOutlinedIcon />}
        />
      </Box>

      {/* CHARTS SECTION */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 950, color: colors.text, mb: 1 }}>
          Cashflow
        </Typography>
        <CashflowLegend />
        <Box sx={{ height: 340, width: "100%" }}>
          <BarChart
            height={340}
            xAxis={[
              {
                data: cashflowRows.map((r) => r.label),
                scaleType: "band",
                tickLabelStyle: { fill: WHITE, fontSize: 11, fontWeight: 800 },
              },
            ]}
            yAxis={[
              {
                valueFormatter: axisMoneyFormatter,
                tickLabelStyle: { fill: WHITE, fontSize: 11, fontWeight: 800 },
              },
            ]}
            series={[
              { data: cashflowRows.map((r) => r.income), label: "Доходы", color: COLORS.income },
              { data: cashflowRows.map((r) => r.expenses), label: "Расходы", color: COLORS.expenses },
            ]}
            margin={cashflowMargin}
            sx={{
              "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                stroke: "rgba(255,255,255,0.15)",
              },
              "& .MuiChartsGrid-line": { stroke: "rgba(255,255,255,0.05)" },
            }}
            grid={{ horizontal: true }}
          />
        </Box>
      </Box>

      <Box sx={{ height: 320, width: "100%", mb: 6 }}>
        <LineChart
          height={320}
          xAxis={[
            {
              data: cashflowRows.map((r) => r.label),
              scaleType: "point",
              tickLabelStyle: { fill: WHITE, fontSize: 11, fontWeight: 800 },
            },
          ]}
          yAxis={[
            {
              valueFormatter: axisMoneyFormatter,
              tickLabelStyle: { fill: WHITE, fontSize: 11, fontWeight: 800 },
            },
          ]}
          series={[
            {
              data: cashflowRows.map((r) => r.balance),
              label: "Баланс",
              color: COLORS.balance,
              area: true,
              showMark: true,
            },
          ]}
          margin={balanceMargin}
          sx={{
            "& .MuiAreaElement-root": { fill: "url('#balanceGradient')" },
            "& .MuiLineElement-root": { strokeWidth: 3 },
            "& .MuiMarkElement-root": {
              stroke: COLORS.balance,
              fill: "#0B1220",
              strokeWidth: 2,
              r: 4,
            },
          }}
          slots={{ tooltip: BalancePinnedTooltip }}
        >
          <BalanceAreaGradient id="balanceGradient" color={COLORS.balance} />
        </LineChart>
      </Box>

      {/* TOP CATEGORIES */}
      <Box sx={{ mt: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 950, color: colors.text }}>
            Топ категорий
          </Typography>
          <Tabs
            value={topTab}
            onChange={(e, v) => setTopTab(v)}
            sx={{
              minHeight: 36,
              "& .MuiTab-root": {
                minHeight: 36,
                py: 0.5,
                color: "rgba(255,255,255,0.4)",
                fontWeight: 900,
                textTransform: "none",
              },
              "& .Mui-selected": { color: "#fff !important" },
              "& .MuiTabs-indicator": { bgcolor: COLORS.balance },
            }}
          >
            <Tab label="Расходы" value="expenses" />
            <Tab label="Доходы" value="income" />
          </Tabs>
        </Stack>

        <Box sx={{ height: 280, width: "100%" }}>
          <BarChart
            height={280}
            layout="horizontal"
            yAxis={[
              {
                data: (topTab === "expenses" ? topCatsExpenses : topCatsIncome).map(
                  (x) => x.category
                ),
                scaleType: "band",
                width: topCatsYAxisWidth,
                tickLabelStyle: { fill: WHITE, fontSize: 11, fontWeight: 800 },
              },
            ]}
            xAxis={[
              {
                valueFormatter: axisMoneyFormatter,
                tickLabelStyle: { fill: WHITE, fontSize: 11, fontWeight: 800 },
              },
            ]}
            series={[
              {
                data: (topTab === "expenses" ? topCatsExpenses : topCatsIncome).map(
                  (x) => x.amount
                ),
                color: topTab === "expenses" ? COLORS.expenses : COLORS.income,
              },
            ]}
            margin={topCatsMargin}
            sx={{
              "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                stroke: "rgba(255,255,255,0.15)",
              },
            }}
            grid={{ vertical: true }}
          />
        </Box>
      </Box>
    </PageWrap>
  );
}