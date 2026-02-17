import React from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function AppBackground({ children, sx }) {
  const bg0 = "#0F172A";
  const bg1 = "#111C33";
  const primary = "#4F7DFF";
  const accent = "#60A5FA";
  const success = "#2DD4BF";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor: bg0,
        backgroundImage: `
          radial-gradient(900px 520px at 15% 12%, ${alpha(primary, 0.14)} 0%, transparent 55%),
          radial-gradient(900px 520px at 85% 18%, ${alpha(accent, 0.10)} 0%, transparent 55%),
          radial-gradient(900px 520px at 55% 90%, ${alpha(success, 0.08)} 0%, transparent 55%),
          linear-gradient(180deg, ${bg1} 0%, ${bg0} 100%)
        `,
        ...sx,
      }}
    >
      {/* лёгкая сетка */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.06,
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          mixBlendMode: "soft-light",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, width: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}
