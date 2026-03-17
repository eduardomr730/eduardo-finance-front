import {
  AccountType,
  InvestmentTransactionType,
  InvoiceStatus,
  Prisma,
  TransactionOrigin,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";

import { calculateInvoiceBreakdown } from "../domain/finance";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "../lib/constants";
import { prisma } from "../lib/db";
import { roundCurrency } from "../lib/utils";

const MONTHLY_SALARY_NET = 2050;
const FREELANCE_BASE = 1949.65;
const VAT_RATE = 0.21;
const WITHHOLDING_RATE = 0.15;
const EFFECTIVE_IRPF_RATE = 0.24;
const FREELANCER_MONTHLY_FEE = 90;

async function main() {
  await prisma.monthlySnapshot.deleteMany();
  await prisma.investmentTransaction.deleteMany();
  await prisma.investmentAsset.deleteMany();
  await prisma.taxProvision.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.salaryProfile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: DEMO_USER_EMAIL,
      name: DEMO_USER_NAME,
      currency: "EUR",
      locale: "es-ES",
      country: "ES",
    },
  });

  const settings = await prisma.appSetting.create({
    data: {
      userId: user.id,
      country: "ES",
      currency: "EUR",
      budgetMonthStartDay: 1,
      defaultVatRate: new Prisma.Decimal(VAT_RATE),
      defaultWithholdingRate: new Prisma.Decimal(WITHHOLDING_RATE),
      effectiveIrpfRate: new Prisma.Decimal(EFFECTIVE_IRPF_RATE),
      freelancerMonthlyFee: new Prisma.Decimal(FREELANCER_MONTHLY_FEE),
      salaryNetMonthlyEstimate: new Prisma.Decimal(MONTHLY_SALARY_NET),
      fiscalCalendarNotes:
        "Orientativo: IVA trimestral, pagos fraccionados IRPF y resumenes anuales.",
    },
  });

  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cuenta nomina",
        type: AccountType.CHECKING,
        institution: "Banco principal",
        openingBalance: new Prisma.Decimal(3200),
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cuenta autonomo",
        type: AccountType.CHECKING,
        institution: "Banco negocio",
        openingBalance: new Prisma.Decimal(1800),
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cuenta impuestos",
        type: AccountType.TAX,
        institution: "Reserva fiscal",
        isTaxReserved: true,
        openingBalance: new Prisma.Decimal(700),
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cuenta ahorro",
        type: AccountType.SAVINGS,
        institution: "Banco ahorro",
        openingBalance: new Prisma.Decimal(4200),
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cuenta inversion",
        type: AccountType.INVESTMENT,
        institution: "Broker manual",
        openingBalance: new Prisma.Decimal(2500),
      },
    }),
  ]);

  const [salaryAccount, freelanceAccount, taxAccount, savingsAccount, investmentAccount] =
    accounts;

  const categories = await createCategories(user.id);
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));

  await prisma.salaryProfile.create({
    data: {
      userId: user.id,
      employer: "Empresa DS",
      grossAnnual: new Prisma.Decimal(30000),
      netMonthly: new Prisma.Decimal(MONTHLY_SALARY_NET),
      payPeriods: 12,
      retentionRate: new Prisma.Decimal(0.18),
      monthlyBonus: new Prisma.Decimal(0),
      activeFrom: subMonths(startOfMonth(new Date()), 6),
      notes: "Perfil salarial de demo",
    },
  });

  const months = Array.from({ length: 6 }, (_, index) =>
    subMonths(startOfMonth(new Date()), 5 - index),
  );

  for (const month of months) {
    await createMonthData({
      userId: user.id,
      month,
      accounts: {
        salaryAccount,
        freelanceAccount,
        taxAccount,
        savingsAccount,
        investmentAccount,
      },
      categories: categoryMap,
      settings,
    });
  }

  console.log(`Seed completado para ${user.email}`);
}

