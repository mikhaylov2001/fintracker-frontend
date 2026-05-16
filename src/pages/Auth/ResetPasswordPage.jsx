import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import AppBackground from "../../layouts/AppBackground";
import {
  authHeroSx,
  authPaperSx,
  authTitleSx,
  authSubtitleSx,
  authHeroTitleSx,
  authHeroTextSx,
  authPrimaryButtonSx,
} from "../../styles/authUi";

import { confirmPasswordReset } from "../../api/passwordResetApi";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPasswordPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get("token") || "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <AppBackground
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 2,
        }}
      >
        <Typography
          sx={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Некорректная или устаревшая ссылка для восстановления пароля.
        </Typography>
      </AppBackground>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!password || password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов");
      return;
    }
    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      setStatus("Пароль успешно изменён. Сейчас перенаправим на страницу входа...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setError(
        "Ссылка недействительна или срок её действия истёк. Попробуйте запросить восстановление ещё раз."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.25fr 0.9fr" },
          gap: { xs: 2, md: 3 },
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            ...authHeroSx,
            p: 4,
          }}
        >
          <Typography sx={{ ...authHeroTitleSx, fontSize: 32, lineHeight: 1.1 }}>
            Установка нового пароля
          </Typography>
          <Typography
            sx={{
              mt: 1.25,
              ...authHeroTextSx,
              fontSize: 15,
              maxWidth: 420,
            }}
          >
            Придумайте новый надёжный пароль для входа в FinTracker.
          </Typography>
        </Box>

        <Paper elevation={0} sx={authPaperSx}>
          <Box sx={{ mb: 2.5, textAlign: "center" }}>
            <Typography component="h1" sx={authTitleSx}>
              Новый пароль
            </Typography>
            <Typography
              sx={authSubtitleSx}
            >
              Введите новый пароль и подтвердите его.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
            <TextField
              margin="dense"
              fullWidth
              label="Новый пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              fullWidth
              label="Повторите пароль"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />

            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            {status && (
              <Typography variant="body2" sx={{ mt: 1, ...authSubtitleSx }}>
                {status}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ ...authPrimaryButtonSx, textTransform: "none", fontSize: 15 }}
            >
              {loading ? "Сохраняем..." : "Сохранить пароль"}
            </Button>
          </Box>

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 2, ...authSubtitleSx }}
          >
            Вспомнили пароль?{" "}
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/login")}
              sx={{ fontWeight: 600 }}
            >
              Вернуться ко входу
            </Link>
          </Typography>
        </Paper>
      </Box>
    </AppBackground>
  );
}
