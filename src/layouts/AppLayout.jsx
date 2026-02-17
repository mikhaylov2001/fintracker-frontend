// src/layouts/AppLayout.jsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import TopNavBar from "../components/TopNavBar";
import AppBackground from "./AppBackground";

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBackground>
      <TopNavBar
        onLogout={handleLogout}
        userLabel={user?.userName || user?.email || "Пользователь"}
        userName={user?.userName}
      />
      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 64px)",
          py: 3,
          px: { xs: 1, sm: 2, md: 3 },
          bgcolor: "transparent", // важно!
        }}
      >
        <Outlet />
      </Box>
    </AppBackground>
  );
}
