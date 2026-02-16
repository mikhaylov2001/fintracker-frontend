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
        bgcolor: "#F6F7FB",
        backgroundImage: `
          radial-gradient(1100px 520px at 10% 0%, ${alpha("#60A5FA", 0.16)} 0%, transparent 60%),
          radial-gradient(1100px 520px at 90% 0%, ${alpha("#A5B4FC", 0.16)} 0%, transparent 60%),
          radial-gradient(900px 520px at 50% 110%, ${alpha("#22C55E", 0.06)} 0%, transparent 55%),
          linear-gradient(180deg, #FFFFFF 0%, #F6F7FB 55%, #EEF2FF 100%)
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
