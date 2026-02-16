import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import AppBackground from "./AppBackground";

const drawerWidth = 260;

export default function AppLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <AppBackground sx={{ py: { xs: 2, md: 2.5 } }}>
      <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
        {/* Top bar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: "rgba(15,23,42,0.72)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => setOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              sx={{ fontWeight: 950, flexGrow: 1, color: "rgba(248,250,252,0.95)" }}
            >
              FinTrackerPro
            </Typography>

            {/* Верхние кнопки (замени/добавь свои) */}
            <Button
              onClick={() => navigate("/income")}
              sx={{ color: "rgba(248,250,252,0.9)", display: { xs: "none", sm: "inline-flex" } }}
            >
              Доходы
            </Button>
            <Button
              onClick={() => navigate("/expenses")}
              sx={{ color: "rgba(248,250,252,0.9)", display: { xs: "none", sm: "inline-flex" } }}
            >
              Расходы
            </Button>
            <Button
              onClick={() => navigate("/analytics")}
              sx={{ color: "rgba(248,250,252,0.9)", display: { xs: "none", sm: "inline-flex" } }}
            >
              Аналитика
            </Button>
          </Toolbar>
        </AppBar>

        {/* Sidebar (desktop) */}
        <Box
          sx={{
            width: { xs: 0, md: drawerWidth },
            flexShrink: 0,
            display: { xs: "none", md: "block" },
          }}
        >
          <Box
            sx={{
              position: "fixed",
              top: 64, // высота AppBar
              left: 0,
              width: drawerWidth,
              height: "calc(100vh - 64px)",
              px: 2,
              py: 2,
            }}
          >
            <Box
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.10)",
                bgcolor: "rgba(15,23,42,0.60)",
                backdropFilter: "blur(14px)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 950, color: "rgba(248,250,252,0.95)" }}>
                  Навигация
                </Typography>
                <Typography sx={{ mt: 0.25, color: "rgba(148,163,184,0.95)" }} variant="body2">
                  Финансовая свобода
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

              <List sx={{ py: 0 }}>
                <ListItemButton onClick={() => navigate("/income")}>
                  <ListItemText
                    primary="Доходы"
                    primaryTypographyProps={{ sx: { color: "rgba(248,250,252,0.9)", fontWeight: 800 } }}
                  />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/expenses")}>
                  <ListItemText
                    primary="Расходы"
                    primaryTypographyProps={{ sx: { color: "rgba(248,250,252,0.9)", fontWeight: 800 } }}
                  />
                </ListItemButton>

                <ListItemButton onClick={() => navigate("/analytics")}>
                  <ListItemText
                    primary="Аналитика"
                    primaryTypographyProps={{ sx: { color: "rgba(248,250,252,0.9)", fontWeight: 800 } }}
                  />
                </ListItemButton>
              </List>
            </Box>
          </Box>
        </Box>

        {/* Sidebar (mobile drawer) */}
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              bgcolor: "rgba(2,6,23,0.92)",
              color: "rgba(248,250,252,0.92)",
              borderRight: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 950 }}>FinTrackerPro</Typography>
            <Typography sx={{ color: "rgba(148,163,184,0.95)" }} variant="body2">
              Финансовая свобода
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

          <List>
            <ListItemButton onClick={() => (setOpen(false), navigate("/income"))}>
              <ListItemText primary="Доходы" />
            </ListItemButton>
            <ListItemButton onClick={() => (setOpen(false), navigate("/expenses"))}>
              <ListItemText primary="Расходы" />
            </ListItemButton>
            <ListItemButton onClick={() => (setOpen(false), navigate("/analytics"))}>
              <ListItemText primary="Аналитика" />
            </ListItemButton>
          </List>
        </Drawer>

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: "100%",
            pt: "64px", // чтобы контент не оказался под AppBar
            pl: { xs: 0, md: `${drawerWidth}px` }, // чтобы не залезало под сайдбар
          }}
        >
          {/* Тут рендерится DashboardPage и остальные */}
          <Outlet />
        </Box>
      </Box>
    </AppBackground>
  );
}
