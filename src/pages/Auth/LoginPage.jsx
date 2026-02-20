// src/pages/Auth/LoginPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AppBackground from "../../layouts/AppBackground";

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "1096583300191-ecs88krahb9drbhbs873ma4mieb7lihj.apps.googleusercontent.com";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const googleDivRef = useRef(null);

  const afterLoginPath = location.state?.from?.pathname || "/";

  const handleGoogleCallback = useCallback(
    async (response) => {
      try {
        setError("");
        await loginWithGoogle(response.credential);
        navigate(afterLoginPath, { replace: true });
      } catch (err) {
        console.error(err);
        setError("Ошибка входа через Google");
      }
    },
    [loginWithGoogle, navigate, afterLoginPath]
  );

  useEffect(() => {
    if (!window.google?.accounts?.id) return;
    if (!googleDivRef.current || googleDivRef.current.childElementCount > 0) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
    });

    window.google.accounts.id.renderButton(googleDivRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
    });
  }, [handleGoogleCallback]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email: form.email, password: form.password });
      navigate(afterLoginPath, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Неверный email или пароль");
    }
  };

  return (
    <AppBackground
      sx={{
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
        {/* Mobile hero */}
        <Box
          sx={{
            display: { xs: "block", md: "none" },
            borderRadius: 5,
            p: 2.5,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Typography sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 950, fontSize: 22, lineHeight: 1.15 }}>
            FinTrackerPro
          </Typography>
          <Typography sx={{ mt: 0.8, color: "rgba(255,255,255,0.72)", fontSize: 13.5, lineHeight: 1.35 }}>
            Доходы, расходы и норма сбережений — в одном месте.
          </Typography>
        </Box>

        {/* Desktop hero */}
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
          <Typography sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 950, fontSize: 34, lineHeight: 1.1 }}>
            FinTrackerPro
          </Typography>
          <Typography sx={{ mt: 1.25, color: "rgba(255,255,255,0.72)", fontSize: 15, maxWidth: 420 }}>
            Войдите и следите за динамикой по месяцам.
          </Typography>
        </Box>

        {/* Card */}
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
          {/* Шапка */}
          <Box sx={{ mb: 2.5, textAlign: "center" }}>
            <Typography
              component="h1"
              sx={{
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 0.3,
                color: "#111827",
              }}
            >
              Вход
            </Typography>
            <Typography
              sx={{
                mt: 0.8,
                fontSize: 13,
                color: "rgba(15,23,42,0.6)",
              }}
            >
              Войдите в аккаунт, чтобы продолжить.
            </Typography>
          </Box>

          {/* Поля */}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
            <TextField
              margin="dense"
              fullWidth
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <TextField
              margin="dense"
              fullWidth
              label="Пароль"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />

            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
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
              Войти
            </Button>
          </Box>

          {/* Разделитель */}
          <Box
            sx={{
              mt: 1.5,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(15,23,42,0.08)" }} />
            <Typography
              variant="caption"
              sx={{ color: "rgba(15,23,42,0.5)", textTransform: "uppercase" }}
            >
              или
            </Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(15,23,42,0.08)" }} />
          </Box>

          {/* Google */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 340,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div ref={googleDivRef} />
            </Box>
          </Box>

          {/* Низ */}
          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 0.5, color: "rgba(15,23,42,0.7)" }}
          >
            Нет аккаунта?{" "}
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/register")}
              sx={{ fontWeight: 600 }}
            >
              Зарегистрироваться
            </Link>
          </Typography>
        </Paper>
      </Box>
    </AppBackground>
  );
}
