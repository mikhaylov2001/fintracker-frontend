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
        bgcolor: "#0B1220",
        backgroundImage: `
          radial-gradient(900px 450px at 12% 0%, ${alpha("#60A5FA", 0.16)} 0%, transparent 55%),
          radial-gradient(900px 450px at 88% 0%, ${alpha("#A78BFA", 0.16)} 0%, transparent 55%)
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
