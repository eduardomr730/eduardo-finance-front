import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getNetWorthData } from "@/server/finance-service";

export default async function NetWorthPage() {
  const data = await getNetWorthData();
  if (!data) return null;

  return (
    <section className="space-y-6">
      <Header
        title="Patrimonio neto"
        subtitle="Seguimiento de caja, cuentas e inversiones para medir el net worth y su evolucion temporal."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Evolucion del patrimonio</CardTitle>
          </CardHeader>
          <CardContent>
            <NetWorthChart data={data.snapshots} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Composicion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-sm text-[var(--muted)]">{account.name}</span>
                <span className="font-semibold">{formatCurrency(Number(account.openingBalance))}</span>
              </div>
            ))}
            {data.assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-sm text-[var(--muted)]">{asset.name}</span>
                <span className="font-semibold">{formatCurrency(Number(asset.currentValue))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
