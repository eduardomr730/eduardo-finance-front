import { Prisma, TransactionType } from "@prisma/client";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "../lib/constants";
import { prisma } from "../lib/db";

async function main() {
  await prisma.monthlySnapshot.deleteMany();
  await prisma.investmentTransaction.deleteMany();
  await prisma.investmentAsset.deleteMany();
  await prisma.taxProvision.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.salaryProfile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: DEMO_USER_EMAIL,
      name: DEMO_USER_NAME,
      currency: "EUR",
      locale: "es-ES",
      country: "ES",
    },
  });

  const settings = await prisma.appSetting.create({
    data: {
      userId: user.id,
      country: "ES",
      currency: "EUR",
      budgetMonthStartDay: 1,
      defaultVatRate: new Prisma.Decimal(0.21),
      defaultWithholdingRate: new Prisma.Decimal(0.15),
      effectiveIrpfRate: new Prisma.Decimal(0.24),
      freelancerMonthlyFee: new Prisma.Decimal(90),
      salaryNetMonthlyEstimate: new Prisma.Decimal(0),
      fiscalCalendarNotes:
        "Workspace inicial vacio. Empieza creando cuentas, salario, facturas y transacciones.",
    },
  });

  await createCategories(user.id);

  console.log(`Seed completado para ${user.email}`);
}

async function createCategories(userId: string) {
  const defaults = [
    ["vivienda", TransactionType.EXPENSE, "#7c6f64"],
    ["suministros", TransactionType.EXPENSE, "#4f6d7a"],
    ["coche", TransactionType.EXPENSE, "#6b7280"],
    ["supermercado", TransactionType.EXPENSE, "#0f766e"],
    ["restaurantes", TransactionType.EXPENSE, "#b45309"],
    ["salud", TransactionType.EXPENSE, "#be123c"],
    ["deporte", TransactionType.EXPENSE, "#1d4ed8"],
    ["compras", TransactionType.EXPENSE, "#7c3aed"],
    ["inversion", TransactionType.INVESTMENT, "#166534"],
    ["impuestos", TransactionType.TAX, "#991b1b"],
    ["salario", TransactionType.INCOME, "#0f766e"],
    ["autonomo", TransactionType.INCOME, "#1d4ed8"],
  ] as const;

  const created = [];

  for (const [index, [slug, kind, color]] of defaults.entries()) {
    const category = await prisma.category.create({
      data: {
        userId,
        slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        kind,
        color,
        sortOrder: index,
      },
    });
    created.push(category);
  }

  const subcategories = [
    ["vivienda", "alquiler"],
    ["suministros", "luz-agua"],
    ["coche", "gastos-coche"],
    ["supermercado", "compra-casa"],
    ["restaurantes", "comidas-fuera"],
    ["salud", "gastos-salud"],
    ["deporte", "gimnasio"],
    ["compras", "compras-varias"],
    ["inversion", "sp500"],
    ["impuestos", "cuota-autonomo"],
    ["impuestos", "provision-irpf"],
    ["salario", "nomina"],
    ["autonomo", "facturas"],
  ] as const;

  for (const [slug, childSlug] of subcategories) {
    const category = created.find((item) => item.slug === slug);
    if (!category) continue;

    await prisma.subcategory.create({
      data: {
        userId,
        categoryId: category.id,
        slug: childSlug,
        name: childSlug.replace(/-/g, " "),
      },
    });
  }

  return created;
}
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
