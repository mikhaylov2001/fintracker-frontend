import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, TextField, Typography, Paper, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const GOOGLE_CLIENT_ID = import.meta?.env?.VITE_GOOGLE_CLIENT_ID
  || process.env.REACT_APP_GOOGLE_CLIENT_ID
  || '1096583300191-ecs88krahb9drbhbs873ma4mieb7lihj.apps.googleusercontent.com';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({
    userName: '',
    email: '',
    password: '',
    chatId: '',
  });

  const [error, setError] = useState('');
  const googleDivRef = useRef(null);

  const handleGoogleCallback = useCallback(
    async (response) => {
      try {
        setError('');
        // регистрация через Google у тебя фактически делается через /api/auth/google (loginWithGoogle) [file:7211]
        await loginWithGoogle(response.credential);
        navigate('/', { replace: true });
      } catch (err) {
        console.error(err);
        setError('Ошибка регистрации через Google');
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
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
    });
  }, [handleGoogleCallback]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register({
        userName: form.userName,
        email: form.email,
        password: form.password,
        chatId: form.chatId ? Number(form.chatId) : null,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Ошибка при регистрации. Попробуйте ещё раз.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Регистрация в FinTrackerPro
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            fullWidth
            label="Имя пользователя"
            name="userName"
            value={form.userName}
            onChange={handleChange}
            required
            autoComplete="username"
          />
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
            autoComplete="new-password"
          />
          <TextField
            margin="normal"
            fullWidth
            label="Telegram chat ID"
            name="chatId"
            value={form.chatId}
            onChange={handleChange}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
            Зарегистрироваться
          </Button>
        </Box>

        <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
          <div ref={googleDivRef} />
        </Box>

        <Typography variant="body2" align="center">
          Уже есть аккаунт?{' '}
          <Link component="button" type="button" onClick={() => navigate('/login')}>
            Войти
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
