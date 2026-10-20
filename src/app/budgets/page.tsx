"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
  Check,
  Calendar,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: "INCOME" | "EXPENSE";
}

interface BudgetWithProgress {
  id: string;
  amount: number;
  month: number;
  year: number;
  category: Category | null;
  categoryId: string | null;
  spent: number;
  remaining: number;
  percentage: number;
  status: "under" | "near" | "over";
  createdAt: string;
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: "under" | "near" | "over";
}

const MONTH_NAMES_MAP = {
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  ta: [
    "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
    "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்",
  ],
  hi: [
    "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
  ],
};

function StatusBadge({
  status,
  percentage,
  underLabel,
  nearLabel,
  overLabel,
}: {
  status: string;
  percentage: number;
  underLabel: string;
  nearLabel: string;
  overLabel: string;
}) {
  if (status === "over") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
        <XCircle className="h-3 w-3" /> {overLabel} ({percentage}%)
      </span>
    );
  }
  if (status === "near") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
        <AlertTriangle className="h-3 w-3" /> {nearLabel} ({percentage}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
      <CheckCircle className="h-3 w-3" /> {underLabel} ({percentage}%)
    </span>
  );
}

function ProgressBar({ percentage, status }: { percentage: number; status: string }) {
  const clamped = Math.min(percentage, 100);
  const color =
    status === "over" ? "bg-rose-500" : status === "near" ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface ModalProps {
  categories: Category[];
  month: number;
  year: number;
  monthName: string;
  existingBudget: BudgetWithProgress | null;
  onClose: () => void;
  onSave: () => void;
  tCategory: (name: string) => string;
}

function BudgetModal({
  categories,
  month,
  year,
  monthName,
  existingBudget,
  onClose,
  onSave,
  tCategory,
}: ModalProps) {
  const { t } = useLanguage();
  const [categoryId, setCategoryId] = useState(existingBudget?.categoryId ?? "");
  const [amount, setAmount] = useState(existingBudget ? String(existingBudget.amount) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!existingBudget && !categoryId) {
      setError("Please select a category.");
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (existingBudget) {
        res = await fetch(`/api/budgets/${existingBudget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: parsed }),
        });
      } else {
        res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, amount: parsed, month, year }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save budget.");
        return;
      }
      onSave();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const expenseCats = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-900">
            {existingBudget
              ? t("budgets.editBudgetTitle", "Edit Monthly Budget")
              : `${t("budgets.setBudgetTitle", "Set Budget")} — ${monthName} ${year}`}
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!existingBudget && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t("budgets.expenseCategoryLabel", "Expense Category")} <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              >
                <option value="">{t("budgets.selectCategory", "Select category…")}</option>
                {expenseCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tCategory(c.name)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {existingBudget && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <span
                className="inline-block h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: existingBudget.category?.color }}
              />
              <span className="text-sm font-bold text-slate-800">
                {existingBudget.category ? tCategory(existingBudget.category.name) : ""}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              {t("budgets.monthlyBudgetCap", `Monthly Budget Cap in ${CURRENCY_SYMBOL} INR`)} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-base font-bold text-slate-400">
                {CURRENCY_SYMBOL}
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-lg font-extrabold text-slate-900 placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>{saving ? t("budgets.savingBudget", "Saving…") : t("budgets.saveBudgetBtn", "Save Budget")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Budgets Page ────────────────────────────────────────────────────────

export default function BudgetsPage() {
  const { language, t, tCategory } = useLanguage();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithProgress | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const monthNames = MONTH_NAMES_MAP[language] || MONTH_NAMES_MAP.en;
  const currentMonthName = monthNames[month - 1];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [budgetsRes, catsRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch("/api/categories"),
      ]);
      if (!budgetsRes.ok) throw new Error("Failed to load budgets.");
      if (!catsRes.ok) throw new Error("Failed to load categories.");
      const budgetsData = await budgetsRes.json();
      const catsData = await catsRes.json();
      setBudgets(budgetsData.budgets || []);
      setSummary(budgetsData.summary || null);
      setCategories(catsData.categories || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to delete budget.");
        return;
      }
      setConfirmDeleteId(null);
      await loadData();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const navigateMonth = (dir: -1 | 1) => {
    setMonth((prev) => {
      const next = prev + dir;
      if (next < 1) {
        setYear((y) => y - 1);
        return 12;
      }
      if (next > 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return next;
    });
  };

  const budgetedCatIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter(
    (c) => c.type === "EXPENSE" && !budgetedCatIds.has(c.id)
  );

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-2 border border-indigo-100">
            <PiggyBank className="h-3.5 w-3.5" />
            <span>{t("budgets.badge", "Spending Guardrails")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t("budgets.title", "Budgets")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("budgets.subtitle", "Set and track monthly spending targets per expense category against live transaction data.")}
          </p>
        </div>

        <button
          onClick={() => {
            setEditBudget(null);
            setShowModal(true);
          }}
          disabled={availableCategories.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>{t("budgets.setBudget", "Set Budget")}</span>
        </button>
      </div>

      {/* ── Month Navigator ── */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <button
          onClick={() => navigateMonth(-1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t("budgets.previousMonth", "Previous Month")}</span>
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span className="text-base sm:text-lg font-extrabold text-slate-900">
            {currentMonthName} {year}
          </span>
        </div>

        <button
          onClick={() => navigateMonth(1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <span className="hidden sm:inline">{t("budgets.nextMonth", "Next Month")}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs font-bold underline">
            {t("common.dismiss", "Dismiss")}
          </button>
        </div>
      )}

      {/* ── Loading Spinner ── */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600">{t("budgets.loadingBudgets", "Loading monthly budget data...")}</p>
        </div>
      ) : (
        <>
          {/* ── Overall Monthly Budget Card ── */}
          {summary && budgets.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t("budgets.monthlyTarget", "Monthly Target")}
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {t("budgets.totalAllocation", "Total Budget Allocation")} &bull; {currentMonthName} {year}
                  </h2>
                </div>
                <StatusBadge
                  status={summary.status}
                  percentage={summary.percentage}
                  underLabel={t("budgets.underBudget", "Under Budget")}
                  nearLabel={t("budgets.nearLimit", "Near Limit")}
                  overLabel={t("budgets.overBudget", "Over Budget")}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("budgets.totalBudget", "Total Budget")}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">
                    {formatINR(summary.totalBudget)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("budgets.totalSpent", "Total Spent")}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">
                    {formatINR(summary.totalSpent)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("budgets.remaining", "Remaining")}</p>
                  <p
                    className={`text-xl sm:text-2xl font-extrabold mt-1 ${
                      summary.remaining >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatINR(Math.abs(summary.remaining))}
                    {summary.remaining < 0 && ` ${t("budgets.over", "over")}`}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("budgets.usageRatio", "Usage Ratio")}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1">
                    {summary.percentage}%
                  </p>
                </div>
              </div>

              <ProgressBar percentage={summary.percentage} status={summary.status} />
              <p className="mt-2 text-xs text-slate-400 text-right">
                {summary.percentage}% {t("budgets.overallUtilized", "of overall monthly budget utilized")}
              </p>
            </div>
          )}

          {/* ── Category Budget Cards Grid ── */}
          {budgets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-4">
                <PiggyBank className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("budgets.noBudgetsTitle", "No budgets set for")} {currentMonthName} {year}
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                {t("budgets.noBudgetsDesc", "Set monthly spending targets for your expense categories to monitor progress and prevent overspending.")}
              </p>
              <button
                onClick={() => {
                  setEditBudget(null);
                  setShowModal(true);
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>{t("budgets.setFirstBudgetBtn", "Set First Budget")}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.map((b) => (
                <div
                  key={b.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-4"
                >
                  {/* Category header & actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {b.category && (
                        <span
                          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-white text-xs font-bold shadow-xs"
                          style={{ backgroundColor: b.category.color }}
                        >
                          {b.category.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {b.category ? tCategory(b.category.name) : ""}
                        </h3>
                        <div className="mt-1">
                          <StatusBadge
                            status={b.status}
                            percentage={b.percentage}
                            underLabel={t("budgets.underBudget", "Under Budget")}
                            nearLabel={t("budgets.nearLimit", "Near Limit")}
                            overLabel={t("budgets.overBudget", "Over Budget")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditBudget(b);
                          setShowModal(true);
                        }}
                        className="rounded-xl p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                        title={t("common.edit", "Edit Budget")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {confirmDeleteId === b.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(b.id)}
                            disabled={deletingId === b.id}
                            className="rounded-lg px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
                          >
                            {deletingId === b.id ? "..." : t("budgets.deleteConfirm", "Confirm")}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg px-2 py-1 text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                          >
                            {t("common.cancel", "Cancel")}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(b.id)}
                          className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title={t("common.delete", "Delete Budget")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stat figures */}
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100 text-center">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("budgets.totalBudget", "Budget")}</p>
                      <p className="text-sm font-extrabold text-indigo-600 mt-0.5">{formatINR(b.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("budgets.totalSpent", "Spent")}</p>
                      <p className="text-sm font-extrabold text-rose-600 mt-0.5">{formatINR(b.spent)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("budgets.remaining", "Remaining")}</p>
                      <p
                        className={`text-sm font-extrabold mt-0.5 ${
                          b.remaining >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {b.remaining >= 0 ? formatINR(b.remaining) : `-${formatINR(Math.abs(b.remaining))}`}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <ProgressBar percentage={b.percentage} status={b.status} />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>{b.percentage}% {t("budgets.used", "used")}</span>
                      {b.status === "over" && (
                        <span className="text-rose-600 font-bold">
                          {formatINR(Math.abs(b.remaining))} {t("budgets.overLimit", "over limit")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {budgets.length > 0 && (
            <p className="text-center text-xs text-slate-400 pt-2">
              {t("budgets.spendingCalculatedNote", "Spending data is automatically calculated from your recorded Transactions for this month.")}
            </p>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <BudgetModal
          categories={categories}
          month={month}
          year={year}
          monthName={currentMonthName}
          existingBudget={editBudget}
          onClose={() => {
            setShowModal(false);
            setEditBudget(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditBudget(null);
            loadData();
          }}
          tCategory={tCategory}
        />
      )}
    </div>
  );
}
