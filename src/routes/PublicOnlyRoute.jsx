import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicOnlyRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (isAuthenticated) {
    const userName = user?.userName || 'me';
    return <Navigate to={`/u/${encodeURIComponent(userName)}`} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
