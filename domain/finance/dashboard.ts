import type { MonthlyAggregate } from "@/domain/types";
import { roundCurrency } from "@/lib/utils";

export function calculateMonthlyAggregates(
  rows: Array<{
    month: string;
    income: number;
    expenses: number;
    investment: number;
    taxPending: number;
  }>,
): MonthlyAggregate[] {
  return rows.map((row) => {
    const apparentCashflow = roundCurrency(row.income - row.expenses - row.investment);
    const realCashflow = roundCurrency(apparentCashflow - row.taxPending);

    return {
      month: row.month,
      income: roundCurrency(row.income),
      expenses: roundCurrency(row.expenses),
      investment: roundCurrency(row.investment),
      apparentCashflow,
      realCashflow,
      taxPending: roundCurrency(row.taxPending),
    };
  });
}

export function calculateRealSavings({
  income,
  expenses,
  investment,
  taxPending,
}: {
  income: number;
  expenses: number;
  investment: number;
  taxPending: number;
}) {
  return roundCurrency(income - expenses - taxPending - investment);
}
