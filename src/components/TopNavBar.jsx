import React, { useMemo, useState } from 'react';
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
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, useNavigate } from 'react-router-dom';

const COLORS = {
  income: '#22C55E',
  expenses: '#F97316',
  analytics: '#6366F1',
  danger: '#EF4444',
  dashboard: '#334155',
};

const navBtnSx = (color, active = false) => ({
  borderRadius: 999,
  px: 2.2,
  py: 0.9,
  fontWeight: 900,
  letterSpacing: 0.3,
  border: '1px solid',
  textTransform: 'uppercase',
  borderColor: alpha(color, active ? 0.55 : 0.24),
  color,
  backgroundColor: alpha(color, active ? 0.14 : 0.06),
  '&:hover': {
    borderColor: alpha(color, 0.6),
    backgroundColor: alpha(color, 0.12),
  },
});

export default function TopNavBar({
  showDashboard = true,
  showAnalytics = true,
  showLogout = true,
  onLogout,
  userLabel = 'Пользователь',
  userName,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);

  const dashboardPath = userName ? `/u/${userName}` : '/';
  const isDashboardActive = () => pathname.startsWith('/u/');

  const items = useMemo(() => {
    const arr = [];

    if (showDashboard) {
      arr.push({
        label: 'Дашборд',
        path: dashboardPath,
        color: COLORS.dashboard,
        match: 'dashboard',
      });
    }

    // КНОПКИ ведут на добавление
    arr.push({ label: 'Доходы', path: '/income?new=1', color: COLORS.income });
    arr.push({ label: 'Расходы', path: '/expenses?new=1', color: COLORS.expenses });

    if (showAnalytics) {
      arr.push({
        label: 'Аналитика',
        path: '/analytics',
        color: COLORS.analytics,
      });
    }

    return arr;
  }, [showDashboard, showAnalytics, dashboardPath]);

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  const iOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const appBarBg = alpha(theme.palette.background.paper, 0.75);
  const appBarBorder = theme.palette.divider;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: appBarBorder,
          backdropFilter: 'blur(10px)',
          backgroundColor: appBarBg,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <Typography
            onClick={() => navigate(dashboardPath)}
            sx={{
              flexGrow: 1,
              fontWeight: 900,
              letterSpacing: 0.2,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            FinTrackerPro
          </Typography>

          {isDesktop ? (
            <Stack direction="row" spacing={1} alignItems="center">
              {items.map((x) => {
                const basePath = x.path.split('?')[0];
                const active =
                  x.match === 'dashboard' ? isDashboardActive() : pathname === basePath;

                return (
                  <Button
                    key={x.path}
                    onClick={() => navigate(x.path)}
                    variant="outlined"
                    sx={navBtnSx(x.color, active)}
                  >
                    {x.label}
                  </Button>
                );
              })}

              {showLogout ? (
                <Button
                  onClick={onLogout}
                  variant="outlined"
                  sx={navBtnSx(COLORS.danger, false)}
                >
                  Выйти
                </Button>
              ) : null}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Меню" placement="bottom">
                <IconButton
                  onClick={() => setOpen(true)}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.55),
                  }}
                  aria-label="Открыть меню"
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <SwipeableDrawer
        anchor="right"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        disableDiscovery={iOS}
        PaperProps={{
          sx: {
            width: 292,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <Typography sx={{ fontWeight: 900 }}>Меню</Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
            <Chip
              label={userLabel}
              sx={{
                borderRadius: 999,
                bgcolor: alpha(theme.palette.text.primary, 0.06),
                color: alpha(theme.palette.text.primary, 0.85),
                fontWeight: 700,
                maxWidth: 240,
                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
              }}
            />
          </Stack>
        </Box>

        <Divider />

        <List sx={{ py: 0 }}>
          {items.map((x) => {
            const basePath = x.path.split('?')[0];
            const active =
              x.match === 'dashboard' ? isDashboardActive() : pathname === basePath;

            return (
              <ListItemButton
                key={x.path}
                selected={active}
                onClick={() => go(x.path)}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  '&.Mui-selected': { bgcolor: alpha(x.color, 0.12) },
                  '&.Mui-selected:hover': { bgcolor: alpha(x.color, 0.16) },
                }}
              >
                <ListItemText
                  primary={x.label}
                  primaryTypographyProps={{
                    sx: {
                      fontWeight: 850,
                      color: active ? x.color : theme.palette.text.primary,
                    },
                  }}
                />
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
                sx={navBtnSx(COLORS.danger, false)}
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
