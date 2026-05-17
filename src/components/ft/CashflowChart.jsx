import React, { useCallback, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  CHART_COLORS,
  chartAxisSx,
  fmtAxisShort,
  monthShortLabel,
  withHeadroom,
} from "../../lib/chartTheme";
import SegmentToggle from "./SegmentToggle";

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const fn = () => setMobile(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return mobile;
}

function CashflowLegend({ showIncome, showExpense }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent="flex-end"
      sx={{ mb: 1 }}
    >
      {showIncome && (
        <Stack direction="row" spacing={0.9} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: "4px", bgcolor: CHART_COLORS.income }} />
          <Typography sx={{ color: CHART_COLORS.white, fontWeight: 800, fontSize: 12 }}>
            Доходы
          </Typography>
        </Stack>
      )}
      {showExpense && (
        <Stack direction="row" spacing={0.9} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: "4px", bgcolor: CHART_COLORS.expenses }} />
          <Typography sx={{ color: CHART_COLORS.white, fontWeight: 800, fontSize: 12 }}>
            Расходы
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Cashflow — MUI BarChart в стиле Lovable.
 */
export default function CashflowChart({ rows = [], formatAmount }) {
  const [view, setView] = useState("all");
  const isMobile = useIsMobile();

  const data = useMemo(
    () =>
      [...rows]
        .filter((r) => r?.ym && (r.totalIncome > 0 || r.totalExpenses > 0))
        .sort((a, b) => a.ym.localeCompare(b.ym)),
    [rows]
  );

  const showIncome = view === "all" || view === "income";
  const showExpense = view === "all" || view === "expense";

  const axisMoneyFormatter = useCallback(
    (v) => {
      const num = Number(v) || 0;
      if (isMobile) return fmtAxisShort(num);
      try {
        return formatAmount(num).replace(/\s/g, " ");
      } catch {
        return fmtAxisShort(num);
      }
    },
    [isMobile, formatAmount]
  );

  const cashflowMargin = useMemo(
    () =>
      isMobile
        ? { left: 36, right: 8, top: 12, bottom: 44 }
        : { left: 56, right: 12, top: 12, bottom: 44 },
    [isMobile]
  );

  const series = useMemo(() => {
    const out = [];
    if (showIncome) {
      out.push({
        data: data.map((r) => r.totalIncome || 0),
        label: "Доходы",
        color: CHART_COLORS.income,
      });
    }
    if (showExpense) {
      out.push({
        data: data.map((r) => r.totalExpenses || 0),
        label: "Расходы",
        color: CHART_COLORS.expenses,
      });
    }
    return out;
  }, [data, showIncome, showExpense]);

  const maxVal = useMemo(() => {
    let m = 0;
    data.forEach((r) => {
      if (showIncome) m = Math.max(m, r.totalIncome || 0);
      if (showExpense) m = Math.max(m, r.totalExpenses || 0);
    });
    return withHeadroom(m || 1);
  }, [data, showIncome, showExpense]);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Нет данных для графика.
      </p>
    );
  }

  const chartHeight = isMobile ? 260 : 300;

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <SegmentToggle
          stretch
          value={view}
          onChange={setView}
          options={[
            {
              id: "all",
              label: "Всё",
              activeClass: "bg-white/10 text-foreground border border-border",
            },
            {
              id: "income",
              label: "Доходы",
              activeClass:
                "bg-[#22C55E] text-black shadow-[0_0_20px_rgba(34,197,94,0.35)]",
            },
            {
              id: "expense",
              label: "Расходы",
              activeClass:
                "bg-[#FBBF24] text-black shadow-[0_0_20px_rgba(251,191,36,0.35)]",
            },
          ]}
        />
        <CashflowLegend showIncome={showIncome} showExpense={showExpense} />
      </div>

      <Box
        sx={{
          width: "100%",
          height: chartHeight,
          minWidth: 0,
          borderRadius: "16px",
          bgcolor: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.06)",
          px: { xs: 0.5, sm: 1 },
          pt: 1,
        }}
      >
        <BarChart
          height={chartHeight}
          hideLegend
          xAxis={[
            {
              data: data.map((r) => monthShortLabel(r.ym)),
              scaleType: "band",
              tickSpacing: 12,
              tickLabelStyle: {
                fontSize: isMobile ? 10 : 11,
                fill: CHART_COLORS.white,
                fontWeight: 800,
              },
              categoryGapRatio: data.length <= 2 ? 0.42 : 0.28,
              barGapRatio: 0.14,
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: maxVal,
              tickNumber: isMobile ? 4 : 5,
              valueFormatter: axisMoneyFormatter,
              tickLabelStyle: {
                fontSize: 11,
                fill: CHART_COLORS.white,
                fontWeight: 800,
              },
            },
          ]}
          series={series}
          grid={{ horizontal: true }}
          margin={cashflowMargin}
          sx={{
            ...chartAxisSx,
            "& .MuiBarElement-root": {
              rx: 6,
            },
          }}
        />
      </Box>

      {view === "all" && (
        <div
          className="grid gap-2 sm:gap-3 mt-4"
          style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
        >
          {data.map((row) => {
            const balance = row.totalIncome - row.totalExpenses;
            return (
              <div
                key={`sum-${row.ym}`}
                className="rounded-xl border border-border/80 bg-white/[0.03] px-2 py-2.5 sm:p-3 text-center min-w-0"
              >
                <p className="text-[11px] sm:text-xs font-bold truncate">
                  {monthShortLabel(row.ym)}
                </p>
                <p
                  className="text-[10px] sm:text-xs tabular-nums mt-1"
                  style={{ color: CHART_COLORS.income }}
                >
                  +{formatAmount(row.totalIncome)}
                </p>
                <p
                  className="text-[10px] sm:text-xs tabular-nums"
                  style={{ color: CHART_COLORS.expenses }}
                >
                  −{formatAmount(row.totalExpenses)}
                </p>
                <p
                  className="text-[10px] font-semibold tabular-nums mt-1"
                  style={{
                    color: balance >= 0 ? CHART_COLORS.income : CHART_COLORS.expenses,
                  }}
                >
                  {balance >= 0 ? "+" : ""}
                  {formatAmount(balance)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
