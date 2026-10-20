"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  User,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Database,
} from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      setSuccess(true);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-xl shadow-slate-100/80 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white shadow-lg shadow-indigo-100">
          <Wallet className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
          {t("auth.registerTitle", "Create Your MyExpense Account")}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {t("auth.registerSubtitle", `Start budgeting, tracking income, and monitoring cashflow in ${CURRENCY_SYMBOL} INR.`)}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span>{t("auth.registerSuccess", "Account created! Initializing categories and dashboard...")}</span>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {t("auth.fullName", "Full Name")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {t("auth.email", "Email Address")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {t("auth.passwordMin", "Password (minimum 6 characters)")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>

        {/* Feature Pills */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Tag className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
            <span>{t("auth.feature1", "Includes 14 default Indian budgeting categories")}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Database className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            <span>{t("auth.feature2", "Strict user-isolated PostgreSQL database records")}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("auth.creatingAccount", "Creating your account...")}</span>
            </>
          ) : (
            <>
              <span>{t("auth.signUpBtn", "Get Started Free")}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-600">
          {t("auth.hasAccount", "Already have an account?")}{" "}
          <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800 underline">
            {t("auth.signInLink", "Sign in")}
          </Link>
        </p>
      </div>
    </div>
  );
}
