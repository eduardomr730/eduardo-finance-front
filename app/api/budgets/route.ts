import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { budgetSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/finance-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, route: "budgets" });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const payload = budgetSchema.parse(await request.json());
  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      categoryId: payload.categoryId,
      month: new Date(payload.month),
      amount: new Prisma.Decimal(payload.amount),
      rollover: payload.rollover,
      alertPercent: payload.alertPercent,
    },
  });

  return NextResponse.json(budget, { status: 201 });
}
