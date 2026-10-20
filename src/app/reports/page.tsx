"use client";

import { useEffect, useState, useCallback } from "react";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Hash,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieChartIcon,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "current_month" | "previous_month" | "last_6_months" | "all_time";

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
}

interface CategoryBreakdown {
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

interface MonthlyRow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface ReportData {
  summary: Summary;
  categoryBreakdown: CategoryBreakdown[];
  monthlyReport: MonthlyRow[];
  topCategories: CategoryBreakdown[];
  period: string;
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

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

// ─── Main Reports Page ────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { language, t, tCategory } = useLanguage();
  const [period, setPeriod] = useState<Period>("all_time");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const PERIOD_LABELS: Record<Period, string> = {
    current_month: t("dashboard.thisMonth", "This Month"),
    previous_month: t("dashboard.lastMonth", "Last Month"),
    last_6_months: t("dashboard.last6Months", "Last 6 Months"),
    all_time: t("dashboard.allTime", "All Time"),
  };

  const loadReport = useCallback(async (p: Period) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reports?period=${p}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to load report.");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(period);
  }, [period, loadReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports?period=${period}&format=csv&lang=${language}`);
      if (!res.ok) {
        setError("Export failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `myexpense-report-${period}-${language}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const s = data?.summary;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-2 border border-indigo-100">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{t("reports.badge", "Financial Intelligence")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t("reports.title", "Financial Reports")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("reports.subtitle", `Analytical insights, category spending distributions, and CSV data export in ${CURRENCY_SYMBOL} INR.`)}
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || loading || !data?.summary.transactionCount}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition active:scale-[0.98]"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{exporting ? t("reports.generatingCsv", "Generating CSV...") : t("reports.exportCsvBtn", "Export CSV Report")}</span>
        </button>
      </div>

      {/* ── Period Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>{t("reports.reportScope", "Report Scope:")}</span>
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
          <button onClick={() => setError(null)} className="ml-auto text-xs font-bold underline">
            {t("common.dismiss", "Dismiss")}
          </button>
        </div>
      )}

      {/* ── Loading Spinner ── */}
      {loading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600">{t("reports.loadingReports", "Calculating financial analytics...")}</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── Summary Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t("reports.totalIncome", "Total Income")}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {formatINR(s!.totalIncome)}
              </p>
              <p className="mt-2 text-xs text-slate-400">{s!.incomeCount} {t("reports.incomeRecords", "income records")}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t("reports.totalExpenses", "Total Expenses")}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">
                {formatINR(s!.totalExpense)}
              </p>
              <p className="mt-2 text-xs text-slate-400">{s!.expenseCount} {t("reports.expenseRecords", "expense records")}</p>
            </div>

            <div className="col-span-1 sm:col-span-2 lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t("reports.netSavings", "Net Savings")}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <PiggyBank className="h-5 w-5" />
                </div>
              </div>
              <p
                className={`text-2xl sm:text-3xl font-extrabold ${
                  s!.balance >= 0 ? "text-indigo-600" : "text-rose-600"
                }`}
              >
                {s!.balance >= 0 ? "+" : ""}
                {formatINR(s!.balance)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {t("reports.acrossTotal", "Across")} {s!.transactionCount} {t("reports.totalTransactions", "total transactions")}
              </p>
            </div>
          </div>

          {/* ── Empty State ── */}
          {s!.transactionCount === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-4">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t("reports.noDataTitle", "No data for")} {PERIOD_LABELS[period]}</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                {t("reports.noDataDesc", "No transactions were found within this timeframe. Switch periods or record new transactions to view reports.")}
              </p>
            </div>
          )}