async function createCategories(userId: string) {
  const defaults = [
    ["vivienda", TransactionType.EXPENSE, "#7c6f64"],
    ["suministros", TransactionType.EXPENSE, "#4f6d7a"],
    ["coche", TransactionType.EXPENSE, "#6b7280"],
    ["supermercado", TransactionType.EXPENSE, "#0f766e"],
    ["restaurantes", TransactionType.EXPENSE, "#b45309"],
    ["salud", TransactionType.EXPENSE, "#be123c"],
    ["deporte", TransactionType.EXPENSE, "#1d4ed8"],
    ["compras", TransactionType.EXPENSE, "#7c3aed"],
    ["inversion", TransactionType.INVESTMENT, "#166534"],
    ["impuestos", TransactionType.TAX, "#991b1b"],
    ["salario", TransactionType.INCOME, "#0f766e"],
    ["autonomo", TransactionType.INCOME, "#1d4ed8"],
  ] as const;

  const created = [];

  for (const [index, [slug, kind, color]] of defaults.entries()) {
    const category = await prisma.category.create({
      data: {
        userId,
        slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        kind,
        color,
        sortOrder: index,
      },
    });
    created.push(category);
  }

  const subcategories = [
    ["vivienda", "alquiler"],
    ["suministros", "luz-agua"],
    ["coche", "gastos-coche"],
    ["supermercado", "compra-casa"],
    ["restaurantes", "comidas-fuera"],
    ["salud", "gastos-salud"],
    ["deporte", "gimnasio"],
    ["compras", "compras-varias"],
    ["inversion", "sp500"],
    ["impuestos", "cuota-autonomo"],
    ["impuestos", "provision-irpf"],
    ["salario", "nomina"],
    ["autonomo", "facturas"],
  ] as const;

  for (const [slug, childSlug] of subcategories) {
    const category = created.find((item) => item.slug === slug);
    if (!category) continue;

    await prisma.subcategory.create({
      data: {
        userId,
        categoryId: category.id,
        slug: childSlug,
        name: childSlug.replace(/-/g, " "),
      },
    });
  }

  return created;
}

