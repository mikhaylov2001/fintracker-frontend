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
import AppLogo from "../components/ft/AppLogo";

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

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("ft-menu-open");
    } else {
      document.body.classList.remove("ft-menu-open");
    }
    return () => document.body.classList.remove("ft-menu-open");
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex w-72 shrink-0 border-r border-border flex-col p-6 gap-8 sticky top-0 h-screen">
        <SidebarContent
          pathname={pathname}
          userName={userName}
          dashTo={dashTo}
          onLogout={handleLogout}
          onUpgrade={() => navigate("/pro")}
        />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative w-72 max-w-[85vw] bg-background border-r border-border flex flex-col p-6 gap-8 overflow-y-auto pt-[calc(1rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-[calc(0.75rem+var(--safe-top))] right-4 ft-touch grid place-items-center rounded-xl hover:bg-white/[0.05] text-muted-foreground"
              aria-label="Закрыть меню"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              userName={userName}
              dashTo={dashTo}
              onLogout={handleLogout}
              onUpgrade={() => {
                setMobileOpen(false);
                navigate("/pro");
              }}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 pt-[var(--safe-top)] min-h-[calc(3.5rem+var(--safe-top))] border-b border-border bg-background/80 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="ft-touch grid place-items-center rounded-xl hover:bg-white/[0.05]"
            aria-label="Открыть меню"
          >
            <Menu className="size-5" />
          </button>
          <AppLogo compact className="px-1" />
          <div className="ft-touch shrink-0" aria-hidden />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 pb-[calc(1rem+var(--safe-bottom))] min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, userName, dashTo, onLogout, onUpgrade }) {
  return (
    <>
      <AppLogo userName={userName} className="px-2" />

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
              className={`flex items-center gap-3 px-3.5 py-3 min-h-[2.75rem] rounded-xl text-sm font-medium transition-all ${
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
            onClick={onUpgrade}
            className="w-full py-2.5 min-h-[2.75rem] bg-emerald-glow text-primary-foreground font-bold text-xs rounded-lg uppercase tracking-[0.12em] hover:brightness-110 transition-all"
          >
            Улучшить
          </button>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-2 px-3 py-3 min-h-[2.75rem] rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
        >
          <LogOut className="size-4" />
          Выйти
        </button>
      </div>
    </>
  );
}
