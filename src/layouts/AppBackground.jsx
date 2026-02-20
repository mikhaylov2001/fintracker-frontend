// src/layouts/AppBackground.jsx
import React from "react";
import { Box } from "@mui/material";
import { pageBackgroundSx, gridOverlaySx } from "../styles/bankingTokens";

export default function AppBackground({ children, sx }) {
  return (
    <Box
      sx={{
        // базовый фон приложения
        ...pageBackgroundSx,

        // убираем эффект вложенной страницы
        maxWidth: "100%",
        borderRadius: 0,
        boxShadow: "none",
        border: "none",
        margin: 0,
        px: 0,
        py: 0,

        // растягиваем фон на весь экран
        minHeight: "100vh",
        width: "100%",

        position: "relative",
        overflow: "hidden",

        ...sx,
      }}
    >
      {/* сетка поверх фона, без влияния на границы */}
      <Box sx={{ ...gridOverlaySx, pointerEvents: "none" }} />

      {/* контент приложения без дополнительной карточки */}
      <Box sx={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}
