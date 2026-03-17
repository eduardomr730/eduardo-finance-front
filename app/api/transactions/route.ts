import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { transactionSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/finance-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, route: "transactions" });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const payload = transactionSchema.parse(await request.json());

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      date: new Date(payload.date),
      type: payload.type,
      accountId: payload.accountId,
      transferAccountId: payload.transferAccountId,
      categoryId: payload.categoryId,
      subcategoryId: payload.subcategoryId,
      amount: new Prisma.Decimal(payload.amount),
      currency: payload.currency,
      description: payload.description,
      merchant: payload.merchant,
      notes: payload.notes,
      tags: payload.tags,
      isRecurring: payload.isRecurring,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
