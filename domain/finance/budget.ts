import type { BudgetProgress } from "@/domain/types";
import { roundCurrency } from "@/lib/utils";

export function calculateBudgetProgress(
  category: string,
  budgeted: number,
  spent: number,
): BudgetProgress {
  const normalizedBudget = Math.max(budgeted, 0);
  const normalizedSpent = Math.max(spent, 0);
  const remaining = roundCurrency(normalizedBudget - normalizedSpent);
  const consumptionRate =
    normalizedBudget === 0 ? 0 : roundCurrency(normalizedSpent / normalizedBudget);

  const status =
    consumptionRate >= 1 ? "danger" : consumptionRate >= 0.8 ? "warning" : "healthy";

  return {
    category,
    budgeted: roundCurrency(normalizedBudget),
    spent: roundCurrency(normalizedSpent),
    remaining,
    consumptionRate,
    status,
  };
}

export function calculateBudgetTotals(items: BudgetProgress[]) {
  const budgeted = roundCurrency(items.reduce((sum, item) => sum + item.budgeted, 0));
  const spent = roundCurrency(items.reduce((sum, item) => sum + item.spent, 0));
  const remaining = roundCurrency(budgeted - spent);

  return {
    budgeted,
    spent,
    remaining,
    consumptionRate: budgeted === 0 ? 0 : roundCurrency(spent / budgeted),
  };
}
