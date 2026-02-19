// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import AppLayout from "./layouts/AppLayout";

import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";

import DashboardPage from "./pages/Dashboard/DashboardPage";
import ExpensesPage from "./pages/Expenses/ExpensesPage";
import IncomePage from "./pages/Income/IncomePage";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage";

import PrivateRoutes from "./routes/PrivateRoutes";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import HomeRedirect from "./routes/HomeRedirect";
import SettingsPage from "./pages/Settings/SettingsPage";

import { CurrencyProvider } from "./contexts/CurrencyContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<PrivateRoutes />}>
              <Route element={<AppLayout />}>
                <Route path="/u/:userName" element={<DashboardPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/income" element={<IncomePage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
