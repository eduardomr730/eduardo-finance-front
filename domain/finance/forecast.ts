import { roundCurrency } from "@/lib/utils";

export function calculateMonthlyForecast({
  expectedIncome,
  fixedExpenses,
  variableBudgetedExpenses,
  recurringInvestment,
  pendingTaxes,
  openingBalance,
}: {
  expectedIncome: number;
  fixedExpenses: number;
  variableBudgetedExpenses: number;
  recurringInvestment: number;
  pendingTaxes: number;
  openingBalance: number;
}) {
  const projectedClosingBalance = roundCurrency(
    openingBalance +
      expectedIncome -
      fixedExpenses -
      variableBudgetedExpenses -
      recurringInvestment -
      pendingTaxes,
  );

  return {
    expectedIncome: roundCurrency(expectedIncome),
    fixedExpenses: roundCurrency(fixedExpenses),
    variableBudgetedExpenses: roundCurrency(variableBudgetedExpenses),
    recurringInvestment: roundCurrency(recurringInvestment),
    pendingTaxes: roundCurrency(pendingTaxes),
    openingBalance: roundCurrency(openingBalance),
    projectedClosingBalance,
    headroom: roundCurrency(projectedClosingBalance - openingBalance),
  };
}
