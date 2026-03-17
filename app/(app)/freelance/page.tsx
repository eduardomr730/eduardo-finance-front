import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getFreelanceData } from "@/server/finance-service";

export default async function FreelancePage() {
  const data = await getFreelanceData();
  if (!data) return null;

  const currentTax = data.taxProvisions.at(-1);

  return (
    <section className="space-y-6">
      <Header
        title="Modulo autonomo"
        subtitle="El nucleo financiero de la app: facturacion, IVA, IRPF retenido, IRPF real estimado, provisiones y neto realmente disponible."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_420px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Facturas emitidas</CardTitle>
              <CardDescription>
                Cada factura separa base imponible, IVA, retencion e IRPF pendiente de provisionar.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--muted)]">
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Base</th>
                  <th className="pb-3">IVA</th>
                  <th className="pb-3">IRPF ret.</th>
                  <th className="pb-3">Pendiente</th>
                  <th className="pb-3 text-right">Banco</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[var(--line)]">
                    <td className="py-3">{invoice.issueDate.toLocaleDateString("es-ES")}</td>
                    <td className="py-3">{invoice.clientName}</td>
                    <td className="py-3">{formatCurrency(Number(invoice.baseAmount))}</td>
                    <td className="py-3">{formatCurrency(Number(invoice.vatAmount))}</td>
                    <td className="py-3">{formatCurrency(Number(invoice.withholdingAmount))}</td>
                    <td className="py-3">{formatCurrency(Number(invoice.pendingIrpfProvision))}</td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(Number(invoice.expectedBankAmount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Panel fiscal</CardTitle>
              <CardDescription>
                Caja aparente vs caja real disponible tras apartar Hacienda.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <TaxRow label="IVA acumulado" value={Number(currentTax?.vatAccrued ?? 0)} />
            <TaxRow label="IRPF retenido" value={Number(currentTax?.irpfWithheld ?? 0)} />
            <TaxRow label="IRPF estimado real" value={Number(currentTax?.irpfEstimated ?? 0)} />
            <TaxRow label="IRPF pendiente" value={Number(currentTax?.irpfPending ?? 0)} tone="warning" />
            <TaxRow label="Cuota autonomo" value={Number(currentTax?.freelancerFee ?? 0)} />
            <TaxRow label="Neto real disponible" value={Number(currentTax?.availableNet ?? 0)} tone="success" />
            <Badge tone="warning" className="w-full justify-center py-2">
              Caja aparente {formatCurrency(Number(currentTax?.apparentCash ?? 0))}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function TaxRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warning" | "success";
}) {
  const className =
    tone === "warning"
      ? "text-amber-500"
      : tone === "success"
        ? "text-emerald-500"
        : "";
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={`font-semibold ${className}`}>{formatCurrency(value)}</span>
    </div>
  );
}
