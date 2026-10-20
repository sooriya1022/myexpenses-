import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";

function getDateRange(period: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case "current_month":
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0, 23, 59, 59, 999),
      };
    case "previous_month":
      return {
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 0, 23, 59, 59, 999),
      };
    case "last_6_months":
      return {
        start: new Date(year, month - 5, 1),
        end: new Date(year, month + 1, 0, 23, 59, 59, 999),
      };
    case "all_time":
    default:
      return { start: null, end: null };
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "all_time";

    const { start, end } = getDateRange(period);

    // Build date filter
    const dateFilter =
      start && end
        ? { date: { gte: start, lte: end } }
        : {};

    // 1. Fetch all transactions in period with category
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
        ...dateFilter,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    // 2. Summary totals
    let totalIncome = 0;
    let totalExpense = 0;
    for (const tx of transactions) {
      if (tx.type === "INCOME") totalIncome += tx.amount;
      else totalExpense += tx.amount;
    }
    const balance = totalIncome - totalExpense;

    // 3. Monthly breakdown for Income vs Expense bar chart
    // We always compute last 6 months for the bar chart regardless of period
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const allTxForChart = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
        date: { gte: sixMonthsAgo },
      },
      select: { amount: true, type: true, date: true },
    });

    // Build monthly map for chart
    const monthlyMap: Record<string, { income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { income: 0, expense: 0 };
    }

    for (const tx of allTxForChart) {
      const txDate = new Date(tx.date);
      const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        if (tx.type === "INCOME") monthlyMap[key].income += tx.amount;
        else monthlyMap[key].expense += tx.amount;
      }
    }

    const monthlyChartData = Object.entries(monthlyMap).map(([key, vals]) => {
      const [yr, mo] = key.split("-");
      const label = new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      return { month: label, income: vals.income, expense: vals.expense };
    });

    // 4. Category-wise expense breakdown (filtered by period)
    const categoryMap: Record<
      string,
      { name: string; color: string; icon: string; amount: number }
    > = {};

    for (const tx of transactions) {
      if (tx.type !== "EXPENSE") continue;
      const catId = tx.category.id;
      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          name: tx.category.name,
          color: tx.category.color,
          icon: tx.category.icon,
          amount: 0,
        };
      }
      categoryMap[catId].amount += tx.amount;
    }

    const categoryExpenses = Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .filter((c) => c.amount > 0)
      .map((c) => ({
        ...c,
        percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
      }));

    // 5. Recent 5 transactions (all time, sorted by most recent)
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: session.userId },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
    });

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length,
      },
      monthlyChartData,
      categoryExpenses,
      recentTransactions,
      period,
    });
  } catch (error: unknown) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