async function createMonthData({
  userId,
  month,
  accounts,
  categories,
}: {
  userId: string;
  month: Date;
  accounts: {
    salaryAccount: { id: string };
    freelanceAccount: { id: string };
    taxAccount: { id: string };
    savingsAccount: { id: string };
    investmentAccount: { id: string };
  };
  categories: Map<string, { id: string }>;
  settings: { id: string };
}) {
  const invoiceCalc = calculateInvoiceBreakdown({
    baseAmount: FREELANCE_BASE,
    vatRate: VAT_RATE,
    withholdingRate: WITHHOLDING_RATE,
    effectiveIrpfRate: EFFECTIVE_IRPF_RATE,
    freelancerMonthlyFee: FREELANCER_MONTHLY_FEE,
  });

  const issueDate = addMonths(month, 0);
  const paidDate = addMonths(month, 0);

  await prisma.invoice.create({
    data: {
      userId,
      issueDate,
      dueDate: endOfMonth(month),
      paidDate,
      clientName: "Cliente recurrente",
      status: InvoiceStatus.PAID,
      baseAmount: new Prisma.Decimal(invoiceCalc.baseAmount),
      vatRate: new Prisma.Decimal(VAT_RATE),
      withholdingRate: new Prisma.Decimal(WITHHOLDING_RATE),
      totalAmount: new Prisma.Decimal(invoiceCalc.totalInvoiceAmount),
      expectedBankAmount: new Prisma.Decimal(invoiceCalc.expectedBankAmount),
      vatAmount: new Prisma.Decimal(invoiceCalc.vatAmount),
      withholdingAmount: new Prisma.Decimal(invoiceCalc.withheldIrpfAmount),
      estimatedIrpfRate: new Prisma.Decimal(EFFECTIVE_IRPF_RATE),
      estimatedIrpfAmount: new Prisma.Decimal(invoiceCalc.estimatedIrpfAmount),
      pendingIrpfProvision: new Prisma.Decimal(invoiceCalc.pendingIrpfProvision),
      realNetAmount: new Prisma.Decimal(invoiceCalc.realNetAmount),
      notes: "Factura demo mensual",
    },
  });

  const transactionRows = [
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: month,
      amount: MONTHLY_SALARY_NET,
      type: TransactionType.INCOME,
      categoryId: categories.get("salario")?.id,
      description: "Nomina mensual",
    }),
    tx({
      userId,
      accountId: accounts.freelanceAccount.id,
      date: month,
      amount: invoiceCalc.expectedBankAmount,
      type: TransactionType.INCOME,
      categoryId: categories.get("autonomo")?.id,
      description: "Cobro factura autonomo",
    }),
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: addMonths(month, 0),
      amount: -812,
      type: TransactionType.EXPENSE,
      categoryId: categories.get("vivienda")?.id,
      description: "Alquiler",
      merchant: "Casero",
    }),
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: addMonths(month, 0),
      amount: -40,
      type: TransactionType.EXPENSE,
      categoryId: categories.get("suministros")?.id,
      description: "Luz y agua",
    }),
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: addMonths(month, 0),
      amount: -600,
      type: TransactionType.EXPENSE,
      categoryId: categories.get("coche")?.id,
      description: "Coche",
    }),
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: addMonths(month, 0),
      amount: -200,
      type: TransactionType.EXPENSE,
      categoryId: categories.get("supermercado")?.id,
      description: "Supermercado",
    }),
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: addMonths(month, 0),
      amount: -140,
      type: TransactionType.EXPENSE,
      categoryId: categories.get("deporte")?.id,
      description: "Deporte",
    }),
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: addMonths(month, 0),
      amount: -100,
      type: TransactionType.EXPENSE,
      categoryId: categories.get("salud")?.id,
      description: "Salud",
    }),
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: addMonths(month, 0),
      amount: -300,
      type: TransactionType.EXPENSE,
      categoryId: categories.get("restaurantes")?.id,
      description: "Comidas fuera",
    }),
    tx({
      userId,
      accountId: accounts.salaryAccount.id,
      date: addMonths(month, 0),
      amount: -200,
      type: TransactionType.EXPENSE,
      categoryId: categories.get("compras")?.id,
      description: "Compras varias",
    }),
    tx({
      userId,
      accountId: accounts.investmentAccount.id,
      date: addMonths(month, 0),
      amount: -500,
      type: TransactionType.INVESTMENT,
      categoryId: categories.get("inversion")?.id,
      description: "Aportacion SP500",
    }),
    tx({
      userId,
      accountId: accounts.taxAccount.id,
      date: addMonths(month, 0),
      amount: -FREELANCER_MONTHLY_FEE,
      type: TransactionType.TAX,
      categoryId: categories.get("impuestos")?.id,
      description: "Cuota autonomo",
    }),
    tx({
      userId,
      accountId: accounts.freelanceAccount.id,
      transferAccountId: accounts.taxAccount.id,
      date: addMonths(month, 0),
      amount: -roundCurrency(invoiceCalc.vatAmount + invoiceCalc.pendingIrpfProvision),
      type: TransactionType.TRANSFER,
      categoryId: categories.get("impuestos")?.id,
      description: "Provision a cuenta impuestos",
    }),
  ];

  await prisma.transaction.createMany({
    data: transactionRows,
  });

  await prisma.taxProvision.create({
    data: {
      userId,
      month,
      vatAccrued: new Prisma.Decimal(invoiceCalc.vatAmount),
      irpfWithheld: new Prisma.Decimal(invoiceCalc.withheldIrpfAmount),
      irpfEstimated: new Prisma.Decimal(invoiceCalc.estimatedIrpfAmount),
      irpfPending: new Prisma.Decimal(invoiceCalc.pendingIrpfProvision),
      freelancerFee: new Prisma.Decimal(FREELANCER_MONTHLY_FEE),
      availableNet: new Prisma.Decimal(invoiceCalc.realNetAmount),
      apparentCash: new Prisma.Decimal(invoiceCalc.expectedBankAmount),
    },
  });

  const asset = await prisma.investmentAsset.upsert({
    where: {
      id: `${userId}-sp500`,
    },
    update: {},
    create: {
      id: `${userId}-sp500`,
      userId,
      accountId: accounts.investmentAccount.id,
      name: "ETF SP500",
      ticker: "SPY-Demo",
      assetType: "ETF",
      currency: "EUR",
      units: new Prisma.Decimal(0),
      averageCost: new Prisma.Decimal(0),
      currentPrice: new Prisma.Decimal(105),
      currentValue: new Prisma.Decimal(0),
    },
  });

  await prisma.investmentTransaction.create({
    data: {
      userId,
      assetId: asset.id,
      accountId: accounts.investmentAccount.id,
      type: InvestmentTransactionType.CONTRIBUTION,
      tradeDate: month,
      units: new Prisma.Decimal(4.761905),
      price: new Prisma.Decimal(105),
      fees: new Prisma.Decimal(0),
      totalAmount: new Prisma.Decimal(500),
      notes: "Aportacion mensual",
    },
  });

  const existingTransactions = await prisma.investmentTransaction.findMany({
    where: { assetId: asset.id },
  });
  const totalInvested = existingTransactions.reduce(
    (sum, item) => sum + Number(item.totalAmount),
    0,
  );
  const totalUnits = existingTransactions.reduce((sum, item) => sum + Number(item.units), 0);
  const currentPrice = 105 + monthsFromBase(month) * 2.5;

  await prisma.investmentAsset.update({
    where: { id: asset.id },
    data: {
      units: new Prisma.Decimal(totalUnits),
      averageCost: new Prisma.Decimal(roundCurrency(totalInvested / totalUnits)),
      currentPrice: new Prisma.Decimal(currentPrice),
      currentValue: new Prisma.Decimal(roundCurrency(totalUnits * currentPrice)),
    },
  });

  const expenses = 812 + 40 + 600 + 200 + 140 + 100 + 300 + 200 + FREELANCER_MONTHLY_FEE;
  const income = MONTHLY_SALARY_NET + invoiceCalc.expectedBankAmount;
  const taxPending = invoiceCalc.vatAmount + invoiceCalc.pendingIrpfProvision;
  const realCashflow = income - expenses - 500 - taxPending;
  const accountValue = 3200 + 1800 + 700 + 4200;
  const investmentValue = roundCurrency(totalUnits * currentPrice);

  await prisma.monthlySnapshot.create({
    data: {
      userId,
      month,
      incomeTotal: new Prisma.Decimal(income),
      expenseTotal: new Prisma.Decimal(expenses),
      savingsTotal: new Prisma.Decimal(realCashflow),
      investmentTotal: new Prisma.Decimal(500),
      apparentCashflow: new Prisma.Decimal(income - expenses - 500),
      realCashflow: new Prisma.Decimal(realCashflow),
      taxPending: new Prisma.Decimal(taxPending),
      netWorth: new Prisma.Decimal(accountValue + investmentValue),
      budgetConsumedRate: new Prisma.Decimal(0.87),
    },
  });

  const budgetBase = [
    ["vivienda", 812],
    ["suministros", 80],
    ["coche", 600],
    ["supermercado", 260],
    ["restaurantes", 350],
    ["salud", 120],
    ["deporte", 150],
    ["compras", 250],
  ] as const;

  for (const [slug, amount] of budgetBase) {
    const category = categories.get(slug);
    if (!category) continue;
    await prisma.budget.create({
      data: {
        userId,
        categoryId: category.id,
        month,
        amount: new Prisma.Decimal(amount),
        alertPercent: 80,
      },
    });
  }
}

function tx({
  userId,
  accountId,
  transferAccountId,
  date,
  amount,
  type,
  categoryId,
  description,
  merchant,
}: {
  userId: string;
  accountId: string;
  transferAccountId?: string;
  date: Date;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  description: string;
  merchant?: string;
}) {
  return {
    userId,
    accountId,
    transferAccountId,
    date,
    amount: new Prisma.Decimal(amount),
    currency: "EUR",
    type,
    categoryId,
    description,
    merchant,
    notes: null,
    tags: [],
    isRecurring: true,
    origin: TransactionOrigin.SEEDED,
    status: TransactionStatus.CLEARED,
  };
}

function monthsFromBase(date: Date) {
  const now = startOfMonth(new Date());
  const base = startOfMonth(date);
  return (now.getFullYear() - base.getFullYear()) * 12 + (now.getMonth() - base.getMonth());
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
