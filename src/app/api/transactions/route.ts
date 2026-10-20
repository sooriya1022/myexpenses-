import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { TransactionType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const limitParam = searchParams.get("limit");
    const categoryIdParam = searchParams.get("categoryId");

    const whereClause: {
      userId: string;
      type?: TransactionType;
      categoryId?: string;
    } = {
      userId: session.userId,
    };

    if (typeParam === "INCOME" || typeParam === "EXPENSE") {
      whereClause.type = typeParam as TransactionType;
    }

    if (categoryIdParam) {
      whereClause.categoryId = categoryIdParam;
    }

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 500) : undefined;

    const [transactions, allUserTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      // Calculate summary totals across all user transactions
      prisma.transaction.findMany({
        where: { userId: session.userId },
        select: {
          amount: true,
          type: true,
        },
      }),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of allUserTransactions) {
      if (t.type === "INCOME") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    }

    const balance = totalIncome - totalExpense;

    return NextResponse.json(
      {
        transactions,
        summary: {
          totalIncome,
          totalExpense,
          balance,
          transactionCount: allUserTransactions.length,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Internal server error fetching transactions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, categoryId, date, description } = body;

    // 1. Validation
    const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number greater than 0." }, { status: 400 });
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "Type must be either 'INCOME' or 'EXPENSE'." }, { status: 400 });
    }

    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json({ error: "A valid category is required." }, { status: 400 });
    }

    const transactionDate = date ? new Date(date) : new Date();
    if (isNaN(transactionDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
    }

    // 2. Verify Category ownership and existence
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.userId,
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found or does not belong to you." }, { status: 404 });
    }

    // 3. Create Transaction with user ownership
    const transaction = await prisma.transaction.create({
      data: {
        amount: Math.round(parsedAmount * 100) / 100, // 2 decimal precision
        type: type as TransactionType,
        categoryId: category.id,
        date: transactionDate,
        description: description ? String(description).trim() : null,
        userId: session.userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "Transaction created successfully.", transaction }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Internal server error creating transaction." }, { status: 500 });
  }
}
