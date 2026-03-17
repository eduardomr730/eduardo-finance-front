import { TransactionType } from "@prisma/client";
import { z } from "zod";

export const transactionSchema = z.object({
  date: z.string(),
  type: z.nativeEnum(TransactionType),
  accountId: z.string().cuid(),
  transferAccountId: z.string().cuid().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  subcategoryId: z.string().cuid().optional().nullable(),
  amount: z.coerce.number(),
  currency: z.string().default("EUR"),
  description: z.string().min(2),
  merchant: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
});

export const budgetSchema = z.object({
  categoryId: z.string().cuid().optional().nullable(),
  month: z.string(),
  amount: z.coerce.number().positive(),
  rollover: z.boolean().default(false),
  alertPercent: z.coerce.number().int().min(1).max(100).default(80),
});

export const invoiceSchema = z.object({
  issueDate: z.string(),
  dueDate: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
  clientName: z.string().min(2),
  notes: z.string().optional().nullable(),
  baseAmount: z.coerce.number().positive(),
  vatRate: z.coerce.number().min(0).max(1),
  withholdingRate: z.coerce.number().min(0).max(1),
  effectiveIrpfRate: z.coerce.number().min(0).max(1),
  status: z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"]).default("SENT"),
});

export const settingsSchema = z.object({
  country: z.string().length(2),
  currency: z.string().length(3),
  budgetMonthStartDay: z.coerce.number().int().min(1).max(28),
  defaultVatRate: z.coerce.number().min(0).max(1),
  defaultWithholdingRate: z.coerce.number().min(0).max(1),
  effectiveIrpfRate: z.coerce.number().min(0).max(1),
  freelancerMonthlyFee: z.coerce.number().min(0),
  salaryNetMonthlyEstimate: z.coerce.number().min(0),
  fiscalCalendarNotes: z.string().optional().nullable(),
});
