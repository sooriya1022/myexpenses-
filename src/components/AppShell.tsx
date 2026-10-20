"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
} from "lucide-react";
import { APP_NAME, CURRENCY_SYMBOL } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check auth status
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUser(data.user);
        } else {
          if (isMounted) setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLandingPage = pathname === "/";

  // Navigation Items with localized labels
  const navItems = [
    {
      name: t("nav.dashboard", "Dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname.startsWith("/dashboard"),
    },
    {
      name: t("nav.transactions", "Transactions"),
      href: "/transactions",
      icon: Receipt,
      active: pathname.startsWith("/transactions"),
    },
    {
      name: t("nav.budgets", "Budgets"),
      href: "/budgets",
      icon: PiggyBank,
      active: pathname.startsWith("/budgets"),
    },
    {
      name: t("nav.reports", "Reports"),
      href: "/reports",
      icon: BarChart2,
      active: pathname.startsWith("/reports"),
    },
    {
      name: t("nav.settings", "Settings"),
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. PUBLIC LANDING PAGE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLandingPage) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 transition hover:opacity-90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white shadow-md shadow-indigo-200">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="tracking-tight">{APP_NAME}</span>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                {CURRENCY_SYMBOL} {t("common.inr", "INR")}
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t("nav.dashboard", "Dashboard")}</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl px-3 sm:px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {t("auth.signInLink", "Sign In")}
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 active:scale-[0.98]"
                  >
                    <span>{t("landing.createAccount", "Create Account")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2.5 text-slate-700 font-semibold text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Wallet className="h-4 w-4" />
                </div>
                <span>{APP_NAME} &bull; {t("nav.inrTracker", "Personal Finance Tracker")}</span>
              </div>
              <p className="text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} {APP_NAME}. Built with Next.js 14, Tailwind CSS, Prisma & PostgreSQL.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. AUTHENTICATION PAGES (LOGIN / REGISTER)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isAuthPage) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-indigo-50/30 to-slate-100 text-slate-900">
        <header className="w-full border-b border-slate-200/60 bg-white/60 backdrop-blur-md py-4 px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Wallet className="h-5 w-5" />
              </div>
              <span>{APP_NAME}</span>
            </Link>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                href="/"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                {t("auth.backHome", "← Back to Home")}
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">{children}</main>

        <footer className="py-4 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {APP_NAME} &bull; {t("auth.secureSession", "Secure Encrypted Session")}
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. AUTHENTICATED APPLICATION LAYOUT (SIDEBAR + TOPBAR + CONTENT)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* ── Desktop Collapsible Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200/90 bg-white transition-all duration-300 z-30 sticky top-0 h-screen ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand & Collapse Toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 transition-opacity ${
              sidebarCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white shadow-md shadow-indigo-100">
              <Wallet className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                  {APP_NAME}
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block">
                  {CURRENCY_SYMBOL} {t("common.inr", "INR")} Tracker
                </span>
              </div>
            )}
          </Link>

          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <div className="flex justify-center py-2 border-b border-slate-100">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quick Action Button */}
        <div className="p-3">
          <Link
            href="/transactions"
            className={`flex items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition active:scale-[0.98] ${
              sidebarCollapsed ? "h-11 w-11 p-0 mx-auto" : "py-2.5 px-4 w-full text-sm"
            }`}
            title={t("nav.addTransaction", "Add Transaction")}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>{t("nav.addTransaction", "Add Transaction")}</span>}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  item.active
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/80"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 transition-colors ${
                    item.active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!sidebarCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 border border-slate-200/80 shadow-xs">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name || t("nav.member", "Member")}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || t("nav.active", "active")}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{isLoggingOut ? t("common.loading", "Logging out...") : t("nav.logout", "Log Out")}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm cursor-pointer"
                title={user?.name || t("nav.member", "Member")}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                title={t("nav.logout", "Log Out")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Slide-Over Drawer ── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-white shadow-2xl h-full z-10 animate-in slide-in-from-left duration-200">
            <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="font-bold text-base text-slate-900">{APP_NAME}</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <LanguageSwitcher className="w-full" />
            </div>

            <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                      item.active
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${item.active ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-3 px-2 py-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.name || t("nav.member", "Member")}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("nav.logout", "Log Out")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Application Viewport ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 md:hidden">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Wallet className="h-4 w-4" />
            </div>
            <span>{APP_NAME}</span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/transactions"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
              title={t("nav.addTransaction", "Add Transaction")}
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Desktop Breadcrumb / Sub-header bar */}
        <div className="hidden md:flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/60 backdrop-blur-xs px-8">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="text-slate-400">MyExpense</span>
            <span>/</span>
            <span className="font-semibold text-slate-800 capitalize">
              {navItems.find((i) => i.active)?.name || pathname.split("/")[1]}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher in desktop header */}
            <LanguageSwitcher />

            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{CURRENCY_SYMBOL} {t("common.inr", "INR")} {t("nav.active", "Active")}</span>
            </div>

            <Link
              href="/settings"
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span>{user?.name || t("nav.account", "Account")}</span>
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* ── Mobile Bottom Navigation Bar ── */}
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 shadow-lg">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                    item.active
                      ? "text-indigo-600 font-bold"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${item.active ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px] text-center">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
