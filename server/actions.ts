"use server";

import {
  AccountType,
  InvoiceStatus,
  InvestmentTransactionType,
  Prisma,
  TransactionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { calculateInvoiceBreakdown } from "@/domain/finance";
import { prisma } from "@/lib/db";
import { ensureWorkspace } from "@/server/workspace";

export async function createAccountAction(formData: FormData) {
  const user = await ensureWorkspace();

  await prisma.account.create({
    data: {
      userId: user.id,
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "CHECKING") as AccountType,
      institution: String(formData.get("institution") ?? "") || null,
      openingBalance: new Prisma.Decimal(Number(formData.get("openingBalance") ?? 0)),
      isTaxReserved: formData.get("isTaxReserved") === "on",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function saveSalaryProfileAction(formData: FormData) {
  const user = await ensureWorkspace();
  const grossAnnual = Number(formData.get("grossAnnual") ?? 0);
  const netMonthly = Number(formData.get("netMonthly") ?? 0);
  const payPeriods = Number(formData.get("payPeriods") ?? 12);
  const employer = String(formData.get("employer") ?? "Empresa");

  const current = await prisma.salaryProfile.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (current) {
    await prisma.salaryProfile.update({
      where: { id: current.id },
      data: {
        employer,
        grossAnnual: new Prisma.Decimal(grossAnnual),
        netMonthly: new Prisma.Decimal(netMonthly),
        payPeriods,
        retentionRate: new Prisma.Decimal(Number(formData.get("retentionRate") ?? 0)),
        monthlyBonus: new Prisma.Decimal(Number(formData.get("monthlyBonus") ?? 0)),
        notes: String(formData.get("notes") ?? "") || null,
      },
    });
  } else {
    await prisma.salaryProfile.create({
      data: {
        userId: user.id,
        employer,
        grossAnnual: new Prisma.Decimal(grossAnnual),
        netMonthly: new Prisma.Decimal(netMonthly),
        payPeriods,
        retentionRate: new Prisma.Decimal(Number(formData.get("retentionRate") ?? 0)),
        monthlyBonus: new Prisma.Decimal(Number(formData.get("monthlyBonus") ?? 0)),
        activeFrom: new Date(),
        notes: String(formData.get("notes") ?? "") || null,
      },
    });
  }

  await prisma.appSetting.update({
    where: { userId: user.id },
    data: {
      salaryNetMonthlyEstimate: new Prisma.Decimal(netMonthly),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function createTransactionAction(formData: FormData) {
  const user = await ensureWorkspace();

  await prisma.transaction.create({
    data: {
      userId: user.id,
      date: new Date(String(formData.get("date") ?? new Date().toISOString())),
      type: String(formData.get("type") ?? "EXPENSE") as TransactionType,
      accountId: String(formData.get("accountId") ?? ""),
      categoryId: String(formData.get("categoryId") ?? "") || null,
      amount: new Prisma.Decimal(Number(formData.get("amount") ?? 0)),
      currency: "EUR",
      description: String(formData.get("description") ?? ""),
      merchant: String(formData.get("merchant") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      tags: [],
      isRecurring: formData.get("isRecurring") === "on",
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

export async function createBudgetAction(formData: FormData) {
  const user = await ensureWorkspace();

  await prisma.budget.create({
    data: {
      userId: user.id,
      categoryId: String(formData.get("categoryId") ?? "") || null,
      month: new Date(String(formData.get("month") ?? new Date().toISOString())),
      amount: new Prisma.Decimal(Number(formData.get("amount") ?? 0)),
      alertPercent: Number(formData.get("alertPercent") ?? 80),
    },
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function createInvoiceAction(formData: FormData) {
  const user = await ensureWorkspace();
  const settings = await prisma.appSetting.findUniqueOrThrow({
    where: { userId: user.id },
  });

  const baseAmount = Number(formData.get("baseAmount") ?? 0);
  const vatRate = Number(formData.get("vatRate") ?? Number(settings.defaultVatRate));
  const withholdingRate = Number(
    formData.get("withholdingRate") ?? Number(settings.defaultWithholdingRate),
  );
  const effectiveIrpfRate = Number(
    formData.get("effectiveIrpfRate") ?? Number(settings.effectiveIrpfRate),
  );

  const breakdown = calculateInvoiceBreakdown({
    baseAmount,
    vatRate,
    withholdingRate,
    effectiveIrpfRate,
    freelancerMonthlyFee: Number(settings.freelancerMonthlyFee),
  });

  const issueDate = new Date(String(formData.get("issueDate") ?? new Date().toISOString()));

  await prisma.invoice.create({
    data: {
      userId: user.id,
      issueDate,
      dueDate: issueDate,
      paidDate: formData.get("paidDate")
        ? new Date(String(formData.get("paidDate")))
        : null,
      clientName: String(formData.get("clientName") ?? "Cliente"),
      notes: String(formData.get("notes") ?? "") || null,
      status: InvoiceStatus.PAID,
      baseAmount: new Prisma.Decimal(breakdown.baseAmount),
      vatRate: new Prisma.Decimal(vatRate),
      withholdingRate: new Prisma.Decimal(withholdingRate),
      totalAmount: new Prisma.Decimal(breakdown.totalInvoiceAmount),
      expectedBankAmount: new Prisma.Decimal(breakdown.expectedBankAmount),
      vatAmount: new Prisma.Decimal(breakdown.vatAmount),
      withholdingAmount: new Prisma.Decimal(breakdown.withheldIrpfAmount),
      estimatedIrpfRate: new Prisma.Decimal(effectiveIrpfRate),
      estimatedIrpfAmount: new Prisma.Decimal(breakdown.estimatedIrpfAmount),
      pendingIrpfProvision: new Prisma.Decimal(breakdown.pendingIrpfProvision),
      realNetAmount: new Prisma.Decimal(breakdown.realNetAmount),
    },
  });

  const month = new Date(issueDate.getFullYear(), issueDate.getMonth(), 1);
  const invoices = await prisma.invoice.findMany({
    where: {
      userId: user.id,
      issueDate: {
        gte: month,
        lt: new Date(issueDate.getFullYear(), issueDate.getMonth() + 1, 1),
      },
    },
  });

  const vatAccrued = invoices.reduce((sum, item) => sum + Number(item.vatAmount), 0);
  const irpfWithheld = invoices.reduce((sum, item) => sum + Number(item.withholdingAmount), 0);
  const irpfEstimated = invoices.reduce(
    (sum, item) => sum + Number(item.estimatedIrpfAmount),
    0,
  );
  const irpfPending = invoices.reduce(
    (sum, item) => sum + Number(item.pendingIrpfProvision),
    0,
  );
  const availableNet = invoices.reduce((sum, item) => sum + Number(item.realNetAmount), 0);
  const apparentCash = invoices.reduce(
    (sum, item) => sum + Number(item.expectedBankAmount),
    0,
  );

  await prisma.taxProvision.upsert({
    where: {
      userId_month: {
        userId: user.id,
        month,
      },
    },
    update: {
      vatAccrued: new Prisma.Decimal(vatAccrued),
      irpfWithheld: new Prisma.Decimal(irpfWithheld),
      irpfEstimated: new Prisma.Decimal(irpfEstimated),
      irpfPending: new Prisma.Decimal(irpfPending),
      freelancerFee: settings.freelancerMonthlyFee,
      availableNet: new Prisma.Decimal(availableNet),
      apparentCash: new Prisma.Decimal(apparentCash),
    },
    create: {
      userId: user.id,
      month,
      vatAccrued: new Prisma.Decimal(vatAccrued),
      irpfWithheld: new Prisma.Decimal(irpfWithheld),
      irpfEstimated: new Prisma.Decimal(irpfEstimated),
      irpfPending: new Prisma.Decimal(irpfPending),
      freelancerFee: settings.freelancerMonthlyFee,
      availableNet: new Prisma.Decimal(availableNet),
      apparentCash: new Prisma.Decimal(apparentCash),
    },
  });

  revalidatePath("/freelance");
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
}

export async function resetWorkspaceDataAction() {
  const user = await ensureWorkspace();

  await prisma.monthlySnapshot.deleteMany({ where: { userId: user.id } });
  await prisma.investmentTransaction.deleteMany({ where: { userId: user.id } });
  await prisma.investmentAsset.deleteMany({ where: { userId: user.id } });
  await prisma.taxProvision.deleteMany({ where: { userId: user.id } });
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.salaryProfile.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/freelance");
  revalidatePath("/taxes");
  revalidatePath("/investments");
  revalidatePath("/net-worth");
  revalidatePath("/settings");
}
