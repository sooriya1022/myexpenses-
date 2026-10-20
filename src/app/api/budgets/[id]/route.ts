import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const budget = await prisma.budget.findFirst({
      where: { id: params.id, userId: session.userId },
    });
    if (!budget) {
      return NextResponse.json({ error: "Budget not found." }, { status: 404 });
    }

    const body = await request.json();
    const parsedAmount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Budget amount must be greater than 0." }, { status: 400 });
    }

    const updated = await prisma.budget.update({
      where: { id: params.id },
      data: { amount: Math.round(parsedAmount * 100) / 100 },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
    });

    return NextResponse.json({ message: "Budget updated.", budget: updated });
  } catch (error) {
    console.error("PUT /api/budgets/[id] error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const budget = await prisma.budget.findFirst({
      where: { id: params.id, userId: session.userId },
    });
    if (!budget) {
      return NextResponse.json({ error: "Budget not found." }, { status: 404 });
    }

    await prisma.budget.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Budget deleted." });
  } catch (error) {
    console.error("DELETE /api/budgets/[id] error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
