"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  CreditCard,
  Database,
  LogOut,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Globe,
} from "lucide-react";
import { APP_NAME, CURRENCY_SYMBOL } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push("/login?redirect=/settings");
        }
      } catch (err) {
        console.error("Failed to load user in settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-2 border border-indigo-100">
            <SettingsIcon className="h-3.5 w-3.5" />
            <span>{t("settings.badge", "Preferences & Account")}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("settings.title", "Settings")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("settings.subtitle", "Manage your personal profile, regional currency settings, and data security.")}
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition active:scale-[0.98] disabled:opacity-60"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>{loggingOut ? t("settings.signingOut", "Signing out...") : t("settings.signOutBtn", "Sign Out")}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Language Preference Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("settings.languageCardTitle", "Language Preferences")}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("settings.languageCardDesc", "Choose your interface language across English, Tamil, and Hindi")}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <LanguageSwitcher variant="card" />
            </div>
          </div>

          {/* User Profile Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100 font-bold text-lg">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{user?.name || "User"}</h2>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("settings.activeAccount", "Active Account")}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>{t("settings.fullName", "Full Name")}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{user?.name || "—"}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{t("settings.emailAddress", "Email Address")}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{user?.email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Currency & Localization Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("settings.currencyCardTitle", "Currency & Regional Preferences")}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("settings.currencyCardDesc", "Configured default currency and display standards")}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-xs font-medium text-slate-500">{t("settings.defaultCurrency", "Default Currency")}</span>
                <p className="mt-1 text-base font-bold text-indigo-700 flex items-center gap-1.5">
                  <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-extrabold text-indigo-800">
                    {CURRENCY_SYMBOL} INR
                  </span>
                  {t("settings.indianRupee", "Indian Rupee")}
                </p>
                <p className="mt-1 text-xs text-slate-400">{t("settings.currencyNote", "Standard for all transactions and budgets")}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-xs font-medium text-slate-500">{t("settings.numberFormatting", "Number Formatting")}</span>
                <p className="mt-1 text-base font-bold text-slate-800">₹1,23,456.78</p>
                <p className="mt-1 text-xs text-slate-400">{t("settings.numberFormatDesc", "Indian Lakhs/Crores comma grouping")}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-xs font-medium text-slate-500">{t("settings.dateFormat", "Date Format")}</span>
                <p className="mt-1 text-base font-bold text-slate-800">DD/MM/YYYY</p>
                <p className="mt-1 text-xs text-slate-400">{t("settings.dateFormatDesc", "Localized calendar format")}</p>
              </div>
            </div>
          </div>

          {/* Security & Data Privacy Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("settings.securityCardTitle", "Security & Isolation")}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("settings.securityCardDesc", "Bank-grade data isolation and encryption safeguards")}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100 text-sm">
                <Lock className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-950">
                    {t("settings.passwordProtection", "Password & Session Protection")}
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {t("settings.passwordDesc", "Your password is salted and hashed using bcrypt. Active sessions are secured via HTTP-only cryptographic JWT tokens.")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-sm">
                <Database className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {t("settings.postgresIsolation", "PostgreSQL Strict User Isolation")}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t("settings.postgresDesc", "Every database query enforces your unique user ID filter. No user can view, edit, or delete another user's transactions, categories, budgets, or analytics.")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* App Info Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t("settings.appArchitectureTitle", "MyExpense Architecture")}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("settings.appArchitectureDesc", "Full-stack expense tracking built with Next.js 14, Tailwind CSS, Prisma ORM, and Supabase PostgreSQL.")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <span>{t("settings.goToDashboard", "Go to Dashboard")}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
