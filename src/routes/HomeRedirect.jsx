import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomeRedirect() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Загрузка...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userName = user?.userName;
  return userName
    ? <Navigate to={`/u/${encodeURIComponent(userName)}`} replace />
    : <Navigate to="/u/me" replace />;
}
