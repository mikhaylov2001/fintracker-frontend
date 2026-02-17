import React from "react";
import { Box } from "@mui/material";
import { pageBackgroundSx, gridOverlaySx } from "../styles/bankingTokens";

export default function AppBackground({ children, sx }) {
  return (
    <Box sx={{ ...pageBackgroundSx, ...sx }}>
      <Box sx={gridOverlaySx} />
      <Box sx={{ position: "relative", zIndex: 1, width: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}
