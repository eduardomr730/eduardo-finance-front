import { query } from "@/lib/db";

export type Income = {
  id: number;
  month: string;
  source: string;
  amount: number;
  note: string;
};

export type Budget = {
  id: number;
  name: string;
  category: string;
  monthlyLimit: number;
  spentAmount: number;
  note: string;
};

export type Expense = {
  id: number;
  budgetId: number;
  budgetName: string;
  spentOn: string;
  description: string;
  amount: number;
  note: string;
};

export type DashboardData = {
  month: string;
  months: string[];
  incomes: Income[];
  budgets: Budget[];
  expenses: Expense[];
  totals: {
    income: number;
    budgeted: number;
    spent: number;
    remaining: number;
  };
};

type IncomeRow = {
  id: number;
  month: string;
  source: string;
  amount: number;
  note: string;
};

type BudgetRow = {
  id: number;
  name: string;
  category: string;
  monthly_limit: number;
  spent_amount: number;
  note: string;
};

type ExpenseRow = {
  id: number;
  budget_id: number;
  budget_name: string;
  spent_on: string;
  description: string;
  amount: number;
  note: string;
};

type MonthRow = {
  month: string;
};

export function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function normalizeMonth(input?: string | null) {
  if (input && /^\d{4}-\d{2}$/.test(input)) {
    return input;
  }

  return getCurrentMonth();
}

export function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getMonthBounds(month: string) {
  const start = `${month}-01`;
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonth = new Date(year, monthNumber, 1);
  const nextYear = nextMonth.getFullYear();
  const nextMonthNumber = `${nextMonth.getMonth() + 1}`.padStart(2, "0");

  return {
    start,
    endExclusive: `${nextYear}-${nextMonthNumber}-01`,
  };
}

export async function getDashboardData(monthInput?: string | null) {
  const month = normalizeMonth(monthInput);
  const { start, endExclusive } = getMonthBounds(month);

  const [incomeResult, budgetResult, expenseResult, monthResult] =
    await Promise.all([
      query<IncomeRow>(
        `
          SELECT
            id,
            TO_CHAR(month, 'YYYY-MM') AS month,
            source,
            amount::float8 AS amount,
            note
          FROM incomes
          WHERE month = $1
          ORDER BY amount DESC, id DESC
        `,
        [start],
      ),
      query<BudgetRow>(
        `
          SELECT
            b.id,
            b.name,
            b.category,
            b.monthly_limit::float8 AS monthly_limit,
            COALESCE(SUM(e.amount), 0)::float8 AS spent_amount,
            b.note
          FROM budgets b
          LEFT JOIN expenses e
            ON e.budget_id = b.id
            AND e.spent_on >= $1
            AND e.spent_on < $2
          GROUP BY b.id
          ORDER BY b.category ASC, b.name ASC
        `,
        [start, endExclusive],
      ),
      query<ExpenseRow>(
        `
          SELECT
            e.id,
            e.budget_id,
            b.name AS budget_name,
            TO_CHAR(e.spent_on, 'YYYY-MM-DD') AS spent_on,
            e.description,
            e.amount::float8 AS amount,
            e.note
          FROM expenses e
          INNER JOIN budgets b ON b.id = e.budget_id
          WHERE e.spent_on >= $1
            AND e.spent_on < $2
          ORDER BY e.spent_on DESC, e.id DESC
        `,
        [start, endExclusive],
      ),
      query<MonthRow>(`
        SELECT DISTINCT month
        FROM (
          SELECT TO_CHAR(month, 'YYYY-MM') AS month FROM incomes
          UNION
          SELECT TO_CHAR(spent_on, 'YYYY-MM') AS month FROM expenses
        ) months
        ORDER BY month DESC
      `),
    ]);

  const incomes: Income[] = incomeResult.rows.map((row) => ({
    id: row.id,
    month: row.month,
    source: row.source,
    amount: row.amount,
    note: row.note,
  }));

  const budgets: Budget[] = budgetResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    monthlyLimit: row.monthly_limit,
    spentAmount: row.spent_amount,
    note: row.note,
  }));

  const expenses: Expense[] = expenseResult.rows.map((row) => ({
    id: row.id,
    budgetId: row.budget_id,
    budgetName: row.budget_name,
    spentOn: row.spent_on,
    description: row.description,
    amount: row.amount,
    note: row.note,
  }));

  const totals = {
    income: incomes.reduce((sum, item) => sum + item.amount, 0),
    budgeted: budgets.reduce((sum, item) => sum + item.monthlyLimit, 0),
    spent: expenses.reduce((sum, item) => sum + item.amount, 0),
    remaining: 0,
  };

  totals.remaining = totals.income - totals.spent;

  const months = Array.from(
    new Set([month, getCurrentMonth(), ...monthResult.rows.map((row) => row.month)]),
  ).sort((left, right) => right.localeCompare(left));

  return {
    month,
    months,
    incomes,
    budgets,
    expenses,
    totals,
  } satisfies DashboardData;
}
