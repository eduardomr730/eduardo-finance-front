import { roundCurrency } from "@/lib/utils";

export function calculateNetWorth({
  cashAccounts,
  investmentValue,
  debts = 0,
}: {
  cashAccounts: number;
  investmentValue: number;
  debts?: number;
}) {
  const assets = roundCurrency(cashAccounts + investmentValue);
  const netWorth = roundCurrency(assets - debts);

  return {
    assets,
    debts: roundCurrency(debts),
    netWorth,
  };
}

export function calculateRealCashflow({
  income,
  expenses,
  investments,
  taxPending,
}: {
  income: number;
  expenses: number;
  investments: number;
  taxPending: number;
}) {
  return roundCurrency(income - expenses - investments - taxPending);
}
