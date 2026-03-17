import { InvoiceStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { calculateInvoiceBreakdown } from "@/domain/finance";
import { prisma } from "@/lib/db";
import { invoiceSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/finance-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, route: "invoices" });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const payload = invoiceSchema.parse(await request.json());
  const breakdown = calculateInvoiceBreakdown({
    baseAmount: payload.baseAmount,
    vatRate: payload.vatRate,
    withholdingRate: payload.withholdingRate,
    effectiveIrpfRate: payload.effectiveIrpfRate,
    freelancerMonthlyFee: Number(user.settings?.freelancerMonthlyFee ?? 0),
  });

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      issueDate: new Date(payload.issueDate),
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      paidDate: payload.paidDate ? new Date(payload.paidDate) : null,
      clientName: payload.clientName,
      notes: payload.notes,
      status: payload.status as InvoiceStatus,
      baseAmount: new Prisma.Decimal(breakdown.baseAmount),
      vatRate: new Prisma.Decimal(payload.vatRate),
      withholdingRate: new Prisma.Decimal(payload.withholdingRate),
      totalAmount: new Prisma.Decimal(breakdown.totalInvoiceAmount),
      expectedBankAmount: new Prisma.Decimal(breakdown.expectedBankAmount),
      vatAmount: new Prisma.Decimal(breakdown.vatAmount),
      withholdingAmount: new Prisma.Decimal(breakdown.withheldIrpfAmount),
      estimatedIrpfRate: new Prisma.Decimal(payload.effectiveIrpfRate),
      estimatedIrpfAmount: new Prisma.Decimal(breakdown.estimatedIrpfAmount),
      pendingIrpfProvision: new Prisma.Decimal(breakdown.pendingIrpfProvision),
      realNetAmount: new Prisma.Decimal(breakdown.realNetAmount),
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
