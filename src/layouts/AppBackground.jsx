import React from "react";
import { Box } from "@mui/material";
import { pageBackgroundSx, gridOverlaySx } from "../styles/bankingTokens";

export default function AppBackground({ children, sx }) {
  return (
    <Box
      sx={{
        // берём только фон из pageBackgroundSx
        ...pageBackgroundSx,

        // гарантированно убираем любую "карточку-страницу"
        maxWidth: "100%",
        width: "100%",
        minHeight: "100vh",

        borderRadius: 0,
        boxShadow: "none",
        border: "none",
        margin: 0,
        px: 0,
        py: 0,

        position: "relative",
        overflow: "hidden",

        ...sx,
      }}
    >
      {/* сетка/шум поверх фона, не влияет на границы */}
      <Box sx={{ ...gridOverlaySx, pointerEvents: "none" }} />

      {/* сам контент приложения без дополнительной обёртки-карточки */}
      <Box sx={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}
