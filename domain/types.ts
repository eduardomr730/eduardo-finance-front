export type InvoiceComputationInput = {
  baseAmount: number;
  vatRate: number;
  withholdingRate: number;
  effectiveIrpfRate: number;
  freelancerMonthlyFee?: number;
};

export type InvoiceComputation = {
  baseAmount: number;
  vatAmount: number;
  withheldIrpfAmount: number;
  totalInvoiceAmount: number;
  expectedBankAmount: number;
  estimatedIrpfAmount: number;
  pendingIrpfProvision: number;
  realNetAmount: number;
};

export type BudgetProgress = {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  consumptionRate: number;
  status: "healthy" | "warning" | "danger";
};

export type MonthlyAggregate = {
  month: string;
  income: number;
  expenses: number;
  investment: number;
  apparentCashflow: number;
  realCashflow: number;
  taxPending: number;
};
