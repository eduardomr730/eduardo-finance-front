import "server-only";

import { Prisma, TransactionType } from "@prisma/client";
import { format, startOfMonth } from "date-fns";

import {
  calculateBudgetProgress,
  calculateBudgetTotals,
  calculateMonthlyAggregates,
  calculateMonthlyForecast,
  calculateNetWorth,
  calculateRealSavings,
} from "@/domain/finance";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/prisma-helpers";
import { ensureWorkspace } from "@/server/workspace";

const dashboardInclude = {
  settings: true,
  monthlySnapshots: {
    orderBy: { month: "asc" as const },
    take: 6,
  },
  accounts: true,
  investmentAssets: true,
  invoices: {
    orderBy: { issueDate: "desc" as const },
    take: 6,
  },
  salaryProfiles: {
    orderBy: { activeFrom: "desc" as const },
    take: 1,
  },
} satisfies Prisma.UserInclude;

export async function getCurrentUser() {
  try {
    const workspace = await ensureWorkspace();

    return await prisma.user.findUnique({
      where: { id: workspace.id },
      include: dashboardInclude,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Finance service fallback: database unavailable", error);
    }
    return null;
  }
}

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user || !user.settings) return null;

  const now = startOfMonth(new Date());
  const [monthTransactions, budgets, taxProvision] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: now,
        },
      },
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    }),
    prisma.budget.findMany({
      where: {
        userId: user.id,
        month: now,
      },
      include: { category: true },
    }),
    prisma.taxProvision.findUnique({
      where: {
        userId_month: {
          userId: user.id,
          month: now,
        },
      },
    }),
  ]);

  const monthIncome = sumByType(monthTransactions, TransactionType.INCOME);
  const monthExpenses = Math.abs(sumByType(monthTransactions, TransactionType.EXPENSE));
  const monthInvestment = Math.abs(sumByType(monthTransactions, TransactionType.INVESTMENT));
  const taxPending = taxProvision
    ? toNumber(taxProvision.vatAccrued) + toNumber(taxProvision.irpfPending)
    : 0;
  const savings = calculateRealSavings({
    income: monthIncome,
    expenses: monthExpenses,
    investment: monthInvestment,
    taxPending,
  });
  const investmentValue = user.investmentAssets.reduce(
    (sum, asset) => sum + toNumber(asset.currentValue),
    0,
  );
  const cashAccounts = user.accounts.reduce(
    (sum, account) => sum + toNumber(account.openingBalance),
    0,
  );
  const netWorth = calculateNetWorth({ cashAccounts, investmentValue });
  const budgetItems = budgets.map((budget) =>
    calculateBudgetProgress(
      budget.category?.name ?? "General",
      toNumber(budget.amount),
      Math.abs(
        monthTransactions
          .filter((transaction) => transaction.categoryId === budget.categoryId)
          .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0),
      ),
    ),
  );
  const budgetTotals = calculateBudgetTotals(budgetItems);
  const snapshots = calculateMonthlyAggregates(
    user.monthlySnapshots.map((snapshot) => ({
      month: format(snapshot.month, "MMM"),
      income: toNumber(snapshot.incomeTotal),
      expenses: toNumber(snapshot.expenseTotal),
      investment: toNumber(snapshot.investmentTotal),
      taxPending: toNumber(snapshot.taxPending),
    })),
  );

  const categoryBreakdown = budgetItems
    .filter((item) => item.spent > 0)
    .map((item) => ({ name: item.category, value: item.spent }));

  return {
    user,
    kpis: {
      income: monthIncome,
      expenses: monthExpenses,
      savings,
      investment: monthInvestment,
      taxPending,
      apparentCashflow: monthIncome - monthExpenses - monthInvestment,
      netWorth: netWorth.netWorth,
      budgetRate: budgetTotals.consumptionRate,
    },
    budgetItems,
    budgetTotals,
    snapshots,
    categoryBreakdown,
    recentInvoices: user.invoices,
  };
}

export async function getTransactionsData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [transactions, categories, accounts] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        category: true,
        account: true,
        transferAccount: true,
      },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.category.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { user, transactions, categories, accounts };
}

export async function getBudgetsData() {
  const user = await getCurrentUser();
  if (!user) return null;
  const month = startOfMonth(new Date());

  const [budgets, transactions, categories] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: user.id, month },
      include: { category: true },
      orderBy: { amount: "desc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: TransactionType.EXPENSE,
        date: { gte: month },
      },
    }),
    prisma.category.findMany({
      where: { userId: user.id, kind: TransactionType.EXPENSE, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const items = budgets.map((budget) => {
    const spent = Math.abs(
      transactions
        .filter((transaction) => transaction.categoryId === budget.categoryId)
        .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0),
    );
    return calculateBudgetProgress(
      budget.category?.name ?? "General",
      toNumber(budget.amount),
      spent,
    );
  });

  return {
    user,
    items,
    totals: calculateBudgetTotals(items),
    categories,
  };
}

export async function getFreelanceData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [invoices, taxProvisions] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { issueDate: "desc" },
      take: 12,
    }),
    prisma.taxProvision.findMany({
      where: { userId: user.id },
      orderBy: { month: "asc" },
      take: 12,
    }),
  ]);

  return { user, invoices, taxProvisions };
}

export async function getInvestmentsData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [assets, transactions] = await Promise.all([
    prisma.investmentAsset.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.investmentTransaction.findMany({
      where: { userId: user.id },
      include: { asset: true },
      orderBy: { tradeDate: "desc" },
      take: 24,
    }),
  ]);

  return { user, assets, transactions };
}

export async function getNetWorthData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const snapshots = await prisma.monthlySnapshot.findMany({
    where: { userId: user.id },
    orderBy: { month: "asc" },
    take: 12,
  });

  return {
    user,
    snapshots: snapshots.map((snapshot) => ({
      month: format(snapshot.month, "MMM"),
      netWorth: toNumber(snapshot.netWorth),
    })),
    accounts: user.accounts,
    assets: user.investmentAssets,
  };
}

export async function getForecastData() {
  const dashboard = await getDashboardData();
  if (!dashboard) return null;

  const fixedExpenses = dashboard.budgetItems
    .filter((item) => ["Vivienda", "Suministros", "Coche"].includes(item.category))
    .reduce((sum, item) => sum + item.budgeted, 0);
  const variableBudgetedExpenses =
    dashboard.budgetTotals.budgeted - fixedExpenses;

  const openingBalance = dashboard.kpis.netWorth - dashboard.kpis.investment;

  return calculateMonthlyForecast({
    expectedIncome: dashboard.kpis.income,
    fixedExpenses,
    variableBudgetedExpenses,
    recurringInvestment: dashboard.kpis.investment,
    pendingTaxes: dashboard.kpis.taxPending,
    openingBalance,
  });
}

export async function getSettingsData() {
  const user = await getCurrentUser();
  if (!user || !user.settings) return null;

  return {
    user,
    settings: user.settings,
    salaryProfile: user.salaryProfiles[0] ?? null,
    accounts: user.accounts,
    categories: await prisma.category.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  };
}

function sumByType(
  transactions: Array<{ type: TransactionType; amount: Prisma.Decimal }>,
  type: TransactionType,
) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
}
