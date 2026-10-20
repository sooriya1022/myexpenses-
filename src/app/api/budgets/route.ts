import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month." }, { status: 400 });
    }
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year." }, { status: 400 });
    }

    // Fetch budgets for the selected month/year
    const budgets = await prisma.budget.findMany({
      where: { userId: session.userId, month, year },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch actual expenses for this month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const expenses = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
        type: "EXPENSE",
        date: { gte: startDate, lte: endDate },
      },
      select: { categoryId: true, amount: true },
    });

    // Build spending map by categoryId
    const spendingMap: Record<string, number> = {};
    for (const tx of expenses) {
      spendingMap[tx.categoryId] = (spendingMap[tx.categoryId] || 0) + tx.amount;
    }

    // Attach progress to each budget
    const budgetsWithProgress = budgets.map((b) => {
      const spent = b.categoryId ? (spendingMap[b.categoryId] || 0) : 0;
      const remaining = b.amount - spent;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      const status =
        percentage >= 100 ? "over" : percentage >= 80 ? "near" : "under";
      return { ...b, spent, remaining, percentage, status };
    });

    // Overall summary
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgetsWithProgress.reduce((s, b) => s + b.spent, 0);
    const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return NextResponse.json({
      budgets: budgetsWithProgress,
      summary: {
        totalBudget,
        totalSpent,
        remaining: totalBudget - totalSpent,
        percentage: overallPct,
        status: overallPct >= 100 ? "over" : overallPct >= 80 ? "near" : "under",
      },
      month,
      year,
    });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, amount, month, year } = body;

    // Validation
    const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Budget amount must be greater than 0." }, { status: 400 });
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return NextResponse.json({ error: "Month must be between 1 and 12." }, { status: 400 });
    }
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return NextResponse.json({ error: "Year is invalid." }, { status: 400 });
    }

    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json({ error: "A valid category is required." }, { status: 400 });
    }

    // Verify category ownership
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: session.userId, type: "EXPENSE" },
    });
    if (!category) {
      return NextResponse.json({ error: "Expense category not found." }, { status: 404 });
    }

    // Duplicate check
    const existing = await prisma.budget.findFirst({
      where: {
        userId: session.userId,
        categoryId,
        month: parsedMonth,
        year: parsedYear,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A budget for this category and month already exists." },
        { status: 409 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        userId: session.userId,
        categoryId,
        amount: Math.round(parsedAmount * 100) / 100,
        month: parsedMonth,
        year: parsedYear,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
    });

    return NextResponse.json({ message: "Budget created.", budget }, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
