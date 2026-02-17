import React, { useMemo } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Stack,
  Button,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";
import { useLocation, useNavigate } from "react-router-dom";

export default function TopNavBar({
  showDashboard = true,
  showAnalytics = true,
  showLogout = true,
  onLogout,
  userLabel = "Пользователь",
  userName,
  onMenuClick,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const dashboardPath = userName ? `/u/${userName}` : "/";
  const isDashboardActive = () => pathname.startsWith("/u/") || pathname === "/";

  const items = useMemo(() => {
    const arr = [];
    if (showDashboard) arr.push({ label: "Дашборд", path: dashboardPath, match: "dashboard" });
    arr.push({ label: "Доходы", path: "/income" });
    arr.push({ label: "Расходы", path: "/expenses" });
    if (showAnalytics) arr.push({ label: "Аналитика", path: "/analytics" });
    return arr;
  }, [showDashboard, showAnalytics, dashboardPath]);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        borderBottom: "1px solid",
        borderColor: theme.palette.divider,
        backgroundColor: alpha(theme.palette.background.paper, 0.86),
        color: theme.palette.text.primary,
        backdropFilter: "blur(8px)",
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 1 }}>
        {!isDesktop ? (
          <Tooltip title="Меню" placement="bottom">
            <IconButton onClick={onMenuClick} aria-label="Открыть меню">
              <MenuIcon />
            </IconButton>
          </Tooltip>
        ) : null}

        <Typography
          onClick={() => navigate(dashboardPath)}
          sx={{ flexGrow: 1, fontWeight: 900, cursor: "pointer", userSelect: "none" }}
        >
          FinTrackerPro
        </Typography>

        {isDesktop ? (
          <Stack direction="row" spacing={1} alignItems="center">
            {items.map((x) => {
              const basePath = x.path.split("?")[0];
              const active = x.match === "dashboard" ? isDashboardActive() : pathname === basePath;

              return (
                <Button
                  key={x.path}
                  onClick={() => navigate(x.path)}
                  variant={active ? "contained" : "text"}
                >
                  {x.label}
                </Button>
              );
            })}

            <Chip
              label={userLabel}
              sx={{
                maxWidth: 240,
                bgcolor: alpha("#FFFFFF", 0.06),
                border: `1px solid ${alpha("#FFFFFF", 0.10)}`,
                "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
              }}
            />

            {showLogout ? (
              <Button onClick={onLogout} variant="text" color="inherit">
                Выйти
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Toolbar>
    </AppBar>
  );
}
