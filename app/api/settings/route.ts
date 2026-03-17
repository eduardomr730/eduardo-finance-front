import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { settingsSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/finance-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, route: "settings" });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.settings) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const payload = settingsSchema.parse(await request.json());
  const settings = await prisma.appSetting.update({
    where: { userId: user.id },
    data: {
      country: payload.country,
      currency: payload.currency,
      budgetMonthStartDay: payload.budgetMonthStartDay,
      defaultVatRate: new Prisma.Decimal(payload.defaultVatRate),
      defaultWithholdingRate: new Prisma.Decimal(payload.defaultWithholdingRate),
      effectiveIrpfRate: new Prisma.Decimal(payload.effectiveIrpfRate),
      freelancerMonthlyFee: new Prisma.Decimal(payload.freelancerMonthlyFee),
      salaryNetMonthlyEstimate: new Prisma.Decimal(payload.salaryNetMonthlyEstimate),
      fiscalCalendarNotes: payload.fiscalCalendarNotes,
    },
  });

  return NextResponse.json(settings);
}
