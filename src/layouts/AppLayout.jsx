import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import AppBackground from "./AppBackground";

export default function AppLayout() {
  return (
    <AppBackground sx={{ py: { xs: 2.5, md: 3 } }}>
      {/* Тут будет рендериться DashboardPage и другие страницы из вложенных роутов */}
      <Box sx={{ width: "100%" }}>
        <Outlet />
      </Box>
    </AppBackground>
  );
}
