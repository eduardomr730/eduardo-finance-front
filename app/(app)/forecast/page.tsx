import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getForecastData } from "@/server/finance-service";

export default async function ForecastPage() {
  const data = await getForecastData();
  if (!data) return null;

  return (
    <section className="space-y-6">
      <Header
        title="Forecast mensual"
        subtitle="Proyeccion simple para anticipar saldo de cierre, impuestos, gastos fijos, presupuesto variable e inversion recurrente."
      />
      <Card>
        <CardHeader>
          <CardTitle>Simulacion base</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ForecastTile label="Saldo inicial" value={data.openingBalance} />
          <ForecastTile label="Ingresos esperados" value={data.expectedIncome} />
          <ForecastTile label="Gastos fijos" value={data.fixedExpenses} />
          <ForecastTile label="Gasto variable presupuestado" value={data.variableBudgetedExpenses} />
          <ForecastTile label="Inversion recurrente" value={data.recurringInvestment} />
          <ForecastTile label="Impuestos pendientes" value={data.pendingTaxes} />
          <ForecastTile label="Saldo final estimado" value={data.projectedClosingBalance} highlight />
        </CardContent>
      </Card>
    </section>
  );
}

function ForecastTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "bg-[var(--accent)] text-white" : ""}`}>
      <p className={`text-sm ${highlight ? "text-white/80" : "text-[var(--muted)]"}`}>{label}</p>
      <p className="mt-3 text-2xl font-semibold">{formatCurrency(value)}</p>
    </div>
  );
}
