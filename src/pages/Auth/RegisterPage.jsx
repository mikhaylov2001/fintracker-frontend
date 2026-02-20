// src/pages/Auth/RegisterPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AppBackground from "../../layouts/AppBackground";

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "1096583300191-ecs88krahb9drbhbs873ma4mieb7lihj.apps.googleusercontent.com";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const googleDivRef = useRef(null);

  const handleGoogleCallback = useCallback(
    async (response) => {
      try {
        setError("");
        await loginWithGoogle(response.credential);
        navigate("/", { replace: true });
      } catch (err) {
        console.error(err);
        setError("Ошибка регистрации через Google");
      }
    },
    [loginWithGoogle, navigate]
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
      text: "signup_with",
    });
  }, [handleGoogleCallback]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Ошибка при регистрации. Попробуйте ещё раз.");
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
            Создай аккаунт и начни вести финансы уже сегодня.
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
            Создай аккаунт
          </Typography>
          <Typography sx={{ mt: 1.25, color: "rgba(255,255,255,0.72)", fontSize: 15, maxWidth: 420 }}>
            Регистрация займёт минуту. Дальше — история по месяцам, баланс и норма сбережений.
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
              Регистрация
            </Typography>
            <Typography
              sx={{
                mt: 0.8,
                fontSize: 13,
                color: "rgba(15,23,42,0.6)",
              }}
            >
              Создайте аккаунт, чтобы отслеживать финансы.
            </Typography>
          </Box>

          {/* Поля */}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
            <TextField
              margin="dense"
              fullWidth
              label="Имя"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
            />
            <TextField
              margin="dense"
              fullWidth
              label="Фамилия"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              autoComplete="family-name"
            />
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
              autoComplete="new-password"
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
              Зарегистрироваться
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
                maxWidth: 420,
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
            Уже есть аккаунт?{" "}
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/login")}
              sx={{ fontWeight: 600 }}
            >
              Войти
            </Link>
          </Typography>
        </Paper>
      </Box>
    </AppBackground>
  );
}
