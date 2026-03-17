"use server";

import {
  AccountType,
  InvoiceStatus,
  InvestmentTransactionType,
  Prisma,
  TransactionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { startOfMonth } from "date-fns";

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

export async function updateAccountAction(formData: FormData) {
  await ensureWorkspace();

  await prisma.account.update({
    where: { id: String(formData.get("id")) },
    data: {
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "CHECKING") as AccountType,
      institution: String(formData.get("institution") ?? "") || null,
      openingBalance: new Prisma.Decimal(Number(formData.get("openingBalance") ?? 0)),
      isTaxReserved: formData.get("isTaxReserved") === "on",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function deleteAccountAction(formData: FormData) {
  await ensureWorkspace();
  await prisma.account.delete({
    where: { id: String(formData.get("id")) },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
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

export async function updateSettingsAction(formData: FormData) {
  const user = await ensureWorkspace();

  await prisma.appSetting.update({
    where: { userId: user.id },
    data: {
      country: String(formData.get("country") ?? "ES"),
      currency: String(formData.get("currency") ?? "EUR"),
      budgetMonthStartDay: Number(formData.get("budgetMonthStartDay") ?? 1),
      defaultVatRate: new Prisma.Decimal(Number(formData.get("defaultVatRate") ?? 0.21)),
      defaultWithholdingRate: new Prisma.Decimal(
        Number(formData.get("defaultWithholdingRate") ?? 0.15),
      ),
      effectiveIrpfRate: new Prisma.Decimal(
        Number(formData.get("effectiveIrpfRate") ?? 0.24),
      ),
      freelancerMonthlyFee: new Prisma.Decimal(
        Number(formData.get("freelancerMonthlyFee") ?? 0),
      ),
      salaryNetMonthlyEstimate: new Prisma.Decimal(
        Number(formData.get("salaryNetMonthlyEstimate") ?? 0),
      ),
      fiscalCalendarNotes: String(formData.get("fiscalCalendarNotes") ?? "") || null,
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

export async function updateTransactionAction(formData: FormData) {
  await ensureWorkspace();

  await prisma.transaction.update({
    where: { id: String(formData.get("id")) },
    data: {
      date: new Date(String(formData.get("date") ?? new Date().toISOString())),
      type: String(formData.get("type") ?? "EXPENSE") as TransactionType,
      accountId: String(formData.get("accountId") ?? ""),
      categoryId: String(formData.get("categoryId") ?? "") || null,
      amount: new Prisma.Decimal(Number(formData.get("amount") ?? 0)),
      description: String(formData.get("description") ?? ""),
      merchant: String(formData.get("merchant") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      isRecurring: formData.get("isRecurring") === "on",
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

export async function deleteTransactionAction(formData: FormData) {
  await ensureWorkspace();
  await prisma.transaction.delete({
    where: { id: String(formData.get("id")) },
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

export async function updateBudgetAction(formData: FormData) {
  await ensureWorkspace();

  await prisma.budget.update({
    where: { id: String(formData.get("id")) },
    data: {
      categoryId: String(formData.get("categoryId") ?? "") || null,
      month: new Date(String(formData.get("month") ?? new Date().toISOString())),
      amount: new Prisma.Decimal(Number(formData.get("amount") ?? 0)),
      alertPercent: Number(formData.get("alertPercent") ?? 80),
    },
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function deleteBudgetAction(formData: FormData) {
  await ensureWorkspace();
  await prisma.budget.delete({
    where: { id: String(formData.get("id")) },
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
  const month = startOfMonth(issueDate);

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

  await recomputeTaxProvision(user.id, month);

  revalidatePath("/freelance");
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
}

export async function updateInvoiceAction(formData: FormData) {
  const user = await ensureWorkspace();
  const settings = await prisma.appSetting.findUniqueOrThrow({
    where: { userId: user.id },
  });
  const id = String(formData.get("id"));
  const existing = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  const issueDate = new Date(String(formData.get("issueDate") ?? existing.issueDate));
  const month = startOfMonth(issueDate);
  const breakdown = calculateInvoiceBreakdown({
    baseAmount: Number(formData.get("baseAmount") ?? existing.baseAmount),
    vatRate: Number(formData.get("vatRate") ?? existing.vatRate),
    withholdingRate: Number(formData.get("withholdingRate") ?? existing.withholdingRate),
    effectiveIrpfRate: Number(
      formData.get("effectiveIrpfRate") ?? existing.estimatedIrpfRate,
    ),
    freelancerMonthlyFee: Number(settings.freelancerMonthlyFee),
  });

  await prisma.invoice.update({
    where: { id },
    data: {
      issueDate,
      paidDate: formData.get("paidDate")
        ? new Date(String(formData.get("paidDate")))
        : null,
      clientName: String(formData.get("clientName") ?? existing.clientName),
      notes: String(formData.get("notes") ?? "") || null,
      baseAmount: new Prisma.Decimal(breakdown.baseAmount),
      vatRate: new Prisma.Decimal(Number(formData.get("vatRate") ?? existing.vatRate)),
      withholdingRate: new Prisma.Decimal(
        Number(formData.get("withholdingRate") ?? existing.withholdingRate),
      ),
      totalAmount: new Prisma.Decimal(breakdown.totalInvoiceAmount),
      expectedBankAmount: new Prisma.Decimal(breakdown.expectedBankAmount),
      vatAmount: new Prisma.Decimal(breakdown.vatAmount),
      withholdingAmount: new Prisma.Decimal(breakdown.withheldIrpfAmount),
      estimatedIrpfRate: new Prisma.Decimal(
        Number(formData.get("effectiveIrpfRate") ?? existing.estimatedIrpfRate),
      ),
      estimatedIrpfAmount: new Prisma.Decimal(breakdown.estimatedIrpfAmount),
      pendingIrpfProvision: new Prisma.Decimal(breakdown.pendingIrpfProvision),
      realNetAmount: new Prisma.Decimal(breakdown.realNetAmount),
    },
  });

  await recomputeTaxProvision(user.id, month);

  revalidatePath("/freelance");
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
}

export async function deleteInvoiceAction(formData: FormData) {
  const user = await ensureWorkspace();
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: String(formData.get("id")) },
  });
  await prisma.invoice.delete({
    where: { id: invoice.id },
  });
  await recomputeTaxProvision(user.id, startOfMonth(invoice.issueDate));

  revalidatePath("/freelance");
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
}

export async function createInvestmentAssetAction(formData: FormData) {
  const user = await ensureWorkspace();

  await prisma.investmentAsset.create({
    data: {
      userId: user.id,
      accountId: String(formData.get("accountId") ?? "") || null,
      name: String(formData.get("name") ?? ""),
      ticker: String(formData.get("ticker") ?? "") || null,
      assetType: String(formData.get("assetType") ?? "ETF"),
      currency: "EUR",
      units: new Prisma.Decimal(Number(formData.get("units") ?? 0)),
      averageCost: new Prisma.Decimal(Number(formData.get("averageCost") ?? 0)),
      currentPrice: new Prisma.Decimal(Number(formData.get("currentPrice") ?? 0)),
      currentValue: new Prisma.Decimal(Number(formData.get("currentValue") ?? 0)),
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  revalidatePath("/investments");
  revalidatePath("/net-worth");
  revalidatePath("/dashboard");
}

export async function updateInvestmentAssetAction(formData: FormData) {
  await ensureWorkspace();

  await prisma.investmentAsset.update({
    where: { id: String(formData.get("id")) },
    data: {
      accountId: String(formData.get("accountId") ?? "") || null,
      name: String(formData.get("name") ?? ""),
      ticker: String(formData.get("ticker") ?? "") || null,
      assetType: String(formData.get("assetType") ?? "ETF"),
      units: new Prisma.Decimal(Number(formData.get("units") ?? 0)),
      averageCost: new Prisma.Decimal(Number(formData.get("averageCost") ?? 0)),
      currentPrice: new Prisma.Decimal(Number(formData.get("currentPrice") ?? 0)),
      currentValue: new Prisma.Decimal(Number(formData.get("currentValue") ?? 0)),
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  revalidatePath("/investments");
  revalidatePath("/net-worth");
  revalidatePath("/dashboard");
}

export async function deleteInvestmentAssetAction(formData: FormData) {
  await ensureWorkspace();
  await prisma.investmentAsset.delete({
    where: { id: String(formData.get("id")) },
  });

  revalidatePath("/investments");
  revalidatePath("/net-worth");
  revalidatePath("/dashboard");
}

export async function createInvestmentTransactionAction(formData: FormData) {
  const user = await ensureWorkspace();

  await prisma.investmentTransaction.create({
    data: {
      userId: user.id,
      assetId: String(formData.get("assetId") ?? ""),
      accountId: String(formData.get("accountId") ?? "") || null,
      type: String(formData.get("type") ?? "CONTRIBUTION") as InvestmentTransactionType,
      tradeDate: new Date(String(formData.get("tradeDate") ?? new Date().toISOString())),
      units: new Prisma.Decimal(Number(formData.get("units") ?? 0)),
      price: new Prisma.Decimal(Number(formData.get("price") ?? 0)),
      fees: new Prisma.Decimal(Number(formData.get("fees") ?? 0)),
      totalAmount: new Prisma.Decimal(Number(formData.get("totalAmount") ?? 0)),
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  revalidatePath("/investments");
  revalidatePath("/net-worth");
  revalidatePath("/dashboard");
}

export async function deleteInvestmentTransactionAction(formData: FormData) {
  await ensureWorkspace();
  await prisma.investmentTransaction.delete({
    where: { id: String(formData.get("id")) },
  });

  revalidatePath("/investments");
  revalidatePath("/net-worth");
  revalidatePath("/dashboard");
}

async function recomputeTaxProvision(userId: string, month: Date) {
  const settings = await prisma.appSetting.findUniqueOrThrow({
    where: { userId },
  });
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      issueDate: {
        gte: month,
        lt: new Date(month.getFullYear(), month.getMonth() + 1, 1),
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
        userId,
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
      userId,
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
