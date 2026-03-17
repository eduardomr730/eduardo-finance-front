import { Header } from "@/components/layout/header";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { getDashboardData } from "@/server/finance-service";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return <div>No hay datos. Ejecuta el seed inicial.</div>;
  }

  return (
    <section className="space-y-6">
      <Header
        title="Dashboard operativo"
        subtitle="Vista ejecutiva de caja, gasto, inversion y fiscalidad real. El foco es diferenciar dinero que entra en banco de dinero realmente disponible."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ingresos del mes" value={data.kpis.income} hint="Incluye salario y cobros de autonomo" tone="positive" />
        <KpiCard label="Gastos del mes" value={data.kpis.expenses} hint="Solo gasto operativo, sin provision fiscal" tone="negative" />
        <KpiCard label="Ahorro real" value={data.kpis.savings} hint="Restando impuestos pendientes e inversion" tone="positive" />
        <KpiCard label="Patrimonio neto" value={data.kpis.netWorth} hint="Caja mas inversiones" tone="positive" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Evolucion mensual real</CardTitle>
              <CardDescription>
                Comparativa entre ingreso, gasto y cashflow real tras provisionar impuestos.
              </CardDescription>
            </div>
            <Badge tone="accent">6 meses</Badge>
          </CardHeader>
          <CardContent>
            <CashflowChart
              data={data.snapshots.map((row) => ({
                month: row.month,
                income: row.income,
                expenses: row.expenses,
                realCashflow: row.realCashflow,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Breakdown de gasto</CardTitle>
              <CardDescription>
                Distribucion del gasto presupuestado ya consumido este mes.
              </CardDescription>
            </div>
            <Badge tone="warning">{formatPercent(data.kpis.budgetRate)}</Badge>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={data.categoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Presupuesto vs real</CardTitle>
              <CardDescription>
                Alertas visuales por categoria para detectar tension antes de cerrar el mes.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.budgetItems.map((item) => (
              <div key={item.category} className="rounded-2xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {formatCurrency(item.spent)} de {formatCurrency(item.budgeted)}
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

        <Card>
          <CardHeader>
            <div>
              <CardTitle>KPIs diferenciales</CardTitle>
              <CardDescription>
                Donde mas valor aporta el modelo financiero del autonomo.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow label="Cashflow aparente" value={data.kpis.apparentCashflow} />
            <MetricRow label="Impuestos pendientes" value={data.kpis.taxPending} tone="warning" />
            <MetricRow label="Inversion mensual" value={data.kpis.investment} />
            <MetricRow label="Presupuesto consumido" value={data.budgetTotals.spent} />
            <MetricRow label="Budget rate" value={data.kpis.budgetRate * 100} suffix="%" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricRow({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  tone?: "warning";
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={tone === "warning" ? "font-semibold text-amber-500" : "font-semibold"}>
        {suffix ? `${value.toFixed(1)}${suffix}` : formatCurrency(value)}
      </span>
    </div>
  );
}
