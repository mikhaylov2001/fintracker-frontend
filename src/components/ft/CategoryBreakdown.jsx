import React, { useCallback, useMemo } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  CHART_COLORS,
  chartAxisSx,
  fmtAxisShort,
  withHeadroom,
} from "../../lib/chartTheme";
import SegmentToggle from "./SegmentToggle";

function useIsMobile() {
  const [mobile, setMobile] = React.useState(() =>
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

/**
 * Топ категорий — горизонтальный BarChart MUI, стиль Lovable.
 */
export default function CategoryBreakdown({
  expenseCategories = [],
  incomeCategories = [],
  formatAmount,
  kind,
  onKindChange,
  loading = false,
}) {
  const isExpense = kind === "expense";
  const categories = isExpense ? expenseCategories : incomeCategories;
  const accent = isExpense ? CHART_COLORS.expenses : CHART_COLORS.income;
  const isMobile = useIsMobile();

  const total = useMemo(
    () => categories.reduce((s, c) => s + c.amount, 0),
    [categories]
  );

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

  const chartHeight = Math.max(200, categories.length * (isMobile ? 36 : 42) + 48);
  const topCatsYAxisWidth = isMobile ? 88 : 120;
  const topCatsMargin = isMobile
    ? { left: 4, right: 8, top: 8, bottom: 24 }
    : { left: 8, right: 12, top: 8, bottom: 24 };

  const maxX = useMemo(() => {
    const m = categories[0]?.amount || 0;
    return withHeadroom(m || 1);
  }, [categories]);

  return (
    <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 h-full flex flex-col min-w-0">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "flex-start" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography
            component="h2"
            sx={{ fontWeight: 800, fontSize: "1.125rem", color: "inherit", mb: 0.5 }}
          >
            Топ категорий
          </Typography>
          <Typography sx={{ fontSize: 12, color: "rgba(241,245,249,0.55)" }}>
            {isExpense ? "Куда уходят деньги" : "Откуда приходят"} за выбранный период
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {!loading && categories.length > 0 && (
            <Chip
              label={`Всего: ${formatAmount(total)}`}
              size="small"
              sx={{
                borderRadius: 999,
                border: 0,
                color: accent,
                bgcolor: alpha(accent, 0.14),
                fontWeight: 800,
                fontSize: 11,
              }}
            />
          )}
          <SegmentToggle
            value={kind}
            onChange={onKindChange}
            options={[
              {
                id: "expense",
                label: "Расходы",
                activeClass:
                  "bg-[#FBBF24] text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]",
              },
              {
                id: "income",
                label: "Доходы",
                activeClass:
                  "bg-[#22C55E] text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]",
              },
            ]}
          />
        </Stack>
      </Stack>

      {loading ? (
        <Typography sx={{ fontSize: 14, color: "rgba(241,245,249,0.55)", py: 6, textAlign: "center" }}>
          Загрузка категорий…
        </Typography>
      ) : categories.length === 0 ? (
        <Typography sx={{ fontSize: 14, color: "rgba(241,245,249,0.55)", py: 6, textAlign: "center" }}>
          {isExpense ? "Нет расходов за период." : "Нет доходов за период."}
        </Typography>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: chartHeight,
            minWidth: 0,
            flex: 1,
            borderRadius: "16px",
            bgcolor: "rgba(0,0,0,0.18)",
            border: "1px solid rgba(255,255,255,0.06)",
            px: { xs: 0.5, sm: 1 },
            pt: 1,
          }}
        >
          <BarChart
            height={chartHeight}
            layout="horizontal"
            hideLegend
            yAxis={[
              {
                data: categories.map((c) => c.name),
                scaleType: "band",
                width: topCatsYAxisWidth,
                tickLabelStyle: {
                  fontSize: isMobile ? 10 : 11,
                  fill: CHART_COLORS.white,
                  fontWeight: 800,
                },
              },
            ]}
            xAxis={[
              {
                min: 0,
                max: maxX,
                valueFormatter: axisMoneyFormatter,
                tickLabelStyle: {
                  fontSize: 11,
                  fill: CHART_COLORS.white,
                  fontWeight: 800,
                },
              },
            ]}
            series={[
              {
                data: categories.map((c) => c.amount),
                label: "Сумма",
                color: accent,
              },
            ]}
            grid={{ vertical: true }}
            margin={topCatsMargin}
            sx={{
              ...chartAxisSx,
              "& .MuiBarElement-root": { rx: 5 },
            }}
          />
        </Box>
      )}
    </section>
  );
}