          {s!.transactionCount > 0 && (
            <div className="space-y-6">
              {/* ── Charts Grid ── */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Income vs Expenses Bar Chart */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                        <h2 className="text-base font-bold text-slate-900">{t("reports.incomeVsExpense", "Income vs Expenses")}</h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{t("reports.comparisonTimeline", "6-month comparison timeline")}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                        {t("reports.incomeLegend", "Income")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500" />
                        {t("reports.expenseLegend", "Expense")}
                      </span>
                    </div>
                  </div>

                  {data.monthlyReport.some((m) => m.income > 0 || m.expense > 0) ? (
                    <div className="pt-2">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={data.monthlyReport}
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
                                incomeLabel={t("reports.incomeLegend", "Income")}
                                expenseLabel={t("reports.expenseLegend", "Expense")}
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
                      {t("dashboard.noMonthlyData", "No monthly records in the last 6 months.")}
                    </div>
                  )}
                </div>

                {/* Donut Chart: Category Spending */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-indigo-600" />
                        <h2 className="text-base font-bold text-slate-900">{t("reports.spendingByCategory", "Spending by Category")}</h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {PERIOD_LABELS[period]} — {t("reports.breakdownCategories", "breakdown by expense categories")}
                      </p>
                    </div>
                  </div>

                  {data.categoryBreakdown.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-full sm:w-1/2 flex justify-center">
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={data.categoryBreakdown}
                              dataKey="amount"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={3}
                            >
                              {data.categoryBreakdown.map((cat, i) => (
                                <Cell key={`cell-${i}`} fill={cat.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<PieTooltip tCategory={tCategory} />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="w-full sm:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-1">
                        {data.categoryBreakdown.map((cat) => (
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
                      {t("reports.noExpenseRecords", "No expense records for this period.")}
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Financial Table */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">{t("reports.monthlyStatement", "Monthly Financial Statement")}</h2>
                </div>
                <p className="text-xs text-slate-400 mb-5">
                  {t("reports.cashflowStatementDesc", "Last 6 months cashflow statement with income, expenses, and net surplus")}
                </p>

                {data.monthlyReport.some((m) => m.income > 0 || m.expense > 0) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <th className="pb-3 text-left">{t("reports.monthTh", "Month")}</th>
                          <th className="pb-3 text-right text-emerald-600">{t("reports.inflowTh", "Income Inflow")}</th>
                          <th className="pb-3 text-right text-rose-600">{t("reports.outflowTh", "Expense Outflow")}</th>
                          <th className="pb-3 text-right text-indigo-600">{t("reports.netSavingsTh", "Net Savings")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.monthlyReport.map((row) => (
                          <tr key={row.month} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 font-bold text-slate-800">{row.month}</td>
                            <td className="py-3.5 text-right font-semibold text-emerald-600">
                              {row.income > 0 ? (
                                <span className="inline-flex items-center gap-1 justify-end">
                                  <ArrowDownLeft className="h-3 w-3" />
                                  {formatINR(row.income)}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="py-3.5 text-right font-semibold text-rose-600">
                              {row.expense > 0 ? (
                                <span className="inline-flex items-center gap-1 justify-end">
                                  <ArrowUpRight className="h-3 w-3" />
                                  {formatINR(row.expense)}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td
                              className={`py-3.5 text-right font-extrabold ${
                                row.net >= 0 ? "text-indigo-600" : "text-rose-600"
                              }`}
                            >
                              {row.net !== 0 ? (
                                `${row.net >= 0 ? "+" : ""}${formatINR(Math.abs(row.net))}`
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-400 py-6">{t("reports.noExpenseRecords", "No monthly records available.")}</p>
                )}
              </div>

              {/* Top Categories Ranking & Activity Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Spending Categories */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-1">{t("reports.topCategoriesTitle", "Top Spending Categories")}</h3>
                  <p className="text-xs text-slate-400 mb-5">{t("reports.topCategoriesDesc", "Ranked by highest cumulative expenditure")}</p>
                  {data.topCategories.length > 0 ? (
                    <div className="space-y-3">
                      {data.topCategories.map((cat, idx) => (
                        <div
                          key={cat.name}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-xs border border-slate-200">
                            #{idx + 1}
                          </span>
                          <span
                            className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="flex-1 text-sm font-semibold text-slate-800 truncate">
                            {tCategory(cat.name)}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{cat.percentage}%</span>
                          <span className="text-sm font-extrabold text-rose-600 whitespace-nowrap">
                            {formatINR(cat.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">{t("reports.noExpenseRecords", "No expense records available.")}</p>
                  )}
                </div>

                {/* Transaction Volume Summary */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-1">{t("reports.activityVolume", "Activity Volume Summary")}</h3>
                  <p className="text-xs text-slate-400 mb-5">{t("reports.activityVolumeDesc", "Transaction counts and average ticket size")}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                        <Hash className="h-4 w-4 text-slate-400" />
                        <span>{t("reports.totalRecords", "Total Records")}</span>
                      </div>
                      <span className="text-base font-extrabold text-slate-900">
                        {s!.transactionCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-100">
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800">
                        <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                        <span>{t("reports.incomeInflows", "Income Inflows")}</span>
                      </div>
                      <span className="text-base font-extrabold text-emerald-700">
                        {s!.incomeCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-rose-50/60 p-3.5 border border-rose-100">
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-rose-800">
                        <ArrowUpRight className="h-4 w-4 text-rose-600" />
                        <span>{t("reports.expenseOutflows", "Expense Outflows")}</span>
                      </div>
                      <span className="text-base font-extrabold text-rose-700">
                        {s!.expenseCount}
                      </span>
                    </div>

                    {s!.transactionCount > 0 && (
                      <div className="flex items-center justify-between rounded-2xl bg-indigo-50/60 p-3.5 border border-indigo-100">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-indigo-800">
                          <PiggyBank className="h-4 w-4 text-indigo-600" />
                          <span>{t("reports.averageTransaction", "Average Transaction")}</span>
                        </div>
                        <span className="text-base font-extrabold text-indigo-700">
                          {formatINR((s!.totalIncome + s!.totalExpense) / s!.transactionCount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
