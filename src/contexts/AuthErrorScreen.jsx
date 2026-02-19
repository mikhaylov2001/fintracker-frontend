import React from "react";
import { useAuth } from "./AuthContext";

export const AuthErrorScreen = () => {
  const { logout } = useAuth();

  const handleRelogin = async () => {
    await logout(); // почистит токены/куки и отправит на /login
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "#0f172a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          borderRadius: 16,
          padding: 24,
          background: "#020617",
          boxShadow: "0 20px 45px rgba(15,23,42,0.8)",
          border: "1px solid rgba(148,163,184,0.35)",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 8,
            color: "#e5e7eb",
          }}
        >
          Проблема с авторизацией
        </h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: "#9ca3af",
            marginBottom: 16,
          }}
        >
          Мы обнаружили, что в этой вкладке неожиданно сменился пользователь.
          Чтобы защитить данные, сессия была остановлена. Пожалуйста, войдите
          заново.
        </p>

        <button
          type="button"
          onClick={handleRelogin}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 999,
            border: "none",
            background:
              "linear-gradient(135deg,#4f46e5 0%,#06b6d4 50%,#22c55e 100%)",
            color: "#0b1120",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Войти заново
        </button>
      </div>
    </div>
  );
};
