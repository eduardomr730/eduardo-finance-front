import { Prisma, TransactionType } from "@prisma/client";

import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "@/lib/constants";
import { prisma } from "@/lib/db";

const DEFAULT_CATEGORIES = [
  ["vivienda", "Vivienda", TransactionType.EXPENSE, "#7c6f64"],
  ["suministros", "Suministros", TransactionType.EXPENSE, "#4f6d7a"],
  ["coche", "Coche", TransactionType.EXPENSE, "#6b7280"],
  ["supermercado", "Supermercado", TransactionType.EXPENSE, "#0f766e"],
  ["restaurantes", "Restaurantes", TransactionType.EXPENSE, "#b45309"],
  ["salud", "Salud", TransactionType.EXPENSE, "#be123c"],
  ["deporte", "Deporte", TransactionType.EXPENSE, "#1d4ed8"],
  ["compras", "Compras", TransactionType.EXPENSE, "#7c3aed"],
  ["inversion", "Inversion", TransactionType.INVESTMENT, "#166534"],
  ["impuestos", "Impuestos", TransactionType.TAX, "#991b1b"],
  ["salario", "Salario", TransactionType.INCOME, "#0f766e"],
  ["autonomo", "Autonomo", TransactionType.INCOME, "#1d4ed8"],
] as const;

const DEFAULT_SUBCATEGORIES = [
  ["vivienda", "alquiler", "Alquiler"],
  ["suministros", "luz-agua", "Luz y agua"],
  ["coche", "gastos-coche", "Gastos coche"],
  ["supermercado", "compra-casa", "Compra casa"],
  ["restaurantes", "comidas-fuera", "Comidas fuera"],
  ["salud", "gastos-salud", "Gastos salud"],
  ["deporte", "gimnasio", "Gimnasio"],
  ["compras", "compras-varias", "Compras varias"],
  ["inversion", "sp500", "SP500"],
  ["impuestos", "cuota-autonomo", "Cuota autonomo"],
  ["impuestos", "provision-irpf", "Provision IRPF"],
  ["salario", "nomina", "Nomina"],
  ["autonomo", "facturas", "Facturas"],
] as const;

export async function ensureWorkspace() {
  let user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: {
      settings: true,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEMO_USER_EMAIL,
        name: DEMO_USER_NAME,
        currency: "EUR",
        locale: "es-ES",
        country: "ES",
      },
      include: {
        settings: true,
      },
    });
  }

  if (!user.settings) {
    await prisma.appSetting.create({
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
        fiscalCalendarNotes: "Configura aqui tus parametros reales.",
      },
    });
  }

  const existingCategories = await prisma.category.count({
    where: { userId: user.id },
  });

  if (existingCategories === 0) {
    const createdCategories = [];

    for (const [index, [slug, name, kind, color]] of DEFAULT_CATEGORIES.entries()) {
      const category = await prisma.category.create({
        data: {
          userId: user.id,
          slug,
          name,
          kind,
          color,
          sortOrder: index,
        },
      });
      createdCategories.push(category);
    }

    for (const [parentSlug, slug, name] of DEFAULT_SUBCATEGORIES) {
      const category = createdCategories.find((item) => item.slug === parentSlug);
      if (!category) continue;

      await prisma.subcategory.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          slug,
          name,
        },
      });
    }
  }

  return prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USER_EMAIL },
  });
}
