import React, { useMemo, useState, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../contexts/AuthContext";
import TopNavBar from "../components/TopNavBar";
import AppBackground from "./AppBackground";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PaidIcon from "@mui/icons-material/Paid";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import LogoutIcon from "@mui/icons-material/Logout";

import { bankingColors } from "../styles/bankingTokens";

const drawerWidth = 272;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const userLabel = user?.userName || user?.email || "Пользователь";
  const dashTo = user?.userName ? `/u/${user.userName}` : "/";

  const navItems = useMemo(
    () => [
      { label: "Дашборд", icon: <DashboardIcon />, to: dashTo, match: (p) => p.startsWith("/u/") },
      { label: "Доходы", icon: <PaidIcon />, to: "/income", match: (p) => p.startsWith("/income") },
      { label: "Расходы", icon: <ReceiptLongIcon />, to: "/expenses", match: (p) => p.startsWith("/expenses") },
      { label: "Аналитика", icon: <QueryStatsIcon />, to: "/analytics", match: (p) => p.startsWith("/analytics") },
    ],
    [dashTo]
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const drawerPaperSx = {
    bgcolor: alpha(bankingColors.card, 0.96),
    borderRight: `1px solid ${bankingColors.border2}`,
    backdropFilter: "blur(10px)",
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar />

      <Box sx={{ px: 2, pb: 1 }}>
        <Typography sx={{ fontWeight: 950, color: bankingColors.text }}>Меню</Typography>
        <Typography variant="caption" sx={{ color: bankingColors.muted }}>
          {userLabel}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: bankingColors.border2 }} />

      <List sx={{ p: 1.25, flex: 1 }}>
        {navItems.map((it) => {
          const selected = it.match(location.pathname);

          return (
            <ListItemButton
              key={it.label}
              selected={selected}
              onClick={() => {
                navigate(it.to);
                closeMobile();
              }}
              sx={{
                borderRadius: 3,
                mb: 0.75,
                py: { xs: 1.15, sm: 1 },
                color: alpha(bankingColors.text, 0.90),

                "& .MuiListItemIcon-root": {
                  minWidth: 38,
                  color: alpha(bankingColors.text, 0.70),
                },

                "&.Mui-selected": {
                  bgcolor: alpha("#FFFFFF", 0.06),
                  border: `1px solid ${alpha("#FFFFFF", 0.12)}`,
                },
                "&.Mui-selected .MuiListItemIcon-root": {
                  color: bankingColors.primary,
                },

                "&:hover": { bgcolor: alpha("#FFFFFF", 0.05) },
              }}
            >
              <ListItemIcon>{it.icon}</ListItemIcon>
              <ListItemText
                primary={it.label}
                primaryTypographyProps={{
                  sx: { fontWeight: 850, fontSize: { xs: 15, sm: 14 } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 1.25 }}>
        <Button
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 3,
            color: bankingColors.text,
            bgcolor: alpha(bankingColors.primary, 0.14),
            border: `1px solid ${bankingColors.border2}`,
            "&:hover": { bgcolor: alpha(bankingColors.primary, 0.18) },
          }}
        >
          Выйти
        </Button>
      </Box>
    </Box>
  );

  return (
    <AppBackground>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",

          // блокируем горизонтальный свайп/скролл между страницами
          overflowX: "hidden",
          touchAction: "pan-y",
        }}
      >
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={closeMobile}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
              sx: {
                width: { xs: "88vw", sm: 320 },
                ...drawerPaperSx,
              },
            }}
            sx={{ display: { xs: "block", md: "none" } }}
          >
            {drawerContent}
          </Drawer>

          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                ...drawerPaperSx,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <TopNavBar onMenuClick={openMobile} />

          <Box
            sx={{
              width: "100%",
              minHeight: "calc(100vh - 64px)",
              py: 2.25,
              px: { xs: 1, sm: 2, md: 3 },

              // на всякий случай дублируем и на контент
              overflowX: "hidden",
              touchAction: "pan-y",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </AppBackground>
  );
}
