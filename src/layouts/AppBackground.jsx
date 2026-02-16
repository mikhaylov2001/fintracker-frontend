import React from "react";
import { Box } from "@mui/material";

export default function AppBackground({ children, sx }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#0B1220",
        backgroundImage:
          "radial-gradient(1200px 600px at 15% 10%, rgba(34,197,94,0.18), transparent 60%)," +
          "radial-gradient(900px 500px at 85% 20%, rgba(99,102,241,0.22), transparent 55%)," +
          "radial-gradient(800px 500px at 50% 90%, rgba(249,115,22,0.14), transparent 55%)," +
          "linear-gradient(180deg, #0B1220 0%, #070B14 100%)",
        ...sx,
      }}
    >
      {/* сетка */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.22,
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          mixBlendMode: "soft-light",
        }}
      />

      {/* blurred-circles */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          "&:before, &:after": {
            content: '""',
            position: "absolute",
            width: { xs: 240, sm: 320, md: 420 },
            height: { xs: 240, sm: 320, md: 420 },
            borderRadius: 999,
            filter: "blur(38px)",
            opacity: 0.75,
          },
          "&:before": {
            left: { xs: -80, md: -120 },
            top: { xs: -80, md: -120 },
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.55), rgba(34,197,94,0) 65%)",
          },
          "&:after": {
            right: { xs: -90, md: -130 },
            bottom: { xs: -90, md: -130 },
            background:
              "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), rgba(99,102,241,0) 65%)",
          },
        }}
      />

      {/* контент поверх фона */}
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
