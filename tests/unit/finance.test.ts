import {
  calculateBudgetProgress,
  calculateInvoiceBreakdown,
  calculateMonthlyAggregates,
  calculateMonthlyForecast,
  calculateNetWorth,
  calculateRealCashflow,
  calculateRealSavings,
} from "@/domain/finance";

describe("financial domain", () => {
  it("calculates spanish freelance invoice cash correctly", () => {
    const result = calculateInvoiceBreakdown({
      baseAmount: 1949.65,
      vatRate: 0.21,
      withholdingRate: 0.15,
      effectiveIrpfRate: 0.24,
      freelancerMonthlyFee: 90,
    });

    expect(result.vatAmount).toBe(409.43);
    expect(result.expectedBankAmount).toBe(2066.63);
    expect(result.withheldIrpfAmount).toBe(292.45);
    expect(result.estimatedIrpfAmount).toBe(467.92);
    expect(result.pendingIrpfProvision).toBe(175.47);
    expect(result.realNetAmount).toBe(1391.73);
  });

  it("computes budget consumption and alert status", () => {
    const result = calculateBudgetProgress("Restaurantes", 350, 300);
    expect(result.remaining).toBe(50);
    expect(result.consumptionRate).toBeCloseTo(0.86, 2);
    expect(result.status).toBe("warning");
  });

  it("computes real savings and cashflow after taxes", () => {
    const savings = calculateRealSavings({
      income: 4116.63,
      expenses: 2482,
      investment: 500,
      taxPending: 584.9,
    });
    const cashflow = calculateRealCashflow({
      income: 4116.63,
      expenses: 2482,
      investments: 500,
      taxPending: 584.9,
    });

    expect(savings).toBe(549.73);
    expect(cashflow).toBe(549.73);
  });

  it("builds monthly aggregates for charts", () => {
    const result = calculateMonthlyAggregates([
      { month: "Jan", income: 3000, expenses: 2000, investment: 400, taxPending: 200 },
    ]);

    expect(result[0]).toEqual({
      month: "Jan",
      income: 3000,
      expenses: 2000,
      investment: 400,
      apparentCashflow: 600,
      realCashflow: 400,
      taxPending: 200,
    });
  });

  it("projects a monthly closing balance", () => {
    const result = calculateMonthlyForecast({
      expectedIncome: 4000,
      fixedExpenses: 1500,
      variableBudgetedExpenses: 700,
      recurringInvestment: 500,
      pendingTaxes: 300,
      openingBalance: 8000,
    });

    expect(result.projectedClosingBalance).toBe(9000);
    expect(result.headroom).toBe(1000);
  });

  it("computes net worth", () => {
    const result = calculateNetWorth({
      cashAccounts: 12000,
      investmentValue: 8500,
      debts: 1000,
    });

    expect(result.netWorth).toBe(19500);
  });
});
