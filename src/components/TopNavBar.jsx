import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";

export default function TopNavBar({
  onMenuClick,
  hideDesktopActions = true, // <- новое: по умолчанию скрываем кнопки/имя/выйти
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        borderBottom: "1px solid",
        borderColor: theme.palette.divider,
        backgroundColor: alpha(theme.palette.background.paper, 0.86),
        color: theme.palette.text.primary,
        backdropFilter: "blur(10px)",
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 1 }}>
        {!isDesktop ? (
          <Tooltip title="Меню" placement="bottom">
            <IconButton onClick={onMenuClick} aria-label="Открыть меню">
              <MenuIcon />
            </IconButton>
          </Tooltip>
        ) : null}

        <Typography
          onClick={() => navigate("/")}
          sx={{ flexGrow: 1, fontWeight: 950, cursor: "pointer", userSelect: "none" }}
        >
          FinTrackerPro
        </Typography>

        {/* на десктопе намеренно ничего не показываем */}
        {isDesktop && hideDesktopActions ? null : null}
      </Toolbar>
    </AppBar>
  );
}
