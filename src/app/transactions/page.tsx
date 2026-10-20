"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Tag,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Filter,
  X,
  Wallet,
  Search,
  Check,
  Receipt,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    type: "INCOME" | "EXPENSE";
    color: string;
    icon: string;
  };
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export default function TransactionsPage() {
  const { t, tCategory } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [formType, setFormType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [formDescription, setFormDescription] = useState<string>("");

  // Fetch transactions and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [txRes, catRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/categories"),
      ]);

      if (!txRes.ok) throw new Error(t("transactions.failedLoad", "Failed to load transactions."));
      if (!catRes.ok) throw new Error("Failed to load categories.");

      const txData = await txRes.json();
      const catData = await catRes.json();

      setTransactions(txData.transactions || []);
      setSummary(
        txData.summary || { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 }
      );
      setCategories(catData.categories || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("common.tryAgain", "Failed to load data. Please refresh."));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered categories for the form based on chosen formType
  const availableFormCategories = useMemo(() => {
    return categories.filter((c) => c.type === formType);
  }, [categories, formType]);

  // Set default category when formType changes
  useEffect(() => {
    if (availableFormCategories.length > 0) {
      const exists = availableFormCategories.some((c) => c.id === formCategoryId);
      if (!exists) {
        setFormCategoryId(availableFormCategories[0].id);
      }
    }
  }, [formType, availableFormCategories, formCategoryId]);

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setFormType("EXPENSE");
    setFormAmount("");
    const defaultExpenseCat = categories.find((c) => c.type === "EXPENSE");
    setFormCategoryId(defaultExpenseCat?.id || "");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormType(tx.type);
    setFormAmount(tx.amount.toString());
    setFormCategoryId(tx.categoryId);
    setFormDate(new Date(tx.date).toISOString().split("T")[0]);
    setFormDescription(tx.description || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormError(null);
  };

  // Submit Add or Edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Amount must be a positive number greater than 0.");
      return;
    }

    if (!formCategoryId) {
      setFormError("Please select a category.");
      return;
    }

    if (!formDate) {
      setFormError("Please choose a date.");
      return;
    }

    setFormSubmitting(true);

    try {
      const payload = {
        amount: parsedAmount,
        type: formType,
        categoryId: formCategoryId,
        date: new Date(formDate).toISOString(),
        description: formDescription.trim() || null,
      };

      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions";
      const method = editingTransaction ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save transaction.");
      }

      handleCloseModal();
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred while saving.");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm and Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete transaction.");
      }

      setDeletingId(null);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered transactions for view
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== "ALL" && tx.type !== filterType) return false;
      if (filterCategory !== "ALL" && tx.categoryId !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = tx.description?.toLowerCase().includes(q);
        const matchesCat = tx.category.name.toLowerCase().includes(q);
        const matchesTranslatedCat = tCategory(tx.category.name).toLowerCase().includes(q);
        if (!matchesDesc && !matchesCat && !matchesTranslatedCat) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, searchQuery, tCategory]);

  return (
    <div className="space-y-8">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-2 border border-indigo-100">
            <Receipt className="h-3.5 w-3.5" />
            <span>{t("transactions.badge", "Cashflow Ledger")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t("transactions.title", "Transactions")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("transactions.subtitle", `Record, categorize, and filter your personal income and expenses in ${CURRENCY_SYMBOL} INR.`)}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>{t("transactions.newTransaction", "New Transaction")}</span>
        </button>
      </div>

      {/* ── Summary Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Income */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{t("transactions.totalInflows", "Total Inflows")}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600">
            {formatINR(summary.totalIncome)}
          </div>
          <p className="mt-1 text-xs text-slate-400">{t("transactions.totalInflowsSub", "Recorded income transactions")}</p>
        </div>

        {/* Total Expenses */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{t("transactions.totalSpending", "Total Spending")}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600">
            {formatINR(summary.totalExpense)}
          </div>
          <p className="mt-1 text-xs text-slate-400">{t("transactions.totalSpendingSub", "Recorded expense outflows")}</p>
        </div>

        {/* Net Balance */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{t("transactions.netBalance", "Net Balance")}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              summary.balance >= 0 ? "text-indigo-600" : "text-rose-600"
            }`}
          >
            {formatINR(summary.balance)}
          </div>
          <p className="mt-1 text-xs text-slate-400">{t("transactions.netBalanceSub", "Inflows minus total spending")}</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 h-4 w-4 text-slate-400 my-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("transactions.searchPlaceholder", "Search description or category...")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilterType("ALL")}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterType === "ALL"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              {t("transactions.allTypes", "All")}
            </button>
            <button
              onClick={() => setFilterType("EXPENSE")}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterType === "EXPENSE"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              {t("transactions.expenses", "Expenses")}
            </button>
            <button
              onClick={() => setFilterType("INCOME")}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterType === "INCOME"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              {t("transactions.income", "Income")}
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="ALL">{t("transactions.allCategories", "All Categories")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {tCategory(cat.name)} ({cat.type === "INCOME" ? t("transactions.income", "Income") : t("transactions.expenses", "Expense")})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Transaction List Section ── */}
      <div>
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600">{t("transactions.loadingTx", "Loading your transactions...")}</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-rose-600 mb-2" />
            <h3 className="text-base font-bold text-rose-900">{t("transactions.failedLoad", "Failed to load transactions")}</h3>
            <p className="mt-1 text-xs text-rose-700">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700"
            >
              {t("common.tryAgain", "Try Again")}
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <Receipt className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t("transactions.noTxTitle", "No transactions recorded")}</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              {transactions.length === 0
                ? t("transactions.noTxDesc", "You haven't added any transactions yet. Record your first expense or income to start tracking!")
                : t("transactions.noTxFilterDesc", "No transactions match your currently selected filters or search.")}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>{t("transactions.recordFirstBtn", "Add Transaction")}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-4">{t("transactions.dateTh", "Date")}</th>
                    <th scope="col" className="px-6 py-4">{t("transactions.categoryTh", "Category")}</th>
                    <th scope="col" className="px-6 py-4">{t("transactions.descriptionTh", "Description")}</th>
                    <th scope="col" className="px-6 py-4">{t("transactions.typeTh", "Type")}</th>
                    <th scope="col" className="px-6 py-4 text-right">{t("transactions.amountTh", "Amount")}</th>
                    <th scope="col" className="px-6 py-4 text-right">{t("transactions.actionsTh", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                        {formatDate(tx.date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{
                            backgroundColor: `${tx.category.color}15`,
                            color: tx.category.color,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tx.category.color }}
                          />
                          {tCategory(tx.category.name)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium max-w-xs truncate">
                        {tx.description || <span className="text-slate-400 italic">{t("common.noDescription", "No description")}</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            tx.type === "INCOME"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {tx.type === "INCOME" ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                          {tx.type === "INCOME" ? t("transactions.income", "Income") : t("transactions.expenses", "Expense")}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-6 py-4 text-right font-extrabold text-base ${
                          tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatINR(tx.amount)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {deletingId === tx.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs text-rose-600 font-bold">{t("transactions.deleteConfirm", "Delete?")}</span>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              disabled={isDeleting}
                              className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"
                            >
                              {isDeleting ? "..." : t("common.yes", "Yes")}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                            >
                              {t("common.no", "No")}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(tx)}
                              className="rounded-xl p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                              title={t("common.edit", "Edit")}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(tx.id)}
                              className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title={t("common.delete", "Delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-3">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          tx.type === "INCOME"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {tx.type === "INCOME" ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">{tCategory(tx.category.name)}</span>
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: tx.category.color }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(tx.date)}</span>
                      </div>
                    </div>

                    <div
                      className={`text-base font-extrabold ${
                        tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatINR(tx.amount)}
                    </div>
                  </div>

                  {tx.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {tx.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span
                      className={`font-semibold ${
                        tx.type === "INCOME" ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {tx.type === "INCOME" ? t("transactions.income", "Income") : t("transactions.expenses", "Expense")}
                    </span>

                    {deletingId === tx.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-rose-600 font-bold">{t("transactions.deleteConfirm", "Delete?")}</span>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          disabled={isDeleting}
                          className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white"
                        >
                          {isDeleting ? "..." : t("common.yes", "Yes")}
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600"
                        >
                          {t("common.no", "No")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(tx)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 font-semibold hover:bg-slate-50"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>{t("common.edit", "Edit")}</span>
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-rose-600 font-semibold hover:bg-rose-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{t("common.delete", "Delete")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">
                {editingTransaction ? t("transactions.editTxTitle", "Edit Transaction") : t("transactions.newTxTitle", "Record New Transaction")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Type Toggle Tabs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  {t("transactions.txTypeLabel", "Transaction Type")} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setFormType("EXPENSE")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                      formType === "EXPENSE"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>{t("transactions.expenses", "Expense")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("INCOME")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                      formType === "INCOME"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    <span>{t("transactions.income", "Income")}</span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t("transactions.amountLabel", `Amount in ${CURRENCY_SYMBOL} INR`)} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-base font-bold text-slate-400">
                    {CURRENCY_SYMBOL}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-lg font-extrabold text-slate-900 placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>

              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t("transactions.categoryLabel", "Category")} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                >
                  {availableFormCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {tCategory(c.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t("transactions.dateLabel", "Transaction Date")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 h-4 w-4 text-slate-400 my-auto" />
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t("transactions.descLabel", "Description / Note")} <span className="text-slate-400 font-normal">({t("common.optional", "Optional")})</span>
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t("transactions.descPlaceholder", "e.g. Weekly grocery shopping at D-Mart")}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              {/* Error Feedback */}
              {formError && (
                <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {formSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{formSubmitting ? t("transactions.savingTx", "Saving...") : t("transactions.saveTxBtn", "Save Transaction")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
