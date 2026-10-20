import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { TransactionType } from "@prisma/client";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.userId,
      },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error fetching transaction." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    const body = await request.json();
    const { amount, type, categoryId, date, description } = body;

    const updateData: {
      amount?: number;
      type?: TransactionType;
      categoryId?: string;
      date?: Date;
      description?: string | null;
    } = {};

    if (amount !== undefined) {
      const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number greater than 0." }, { status: 400 });
      }
      updateData.amount = Math.round(parsedAmount * 100) / 100;
    }

    if (type !== undefined) {
      if (type !== "INCOME" && type !== "EXPENSE") {
        return NextResponse.json({ error: "Type must be either 'INCOME' or 'EXPENSE'." }, { status: 400 });
      }
      updateData.type = type as TransactionType;
    }

    if (categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: session.userId,
        },
      });

      if (!category) {
        return NextResponse.json({ error: "Category not found or does not belong to you." }, { status: 404 });
      }
      updateData.categoryId = category.id;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
      }
      updateData.date = parsedDate;
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(
      { message: "Transaction updated successfully.", transaction: updatedTransaction },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PUT /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error updating transaction." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Transaction deleted successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error deleting transaction." }, { status: 500 });
  }
}
