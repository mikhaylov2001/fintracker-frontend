import React from "react";
import { useAuth } from "./AuthContext";

export const AuthErrorScreen = () => {
  const { logout } = useAuth();

  const handleRelogin = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="max-w-md w-full rounded-3xl p-6 sm:p-8 bg-surface border border-border shadow-2xl">
        <h1 className="text-xl font-bold mb-2">Проблема с авторизацией</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Мы обнаружили, что в этой вкладке неожиданно сменился пользователь. Чтобы защитить
          данные, сессия была остановлена. Пожалуйста, войдите заново.
        </p>
        <button
          type="button"
          onClick={handleRelogin}
          className="w-full py-2.5 rounded-full bg-emerald-glow text-primary-foreground text-sm font-bold hover:brightness-110 transition"
        >
          Войти заново
        </button>
      </div>
    </div>
  );
};
