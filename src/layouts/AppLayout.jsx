import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import TopNavBar from '../components/TopNavBar';

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F6F7FB',
        backgroundImage: `
          radial-gradient(900px 450px at 12% 0%, ${alpha('#60A5FA', 0.16)} 0%, transparent 55%),
          radial-gradient(900px 450px at 88% 0%, ${alpha('#A78BFA', 0.16)} 0%, transparent 55%)
        `,
      }}
    >
      <TopNavBar onLogout={handleLogout} userLabel={user?.userName || user?.email || 'Пользователь'} />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
