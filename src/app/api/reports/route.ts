import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";

function getDateRange(period: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case "current_month":
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
    case "previous_month":
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59, 999) };
    case "last_6_months":
      return { start: new Date(y, m - 5, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
    default:
      return { start: null, end: null };
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "all_time";
    const format = searchParams.get("format"); // "csv" for export

    const { start, end } = getDateRange(period);
    const dateFilter = start && end ? { date: { gte: start, lte: end } } : {};

    // Fetch all transactions in period with category
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.userId, ...dateFilter },
      include: {
        category: { select: { id: true, name: true, color: true, type: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    // ── CSV Export ──────────────────────────────────────────────────────────────
    if (format === "csv") {
      const rows = [
        ["Date", "Type", "Category", "Description", "Amount (INR)"],
        ...transactions.map((tx) => [
          new Date(tx.date).toLocaleDateString("en-IN"),
          tx.type,
          tx.category.name,
          tx.description ?? "",
          tx.amount.toFixed(2),
        ]),
      ];
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="myexpense-report-${period}.csv"`,
        },
      });
    }

    // ── Analytics ───────────────────────────────────────────────────────────────
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const tx of transactions) {
      if (tx.type === "INCOME") { totalIncome += tx.amount; incomeCount++; }
      else { totalExpense += tx.amount; expenseCount++; }
    }

    // Category expense breakdown
    const catMap: Record<string, { name: string; color: string; amount: number }> = {};
    for (const tx of transactions) {
      if (tx.type !== "EXPENSE") continue;
      if (!catMap[tx.category.id]) {
        catMap[tx.category.id] = { name: tx.category.name, color: tx.category.color, amount: 0 };
      }
      catMap[tx.category.id].amount += tx.amount;
    }
    const categoryBreakdown = Object.values(catMap)
      .sort((a, b) => b.amount - a.amount)
      .map((c) => ({
        ...c,
        percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
      }));

    // Monthly report (last 6 months, always fixed)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const allForMonthly = await prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: sixMonthsAgo } },
      select: { amount: true, type: true, date: true },
    });

    const monthlyMap: Record<string, { income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { income: 0, expense: 0 };
    }
    for (const tx of allForMonthly) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        if (tx.type === "INCOME") monthlyMap[key].income += tx.amount;
        else monthlyMap[key].expense += tx.amount;
      }
    }
    const monthlyReport = Object.entries(monthlyMap).map(([key, v]) => {
      const [yr, mo] = key.split("-");
      const label = new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleString("en-IN", {
        month: "short", year: "2-digit",
      });
      return { month: label, income: v.income, expense: v.expense, net: v.income - v.expense };
    });

    // Top 5 categories
    const topCategories = categoryBreakdown.slice(0, 5);

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length,
        incomeCount,
        expenseCount,
      },
      categoryBreakdown,
      monthlyReport,
      topCategories,
      period,
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
