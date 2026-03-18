"use server";

import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { normalizeMonth } from "@/lib/finance";

function requireText(value: FormDataEntryValue | null, fieldName: string) {
  const text = value?.toString().trim();

  if (!text) {
    throw new Error(`El campo "${fieldName}" es obligatorio.`);
  }

  return text;
}

function parseAmount(value: FormDataEntryValue | null) {
  const amount = Number(value?.toString());

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("La cantidad debe ser un numero valido.");
  }

  return amount;
}

function parseId(value: FormDataEntryValue | null, fieldName: string) {
  const id = Number(value?.toString());

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`El identificador de "${fieldName}" no es valido.`);
  }

  return id;
}

function getReturnMonth(formData: FormData) {
  return normalizeMonth(formData.get("returnMonth")?.toString());
}

function goBackToMonth(month: string) {
  redirect(`/?month=${month}`);
}

export async function createIncome(formData: FormData) {
  const month = normalizeMonth(formData.get("month")?.toString());

  await query(
    `
      INSERT INTO incomes (month, source, amount, note)
      VALUES ($1, $2, $3, $4)
    `,
    [
      `${month}-01`,
      formData.get("source")?.toString().trim() ?? "",
      parseAmount(formData.get("amount")),
      formData.get("note")?.toString().trim() ?? "",
    ],
  );

  goBackToMonth(month);
}

export async function updateIncome(formData: FormData) {
  const id = parseId(formData.get("id"), "ingreso");
  const month = normalizeMonth(formData.get("month")?.toString());

  await query(
    `
      UPDATE incomes
      SET month = $2,
          source = $3,
          amount = $4,
          note = $5
      WHERE id = $1
    `,
    [
      id,
      `${month}-01`,
      formData.get("source")?.toString().trim() ?? "",
      parseAmount(formData.get("amount")),
      formData.get("note")?.toString().trim() ?? "",
    ],
  );

  goBackToMonth(getReturnMonth(formData));
}

export async function deleteIncome(formData: FormData) {
  await query(`DELETE FROM incomes WHERE id = $1`, [
    parseId(formData.get("id"), "ingreso"),
  ]);

  goBackToMonth(getReturnMonth(formData));
}

export async function createBudget(formData: FormData) {
  await query(
    `
      INSERT INTO budgets (name, category, monthly_limit, note)
      VALUES ($1, $2, $3, $4)
    `,
    [
      requireText(formData.get("name"), "nombre"),
      formData.get("category")?.toString().trim() ?? "",
      parseAmount(formData.get("monthlyLimit")),
      formData.get("note")?.toString().trim() ?? "",
    ],
  );

  goBackToMonth(getReturnMonth(formData));
}

export async function updateBudget(formData: FormData) {
  await query(
    `
      UPDATE budgets
      SET name = $2,
          category = $3,
          monthly_limit = $4,
          note = $5
      WHERE id = $1
    `,
    [
      parseId(formData.get("id"), "budget"),
      requireText(formData.get("name"), "nombre"),
      formData.get("category")?.toString().trim() ?? "",
      parseAmount(formData.get("monthlyLimit")),
      formData.get("note")?.toString().trim() ?? "",
    ],
  );

  goBackToMonth(getReturnMonth(formData));
}

export async function deleteBudget(formData: FormData) {
  await query(`DELETE FROM budgets WHERE id = $1`, [
    parseId(formData.get("id"), "budget"),
  ]);

  goBackToMonth(getReturnMonth(formData));
}

export async function createExpense(formData: FormData) {
  await query(
    `
      INSERT INTO expenses (budget_id, spent_on, description, amount, note)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      parseId(formData.get("budgetId"), "budget"),
      requireText(formData.get("spentOn"), "fecha"),
      requireText(formData.get("description"), "descripcion"),
      parseAmount(formData.get("amount")),
      formData.get("note")?.toString().trim() ?? "",
    ],
  );

  goBackToMonth(getReturnMonth(formData));
}

export async function updateExpense(formData: FormData) {
  await query(
    `
      UPDATE expenses
      SET budget_id = $2,
          spent_on = $3,
          description = $4,
          amount = $5,
          note = $6
      WHERE id = $1
    `,
    [
      parseId(formData.get("id"), "gasto"),
      parseId(formData.get("budgetId"), "budget"),
      requireText(formData.get("spentOn"), "fecha"),
      requireText(formData.get("description"), "descripcion"),
      parseAmount(formData.get("amount")),
      formData.get("note")?.toString().trim() ?? "",
    ],
  );

  goBackToMonth(getReturnMonth(formData));
}

export async function deleteExpense(formData: FormData) {
  await query(`DELETE FROM expenses WHERE id = $1`, [
    parseId(formData.get("id"), "gasto"),
  ]);

  goBackToMonth(getReturnMonth(formData));
}
