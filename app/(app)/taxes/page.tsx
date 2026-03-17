import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getFreelanceData } from "@/server/finance-service";

export default async function TaxesPage() {
  const data = await getFreelanceData();
  if (!data) return null;

  return (
    <section className="space-y-6">
      <Header
        title="Impuestos"
        subtitle="Vista historica de provisiones fiscales mensuales para visualizar caja aparente, IVA acumulado y necesidad real de provision."
      />
      <Card>
        <CardHeader>
          <CardTitle>Provisiones fiscales</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--muted)]">
                <th className="pb-3">Mes</th>
                <th className="pb-3">IVA</th>
                <th className="pb-3">IRPF ret.</th>
                <th className="pb-3">IRPF real</th>
                <th className="pb-3">Pendiente</th>
                <th className="pb-3">Cuota</th>
                <th className="pb-3 text-right">Neto real</th>
              </tr>
            </thead>
            <tbody>
              {data.taxProvisions.map((item) => (
                <tr key={item.id} className="border-b border-[var(--line)]">
                  <td className="py-3">{item.month.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</td>
                  <td className="py-3">{formatCurrency(Number(item.vatAccrued))}</td>
                  <td className="py-3">{formatCurrency(Number(item.irpfWithheld))}</td>
                  <td className="py-3">{formatCurrency(Number(item.irpfEstimated))}</td>
                  <td className="py-3">{formatCurrency(Number(item.irpfPending))}</td>
                  <td className="py-3">{formatCurrency(Number(item.freelancerFee))}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(Number(item.availableNet))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
