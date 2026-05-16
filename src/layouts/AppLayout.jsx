import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  {
    label: "Состояние финансов",
    pathMatch: (p, dash) => p.startsWith("/u/") || p === dash,
    icon: LayoutDashboard,
    to: null,
  },
  { label: "Доходы", pathMatch: (p) => p.startsWith("/income"), icon: ArrowUpCircle, to: "/income" },
  { label: "Расходы", pathMatch: (p) => p.startsWith("/expenses"), icon: ArrowDownCircle, to: "/expenses" },
  { label: "Аналитика", pathMatch: (p) => p.startsWith("/analytics"), icon: BarChart3, to: "/analytics" },
  { label: "Настройки", pathMatch: (p) => p.startsWith("/settings"), icon: Settings, to: "/settings" },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const dashTo = user?.userName ? `/u/${encodeURIComponent(user.userName)}` : "/";

  const userName = useMemo(() => {
    if (user?.firstName) return user.firstName;
    return user?.userName || user?.email || "Пользователь";
  }, [user]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden lg:flex w-72 shrink-0 border-r border-border flex-col p-6 gap-8 sticky top-0 h-screen">
        <SidebarContent
          pathname={pathname}
          userName={userName}
          dashTo={dashTo}
          onLogout={handleLogout}
        />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative w-72 max-w-[85vw] bg-background border-r border-border flex flex-col p-6 gap-8 overflow-y-auto">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 size-9 grid place-items-center rounded-lg hover:bg-white/[0.05] text-muted-foreground"
              aria-label="Закрыть меню"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              userName={userName}
              dashTo={dashTo}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 border-b border-border bg-background/80 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="size-9 grid place-items-center rounded-lg hover:bg-white/[0.05]"
            aria-label="Открыть меню"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-emerald-glow shadow-[0_0_16px_oklch(0.72_0.18_162/0.5)] grid place-items-center">
              <div className="size-1.5 rounded-sm bg-background/80" />
            </div>
            <span className="font-bold tracking-tight text-sm">
              FinTracker<span className="text-emerald-glow">Pro</span>
            </span>
          </div>
          <div className="size-9" />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, userName, dashTo, onLogout }) {
  return (
    <>
      <div className="flex items-center gap-3 px-2">
        <div className="size-9 rounded-xl bg-emerald-glow shadow-[0_0_24px_oklch(0.72_0.18_162/0.45)] grid place-items-center">
          <div className="size-3 rounded-sm bg-background/80" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-bold text-lg tracking-tight">
            FinTracker<span className="text-emerald-glow">Pro</span>
          </span>
          <span className="text-[11px] text-muted-foreground mt-1">{userName}</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-3 mb-1 font-semibold">
          Меню
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const to = item.to ?? dashTo;
          const active = item.pathMatch(pathname, dashTo);
          return (
            <Link
              key={item.label}
              to={to}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white/[0.06] text-foreground ring-1 ring-emerald-glow/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              <Icon
                className={`size-4 shrink-0 ${active ? "text-emerald-glow" : "opacity-60"}`}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-glow/15 to-emerald-glow/[0.02] border border-emerald-glow/20">
          <p className="text-[10px] font-semibold text-emerald-glow uppercase tracking-[0.18em] mb-1.5">
            PRO план
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Расширенная аналитика и синхронизация с банками.
          </p>
          <button
            type="button"
            className="w-full py-2 bg-emerald-glow text-primary-foreground font-bold text-[11px] rounded-lg uppercase tracking-[0.15em] hover:brightness-110 transition-all"
          >
            Улучшить
          </button>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
        >
          <LogOut className="size-4" />
          Выйти
        </button>
      </div>
    </>
  );
}
