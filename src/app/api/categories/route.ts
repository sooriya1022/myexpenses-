import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    let categories = await prisma.category.findMany({
      where: { userId: session.userId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    // Auto-seed default categories if user has none
    if (categories.length === 0) {
      await prisma.category.createMany({
        data: [
          ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
            name: c.name,
            type: c.type,
            color: c.color,
            icon: c.icon,
            userId: session.userId,
          })),
          ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
            name: c.name,
            type: c.type,
            color: c.color,
            icon: c.icon,
            userId: session.userId,
          })),
        ],
      });

      categories = await prisma.category.findMany({
        where: { userId: session.userId },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      });
    }

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Internal server error fetching categories." }, { status: 500 });
  }
}
