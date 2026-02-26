// src/pages/Auth/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppBackground from "../../layouts/AppBackground";
import { requestPasswordReset } from "../../api/passwordResetApi";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validateEmail = (v) => {
  if (!v.trim()) return "Введите email";
  if (!EMAIL_RE.test(v.trim())) return "Некорректный формат email";
  return "";
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    setFieldError(validateEmail(email));
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (touched) setFieldError(validateEmail(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    setFieldError(err);
    if (err) return;

    setLoading(true);
    setStatus("");

    try {
      await requestPasswordReset(email.trim());
      setStatus(
        "Если такой email существует, мы отправили инструкцию по восстановлению пароля."
      );
    } catch {
      setStatus(
        "Если такой email существует, мы отправили инструкцию по восстановлению пароля."
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
            Восстановление доступа к FinTracker
          </Typography>
          <Typography
            sx={{
              mt: 1.25,
              color: "rgba(255,255,255,0.72)",
              fontSize: 15,
              maxWidth: 420,
            }}
          >
            Если вы забыли пароль, мы отправим ссылку для его сброса на ваш email.
          </Typography>
        </Box>

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
              Восстановление пароля
            </Typography>
            <Typography
              sx={{
                mt: 0.8,
                fontSize: 13,
                color: "rgba(15,23,42,0.6)",
              }}
            >
              Укажите email, на который зарегистрирован аккаунт.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
            <TextField
              margin="dense"
              fullWidth
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(fieldError)}
              helperText={fieldError}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading || !!validateEmail(email)}
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
              {loading ? "Отправляем..." : "Отправить ссылку"}
            </Button>
          </Box>

          {status && (
            <Typography
              variant="body2"
              sx={{ mt: 1, color: "rgba(15,23,42,0.7)" }}
            >
              {status}
            </Typography>
          )}

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
