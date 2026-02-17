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
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PaidIcon from "@mui/icons-material/Paid";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import LogoutIcon from "@mui/icons-material/Logout";

import { useAuth } from "../contexts/AuthContext";
import TopNavBar from "../components/TopNavBar";
import AppBackground from "./AppBackground";

const drawerWidth = 272;

export default function AppLayout() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

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

  const colors = {
    drawerBg: alpha("#111B30", 0.95),
    border: alpha("#FFFFFF", 0.10),
    text: "rgba(255,255,255,0.92)",
    muted: "rgba(255,255,255,0.66)",
    primary: "#4F7DFF",
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* отступ под TopNavBar (clipped drawer) */}
      <Toolbar />

      <Box sx={{ px: 2, pb: 1 }}>
        <Typography sx={{ fontWeight: 950, color: colors.text }}>
          Меню
        </Typography>
        <Typography variant="caption" sx={{ color: colors.muted }}>
          {userLabel}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: colors.border }} />

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
                py: { xs: 1.25, sm: 1 },
                color: alpha(colors.text, 0.82),
                "& .MuiListItemIcon-root": {
                  minWidth: 38,
                  color: alpha(colors.text, 0.74),
                },
                "&.Mui-selected": {
                  bgcolor: alpha(colors.primary, 0.18),
                  color: colors.text,
                },
                "&.Mui-selected .MuiListItemIcon-root": { color: colors.text },
                "&:hover": { bgcolor: alpha("#FFFFFF", 0.06) },
              }}
            >
              <ListItemIcon>{it.icon}</ListItemIcon>
              <ListItemText
                primary={it.label}
                primaryTypographyProps={{
                  sx: { fontWeight: 850, fontSize: { xs: 15.5, sm: 14 } },
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
            color: colors.text,
            bgcolor: alpha("#FFFFFF", 0.06),
            border: `1px solid ${colors.border}`,
            "&:hover": { bgcolor: alpha("#FFFFFF", 0.10) },
          }}
        >
          Выйти
        </Button>
      </Box>
    </Box>
  );

  return (
    <AppBackground>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            anchor="left"
            open={!isMdUp && mobileOpen}
            onClose={closeMobile}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
              sx: {
                width: { xs: "88vw", sm: 320 },
                bgcolor: colors.drawerBg,
                borderRight: `1px solid ${colors.border}`,
              },
            }}
            sx={{ display: { xs: "block", md: "none" } }}
          >
            {drawerContent}
          </Drawer>

          {/* Desktop drawer (wide) */}
          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                bgcolor: colors.drawerBg,
                borderRight: `1px solid ${colors.border}`,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <TopNavBar
            onLogout={handleLogout}
            userLabel={userLabel}
            userName={user?.userName}
            onMenuClick={openMobile}
          />

          <Box
            sx={{
              width: "100%",
              minHeight: "calc(100vh - 64px)",
              py: 2.25,
              px: { xs: 1, sm: 2, md: 3 },
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </AppBackground>
  );
}
