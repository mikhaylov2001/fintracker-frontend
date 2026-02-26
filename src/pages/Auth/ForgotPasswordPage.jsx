import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import AppBackground from "../../layouts/AppBackground";
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
        {/* Левая колонка */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            borderRadius: 5,
            p: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Typography
            sx={{
              color: "rgba(255,255,255,0.9)",
              fontWeight: 950,
              fontSize: 32,
              lineHeight: 1.1,
            }}
          >
            Установка нового пароля
          </Typography>
          <Typography
            sx={{
              mt: 1.25,
              color: "rgba(255,255,255,0.72)",
              fontSize: 15,
              maxWidth: 420,
            }}
          >
            Придумайте новый надёжный пароль для входа в FinTracker.
          </Typography>
        </Box>

        {/* Карточка формы */}
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, md: 4 },
            width: "100%",
            maxWidth: 420,
            mx: "auto",
            borderRadius: 5,
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,244,255,0.98))",
            boxShadow:
              "0 18px 45px rgba(15,23,42,0.42), 0 0 0 1px rgba(15,23,42,0.06)",
          }}
        >
          <Box sx={{ mb: 2.5, textAlign: "center" }}>
            <Typography
              component="h1"
              sx={{
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 0.3,
                color: "#111827",
              }}
            >
              Новый пароль
            </Typography>
            <Typography
              sx={{
                mt: 0.8,
                fontSize: 13,
                color: "rgba(15,23,42,0.6)",
              }}
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
              <Typography variant="body2" sx={{ mt: 1, color: "rgba(15,23,42,0.7)" }}>
                {status}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                mt: 2.5,
                mb: 1.5,
                borderRadius: 999,
                py: 1.1,
                fontWeight: 800,
                textTransform: "none",
                fontSize: 15,
              }}
            >
              {loading ? "Сохраняем..." : "Сохранить пароль"}
            </Button>
          </Box>

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 2, color: "rgba(15,23,42,0.7)" }}
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
