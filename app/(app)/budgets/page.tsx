import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { getBudgetsData } from "@/server/finance-service";

export default async function BudgetsPage() {
  const data = await getBudgetsData();
  if (!data) return null;

  return (
    <section className="space-y-6">
      <Header
        title="Presupuestos"
        subtitle="Control mensual por categoria con limites, alertas visuales y base preparada para rollover futuro."
      />
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Presupuesto actual</CardTitle>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Consumido {formatCurrency(data.totals.spent)} de {formatCurrency(data.totals.budgeted)}
            </p>
          </div>
          <Badge tone="accent">{formatPercent(data.totals.consumptionRate)}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.items.map((item) => (
            <div key={item.category} className="rounded-2xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.category}</p>
                  <p className="text-sm text-[var(--muted)]">
                    Restante {formatCurrency(item.remaining)}
                  </p>
                </div>
                <Badge
                  tone={
                    item.status === "danger"
                      ? "danger"
                      : item.status === "warning"
                        ? "warning"
                        : "success"
                  }
                >
                  {formatPercent(item.consumptionRate)}
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-black/5 dark:bg-white/8">
                <div
                  className="h-2 rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.min(item.consumptionRate * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
