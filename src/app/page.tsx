"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  PieChart,
  Target,
  Receipt,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/70 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-6 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t("landing.badge", "Full-Stack Finance Management with PostgreSQL")}</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-tight sm:leading-none">
          {t("landing.headlineMain", "Master your money with")}{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {t("landing.headlineGradient", "confidence")}
          </span>{" "}
          {t("landing.headlineEnd", "and clarity.")}
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t("landing.subtitle", "Track expenses, set category budgets, monitor income streams, and gain clear financial insights—all tailored in ₹ INR with bank-grade user privacy.")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            {t("landing.createAccount", "Create Free Account")}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            {t("landing.existingLogin", "Existing User Login")}
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
              <Receipt className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {t("landing.incomeExpensesTitle", "Income & Expenses")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("landing.incomeExpensesDesc", "Categorize transactions seamlessly with support for custom categories and date ranges.")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {t("landing.monthlyBudgetsTitle", "Monthly Budgets")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("landing.monthlyBudgetsDesc", "Set monthly spending thresholds in ₹ INR and keep overspending in check with live indicators.")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 mb-4">
              <PieChart className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {t("landing.analyticsTitle", "Interactive Analytics")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("landing.analyticsDesc", "Visualize spending breakdowns and monthly trends with Recharts interactive charts.")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {t("landing.dataIsolationTitle", "Data Isolation")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("landing.dataIsolationDesc", "PostgreSQL relational security, Bcrypt password hashing, and user-isolated records.")}
            </p>
          </div>
        </div>

        {/* Quick Demo Preview Card */}
        <div className="mt-16 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 sm:p-10 shadow-sm max-w-4xl mx-auto text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {t("landing.previewBadge", "Overview Preview")}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {t("landing.previewTitle", "This Month's Summary")}
              </h3>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{t("landing.savingsRate", "Savings Rate")}: +38.5%</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-medium text-slate-500">
                {t("landing.totalIncome", "Total Income")}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-600">{CURRENCY_SYMBOL}85,000</div>
              <div className="mt-1 text-xs text-slate-400">
                {t("landing.incomeSub", "Salary + Freelance")}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-medium text-slate-500">
                {t("landing.totalExpenses", "Total Expenses")}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-rose-600">{CURRENCY_SYMBOL}52,300</div>
              <div className="mt-1 text-xs text-slate-400">
                {t("landing.expenseSub", "Food, Rent & Utilities")}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-medium text-slate-500">
                {t("landing.netSavings", "Net Savings")}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-indigo-600">{CURRENCY_SYMBOL}32,700</div>
              <div className="mt-1 text-xs text-slate-400">
                {t("landing.savingsSub", "Available to invest")}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-indigo-50/70 p-4 border border-indigo-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              <p className="text-sm text-indigo-900 font-medium">
                {t("landing.footerReady", "Phase 1 project foundation ready. Database schema, models & authentication endpoints initialized.")}
              </p>
            </div>
            <Link
              href="/register"
              className="text-sm font-bold text-indigo-700 hover:text-indigo-900 underline whitespace-nowrap"
            >
              {t("landing.signUpStart", "Sign up to start →")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
