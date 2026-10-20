"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  ArrowRight,
  Plus,
  Loader2,
  Receipt,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  AlertCircle,
  Sparkles,
  Wallet,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryExpense {
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

interface RecentTransaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
    type: string;
  };
}

interface DashboardData {
  summary: Summary;
  monthlyChartData: MonthlyData[];
  categoryExpenses: CategoryExpense[];
  recentTransactions: RecentTransaction[];
  period: string;
}

type Period = "current_month" | "previous_month" | "last_6_months" | "all_time";

// ─── Custom Tooltip for Bar Chart ─────────────────────────────────────────────

function BarTooltip({
  active,
  payload,
  label,
  incomeLabel,
  expenseLabel,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  incomeLabel: string;
  expenseLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xl text-xs">
      <p className="font-bold text-slate-800 mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p) => {
          const displayLabel = p.name.toLowerCase() === "income" ? incomeLabel : expenseLabel;
          return (
            <div key={p.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-slate-500 capitalize">{displayLabel}:</span>
              </div>
              <span className="font-extrabold text-slate-800">{formatINR(p.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Custom Tooltip for Pie Chart ─────────────────────────────────────────────

function PieTooltip({
  active,
  payload,
  tCategory,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentage: number; color: string } }>;
  tCategory: (name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xl text-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="font-bold text-slate-800">{tCategory(item.name)}</span>
      </div>
      <p className="text-slate-500">
        <span className="font-extrabold text-slate-900">{formatINR(item.value)}</span>
      </p>
      <p className="text-slate-500 mt-0.5">
        <span className="font-bold text-indigo-600">({item.payload.percentage}%)</span>
      </p>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { t, tCategory } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [period, setPeriod] = useState<Period>("all_time");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PERIOD_LABELS: Record<Period, string> = {
    current_month: t("dashboard.thisMonth", "This Month"),
    previous_month: t("dashboard.lastMonth", "Last Month"),
    last_6_months: t("dashboard.last6Months", "Last 6 Months"),
    all_time: t("dashboard.allTime", "All Time"),
  };

  const loadDashboard = useCallback(
    async (selectedPeriod: Period) => {
      try {
        setLoading(true);
        setError(null);

        const [userRes, dashRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/dashboard?period=${selectedPeriod}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (!dashRes.ok) {
          if (dashRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to load dashboard data.");
        }

        const dashData: DashboardData = await dashRes.json();
        setData(dashData);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Unable to load dashboard. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    loadDashboard(period);
  }, [period, loadDashboard]);

  const summary = data?.summary ?? {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  };
  const hasTransactions = summary.transactionCount > 0;

  return (
    <div className="space-y-8">
      {/* ── Top Welcome & Action Banner ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-2 border border-indigo-100">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("dashboard.badge", "Personal Finance Overview")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {loading ? t("dashboard.welcomeBack", "Welcome back") : `${t("dashboard.welcomeBack", "Welcome back")}, ${user?.name || t("nav.member", "Member")}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("dashboard.subtitle", `Real-time financial performance and category analytics in ${CURRENCY_SYMBOL} INR.`)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/budgets"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <PiggyBank className="h-4 w-4 text-indigo-600" />
            <span>{t("dashboard.manageBudgets", "Manage Budgets")}</span>
          </Link>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>{t("dashboard.addTransaction", "Add Transaction")}</span>
          </Link>
        </div>
      </div>

      {/* ── Period Selector Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>{t("dashboard.timeline", "Timeline:")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                period === p
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => loadDashboard(period)}
            className="ml-auto text-xs font-bold underline"
          >
            {t("common.retry", "Retry")}
          </button>
        </div>
      )}

      {/* ── 4 Modern Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Balance */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.netBalance", "Net Balance")}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              summary.balance >= 0 ? "text-indigo-600" : "text-rose-600"
            }`}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            ) : (
              formatINR(summary.balance)
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{PERIOD_LABELS[period]}</span>
            <span
              className={`font-semibold ${
                summary.balance >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {summary.balance >= 0 ? t("dashboard.netSurplus", "Net Surplus") : t("dashboard.deficit", "Deficit")}
            </span>
          </div>
        </div>

        {/* Total Income */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.totalInflows", "Total Inflows")}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            ) : (
              formatINR(summary.totalIncome)
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{PERIOD_LABELS[period]}</span>
            <span className="font-semibold text-emerald-700">{t("dashboard.salaryReceipts", "Salary & Receipts")}</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.totalSpending", "Total Spending")}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            ) : (
              formatINR(summary.totalExpense)
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{PERIOD_LABELS[period]}</span>
            <span className="font-semibold text-rose-700">{t("dashboard.recordedOutflows", "Recorded Outflows")}</span>
          </div>
        </div>

        {/* Transactions Count */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.activityCount", "Activity Count")}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Hash className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            ) : (
              summary.transactionCount
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{t("dashboard.totalRecords", "Total Records")}</span>
            <span className="font-semibold text-slate-600">
              {summary.transactionCount} {t("dashboard.items", "items")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {!loading && !error && !hasTransactions && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-4">
            <Receipt className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t("dashboard.noTxTitle", "No transactions recorded yet")}</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            {t("dashboard.noTxDesc", "Add your income and expense transactions to see live bar charts, spending category breakdowns, and monthly trends.")}
          </p>
          <Link
            href="/transactions"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t("dashboard.recordFirstTx", "Record First Transaction")}</span>
          </Link>
        </div>
      )}

      {/* ── Charts & Visual Analytics Section ── */}
      {!loading && !error && hasTransactions && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Income vs Expenses Bar Chart */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-base font-bold text-slate-900">{t("dashboard.incomeVsExpense", "Income vs Expenses")}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{t("dashboard.cashflow6Months", "6-month cashflow comparison")}</p>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    {t("dashboard.incomeLegend", "Income")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500" />
                    {t("dashboard.expenseLegend", "Expense")}
                  </span>
                </div>
              </div>

              {data?.monthlyChartData && data.monthlyChartData.some((m) => m.income > 0 || m.expense > 0) ? (
                <div className="pt-2">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={data.monthlyChartData}
                      margin={{ top: 8, right: 8, bottom: 0, left: -10 }}
                      barCategoryGap="28%"
                      barGap={5}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                        width={50}
                      />
                      <Tooltip
                        content={
                          <BarTooltip
                            incomeLabel={t("dashboard.incomeLegend", "Income")}
                            expenseLabel={t("dashboard.expenseLegend", "Expense")}
                          />
                        }
                      />
                      <Bar
                        dataKey="income"
                        name="Income"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="expense"
                        name="Expense"
                        fill="#f43f5e"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
                  {t("dashboard.noMonthlyData", "No transaction data in the last 6 months.")}
                </div>
              )}
            </div>

            {/* Donut Chart: Spending by Category */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-base font-bold text-slate-900">{t("dashboard.spendingByCategory", "Spending by Category")}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {PERIOD_LABELS[period]} — {t("dashboard.expenseBreakdown", "breakdown by expense categories")}
                  </p>
                </div>
              </div>

              {data?.categoryExpenses && data.categoryExpenses.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-full sm:w-1/2 flex justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.categoryExpenses}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {data.categoryExpenses.map((cat, i) => (
                            <Cell key={`cell-${i}`} fill={cat.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip tCategory={tCategory} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full sm:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {data.categoryExpenses.map((cat) => (
                      <div
                        key={cat.name}
                        className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-slate-700 font-medium truncate max-w-[120px]">
                            {tCategory(cat.name)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-slate-400 font-semibold">{cat.percentage}%</span>
                          <span className="font-bold text-slate-900 whitespace-nowrap">
                            {formatINR(cat.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
                  {t("dashboard.noMonthlyData", "No expense records for this period.")}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Spending History Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">{t("dashboard.monthlySpendingOverview", "Monthly Spending Overview")}</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              {t("dashboard.monthlySpendingDesc", "Historical income, expenses, and net savings for the past 6 months")}
            </p>

            {data?.monthlyChartData && data.monthlyChartData.some((m) => m.income > 0 || m.expense > 0) ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 text-left">{t("common.month", "Month")}</th>
                      <th className="pb-3 text-right text-emerald-600">{t("dashboard.inflowsTh", "Inflows (Income)")}</th>
                      <th className="pb-3 text-right text-rose-600">{t("dashboard.outflowsTh", "Outflows (Expense)")}</th>
                      <th className="pb-3 text-right text-indigo-600">{t("dashboard.netSurplusTh", "Net Surplus")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.monthlyChartData.map((row) => {
                      const net = row.income - row.expense;
                      return (
                        <tr key={row.month} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 font-bold text-slate-800">{row.month}</td>
                          <td className="py-3.5 text-right font-semibold text-emerald-600">
                            {row.income > 0 ? (
                              formatINR(row.income)
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right font-semibold text-rose-600">
                            {row.expense > 0 ? (
                              formatINR(row.expense)
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td
                            className={`py-3.5 text-right font-extrabold ${
                              net >= 0 ? "text-indigo-600" : "text-rose-600"
                            }`}
                          >
                            {net !== 0 ? (
                              <>
                                {net >= 0 ? "+" : ""}
                                {formatINR(Math.abs(net))}
                              </>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-slate-400">
                {t("dashboard.noMonthlyData", "No monthly data available.")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Recent Transactions Card ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              {t("dashboard.recentTransactions", "Recent Transactions")}
            </h2>
            <p className="text-xs text-slate-400">{t("dashboard.fiveLatest", "Your 5 latest financial activities")}</p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            <span>{t("dashboard.viewAll", "View All")}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[120px] items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : !data?.recentTransactions?.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">{t("dashboard.noRecentTx", "No recent transactions")}</p>
            <Link
              href="/transactions"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("dashboard.addTx", "Add Transaction")}</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3.5 hover:bg-slate-50/60 transition px-2 rounded-xl"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${
                      tx.type === "INCOME"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}
                  >
                    {tx.type === "INCOME" ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {tCategory(tx.category.name)}
                      </span>
                      <span
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: tx.category.color }}
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                      {tx.description || tx.type}
                    </p>
                  </div>
                </div>

                <div
                  className={`ml-4 flex-shrink-0 font-extrabold text-sm sm:text-base ${
                    tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {tx.type === "INCOME" ? "+" : "-"}
                  {formatINR(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
