// src/pages/Auth/LoginPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

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
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)", // под TopNavBar
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
            Войди и следи за динамикой по месяцам — баланс, доходы, расходы и норма сбережений.
          </Typography>
        </Box>

        {/* Form */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ fontWeight: 950 }}>
            Вход
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
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
              margin="normal"
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
              sx={{ mt: 3, mb: 2, borderRadius: 999, py: 1.1, fontWeight: 800 }}
            >
              Войти
            </Button>
          </Box>

          <Box sx={{ mt: 2, mb: 2, textAlign: "center" }}>
            <div ref={googleDivRef} />
          </Box>

          <Typography variant="body2" align="center">
            Нет аккаунта?{" "}
            <Link component="button" type="button" onClick={() => navigate("/register")}>
              Зарегистрироваться
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
