import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { transactionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = transactionSchema.partial().parse(await request.json());

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...(payload.date ? { date: new Date(payload.date) } : {}),
      ...(payload.type ? { type: payload.type } : {}),
      ...(payload.accountId ? { accountId: payload.accountId } : {}),
      ...(payload.transferAccountId !== undefined
        ? { transferAccountId: payload.transferAccountId }
        : {}),
      ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId } : {}),
      ...(payload.subcategoryId !== undefined
        ? { subcategoryId: payload.subcategoryId }
        : {}),
      ...(payload.amount !== undefined
        ? { amount: new Prisma.Decimal(payload.amount) }
        : {}),
      ...(payload.currency ? { currency: payload.currency } : {}),
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.merchant !== undefined ? { merchant: payload.merchant } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.tags ? { tags: payload.tags } : {}),
      ...(payload.isRecurring !== undefined
        ? { isRecurring: payload.isRecurring }
        : {}),
    },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
