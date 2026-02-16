import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import { alpha } from "@mui/material/styles";
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
    <AppBackground
      sx={{
        bgcolor: "#F3F5F9",
        backgroundImage: `
          linear-gradient(180deg, #FFFFFF 0%, #F3F5F9 55%, #EEF2F7 100%),
          radial-gradient(900px 520px at 18% 0%, ${alpha("#1D4ED8", 0.10)} 0%, transparent 62%),
          radial-gradient(900px 520px at 88% 0%, ${alpha("#0F172A", 0.06)} 0%, transparent 65%)
        `,
      }}
    >
      <TopNavBar
        onLogout={handleLogout}
        userLabel={user?.userName || user?.email || "Пользователь"}
      />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </AppBackground>
  );
}
