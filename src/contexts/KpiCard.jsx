import React, { useCallback, memo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { bankingColors as colors, surfaceOutlinedSx } from "../styles/bankingTokens";

const KpiCard = memo(function KpiCard({ label, value, sub, icon, accent, onClick }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <Box
      component="div"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      sx={{
        ...surfaceOutlinedSx,
        height: "100%",
        minHeight: { xs: 96, sm: 104, md: 116 },
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        borderColor: alpha(accent, 0.34),
        display: "flex",
        flexDirection: "column",
        p: { xs: 1.5, md: 2 },
        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(accent, 0.20)} 0%, transparent 62%)`,
          pointerEvents: "none",
        },
        "@media (hover: hover) and (pointer: fine)": onClick
          ? {
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 22px 70px rgba(0,0,0,0.58)",
                borderColor: alpha(accent, 0.58),
              },
            }
          : {},
      }}
    >
      <Stack direction="row" spacing={1.1} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            width: { xs: 30, md: 34 },
            height: { xs: 30, md: 34 },
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(accent, 0.14),
            border: `1px solid ${alpha(accent, 0.28)}`,
            flex: "0 0 auto",
          }}
        >
          {icon
            ? React.cloneElement(icon, {
                sx: { fontSize: { xs: 17, md: 18 }, color: alpha(accent, 0.98) },
              })
            : null}
        </Box>

        <Typography
          variant="overline"
          sx={{
            color: colors.muted,
            fontWeight: 950,
            letterSpacing: 0.55,
            lineHeight: 1.1,
            minWidth: 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: { xs: 2, sm: 1 },
            overflow: "hidden",
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        variant="h5"
        sx={{
          mt: { xs: 0.7, md: 0.9 },
          fontWeight: 950,
          color: colors.text,
          lineHeight: 1.05,
          letterSpacing: -0.25,
          fontSize: { xs: "1.15rem", sm: "1.22rem", md: "1.35rem" },
          position: "relative",
          zIndex: 1,
        }}
      >
        {value}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          color: colors.muted,
          display: { xs: "none", md: "block" },
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          position: "relative",
          zIndex: 1,
        }}
      >
        {sub && String(sub).trim() ? sub : "\u00A0"}
      </Typography>
    </Box>
  );
});

export default KpiCard;
