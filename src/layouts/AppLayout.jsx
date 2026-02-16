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
        bgcolor: "#FBFAFF",
        backgroundImage: `
          radial-gradient(1050px 540px at 14% 0%, ${alpha("#A78BFA", 0.24)} 0%, transparent 62%),
          radial-gradient(980px 520px at 88% 0%, ${alpha("#60A5FA", 0.14)} 0%, transparent 60%),
          radial-gradient(900px 560px at 50% 112%, ${alpha("#F472B6", 0.10)} 0%, transparent 55%),
          linear-gradient(180deg, #FFFFFF 0%, #FBFAFF 55%, #F5F3FF 100%)
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
