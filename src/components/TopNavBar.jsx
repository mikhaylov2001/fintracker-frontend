import React, { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Stack,
  Button,
  IconButton,
  SwipeableDrawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Box,
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
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(false);

  const dashboardPath = userName ? `/u/${userName}` : "/";
  const isDashboardActive = () => pathname.startsWith("/u/") || pathname === "/";

  const items = useMemo(() => {
    const arr = [];

    if (showDashboard) arr.push({ label: "Дашборд", path: dashboardPath, match: "dashboard" });

    // как у тебя было: ведут на добавление
    arr.push({ label: "Доходы", path: "/income?new=1" });
    arr.push({ label: "Расходы", path: "/expenses?new=1" });

    if (showAnalytics) arr.push({ label: "Аналитика", path: "/analytics" });

    return arr;
  }, [showDashboard, showAnalytics, dashboardPath]);

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  const iOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: theme.palette.divider,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          color: theme.palette.text.primary,
          backdropFilter: "blur(8px)",
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <Typography
            onClick={() => navigate(dashboardPath)}
            sx={{ flexGrow: 1, fontWeight: 800, cursor: "pointer", userSelect: "none" }}
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

              {showLogout ? (
                <Button onClick={onLogout} variant="text" color="inherit">
                  Выйти
                </Button>
              ) : null}
            </Stack>
          ) : (
            <Tooltip title="Меню" placement="bottom">
              <IconButton onClick={() => setOpen(true)} aria-label="Открыть меню">
                <MenuIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      <SwipeableDrawer
        anchor="right"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        disableDiscovery={iOS}
        PaperProps={{ sx: { width: 292 } }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <Typography sx={{ fontWeight: 800 }}>Меню</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
            <Chip
              label={userLabel}
              sx={{
                maxWidth: 240,
                "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
              }}
            />
          </Stack>
        </Box>

        <Divider />

        <List sx={{ py: 0 }}>
          {items.map((x) => {
            const basePath = x.path.split("?")[0];
            const active = x.match === "dashboard" ? isDashboardActive() : pathname === basePath;

            return (
              <ListItemButton key={x.path} selected={active} onClick={() => go(x.path)}>
                <ListItemText primary={x.label} primaryTypographyProps={{ sx: { fontWeight: 700 } }} />
              </ListItemButton>
            );
          })}
        </List>

        {showLogout ? (
          <>
            <Divider sx={{ mt: 1 }} />
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                onClick={() => {
                  setOpen(false);
                  onLogout?.();
                }}
                variant="outlined"
                color="inherit"
              >
                Выйти
              </Button>
            </Box>
          </>
        ) : null}
      </SwipeableDrawer>
    </>
  );
}
