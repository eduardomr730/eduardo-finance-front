import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getInvestmentsData } from "@/server/finance-service";

export default async function InvestmentsPage() {
  const data = await getInvestmentsData();
  if (!data) return null;

  return (
    <section className="space-y-6">
      <Header
        title="Inversiones"
        subtitle="MVP manual para aportaciones periodicas, valor actual, coste medio y peso de la cartera dentro del patrimonio."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.assets.map((asset) => (
              <div key={asset.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{asset.name}</p>
                    <p className="text-sm text-[var(--muted)]">{asset.assetType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(asset.currentValue))}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {Number(asset.units).toFixed(3)} uds
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Movimientos de inversion</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--muted)]">
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Activo</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Units</th>
                  <th className="pb-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-[var(--line)]">
                    <td className="py-3">{transaction.tradeDate.toLocaleDateString("es-ES")}</td>
                    <td className="py-3">{transaction.asset.name}</td>
                    <td className="py-3">{transaction.type}</td>
                    <td className="py-3">{Number(transaction.units).toFixed(3)}</td>
                    <td className="py-3 text-right">{formatCurrency(Number(transaction.totalAmount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
