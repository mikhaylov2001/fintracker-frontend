// src/routes/PublicOnlyRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicOnlyRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('PublicOnlyRoute:', { isAuthenticated, loading }); // ← добавь это

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicOnlyRoute;
