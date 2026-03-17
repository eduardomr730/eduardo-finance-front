import type { InvoiceComputationInput } from "@/domain/types";
import { roundCurrency } from "@/lib/utils";

export function calculateInvoiceBreakdown(
  input: InvoiceComputationInput,
) {
  const freelancerMonthlyFee = input.freelancerMonthlyFee ?? 0;
  const vatAmount = roundCurrency(input.baseAmount * input.vatRate);
  const withheldIrpfAmount = roundCurrency(input.baseAmount * input.withholdingRate);
  const totalInvoiceAmount = roundCurrency(input.baseAmount + vatAmount);
  const expectedBankAmount = roundCurrency(totalInvoiceAmount - withheldIrpfAmount);
  const estimatedIrpfAmount = roundCurrency(input.baseAmount * input.effectiveIrpfRate);
  const pendingIrpfProvision = roundCurrency(
    Math.max(estimatedIrpfAmount - withheldIrpfAmount, 0),
  );
  const realNetAmount = roundCurrency(
    input.baseAmount - estimatedIrpfAmount - freelancerMonthlyFee,
  );

  return {
    baseAmount: roundCurrency(input.baseAmount),
    vatAmount,
    withheldIrpfAmount,
    totalInvoiceAmount,
    expectedBankAmount,
    estimatedIrpfAmount,
    pendingIrpfProvision,
    realNetAmount,
  };
}

export function calculateFreelanceTaxSummary(
  invoices: Array<ReturnType<typeof calculateInvoiceBreakdown>>,
  freelancerMonthlyFee: number,
) {
  const vatAccrued = roundCurrency(
    invoices.reduce((sum, invoice) => sum + invoice.vatAmount, 0),
  );
  const irpfWithheld = roundCurrency(
    invoices.reduce((sum, invoice) => sum + invoice.withheldIrpfAmount, 0),
  );
  const irpfEstimated = roundCurrency(
    invoices.reduce((sum, invoice) => sum + invoice.estimatedIrpfAmount, 0),
  );
  const irpfPending = roundCurrency(
    invoices.reduce((sum, invoice) => sum + invoice.pendingIrpfProvision, 0),
  );
  const apparentCash = roundCurrency(
    invoices.reduce((sum, invoice) => sum + invoice.expectedBankAmount, 0),
  );
  const availableNet = roundCurrency(
    invoices.reduce((sum, invoice) => sum + invoice.realNetAmount, 0),
  );

  return {
    vatAccrued,
    irpfWithheld,
    irpfEstimated,
    irpfPending,
    freelancerFee: roundCurrency(freelancerMonthlyFee),
    apparentCash,
    availableNet,
    apparentVsRealGap: roundCurrency(apparentCash - availableNet),
  };
}
