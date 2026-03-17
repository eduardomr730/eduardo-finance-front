import { createInvoiceAction } from "@/server/actions";
import { deleteInvoiceAction, updateInvoiceAction } from "@/server/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      <Card>
        <CardHeader>
          <CardTitle>Nueva factura emitida</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoiceAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input name="clientName" placeholder="Cliente" required />
            <Input name="baseAmount" type="number" step="0.01" placeholder="Base imponible" required />
            <Input name="issueDate" type="date" required />
            <Input name="paidDate" type="date" />
            <Input name="vatRate" type="number" step="0.01" placeholder="IVA 0.21" defaultValue="0.21" />
            <Input name="withholdingRate" type="number" step="0.01" placeholder="IRPF retenido 0.15" defaultValue="0.15" />
            <Input name="effectiveIrpfRate" type="number" step="0.01" placeholder="IRPF real 0.24" defaultValue="0.24" />
            <div className="md:col-span-2 xl:col-span-4">
              <Textarea name="notes" placeholder="Notas" />
            </div>
            <div className="xl:col-span-4">
              <Button type="submit">Guardar factura</Button>
            </div>
          </form>
        </CardContent>
      </Card>
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
            {data.invoices.length === 0 ? (
              <EmptyState
                title="Aún no hay facturas"
                description="Empieza registrando tus facturas emitidas para que la app calcule IVA, retenciones, provisión pendiente y neto real disponible."
              />
            ) : null}
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
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[var(--line)]">
                    <td className="py-3" colSpan={8}>
                      <form action={updateInvoiceAction} className="grid gap-3 xl:grid-cols-[140px_1.2fr_repeat(4,140px)_auto] xl:items-center">
                        <input type="hidden" name="id" value={invoice.id} />
                        <Input name="issueDate" type="date" defaultValue={invoice.issueDate.toISOString().slice(0, 10)} />
                        <Input name="clientName" defaultValue={invoice.clientName} />
                        <Input name="baseAmount" type="number" step="0.01" defaultValue={String(Number(invoice.baseAmount))} />
                        <Input name="vatRate" type="number" step="0.01" defaultValue={String(Number(invoice.vatRate))} />
                        <Input name="withholdingRate" type="number" step="0.01" defaultValue={String(Number(invoice.withholdingRate))} />
                        <Input name="effectiveIrpfRate" type="number" step="0.01" defaultValue={String(Number(invoice.estimatedIrpfRate))} />
                        <div className="flex justify-end gap-2">
                          <Button type="submit" variant="secondary">Guardar</Button>
                          <Button type="submit" formAction={deleteInvoiceAction} variant="ghost" className="text-rose-500">
                            Borrar
                          </Button>
                        </div>
                      </form>
                      <div className="mt-3 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-4">
                        <span>IVA {formatCurrency(Number(invoice.vatAmount))}</span>
                        <span>IRPF ret. {formatCurrency(Number(invoice.withholdingAmount))}</span>
                        <span>Pendiente {formatCurrency(Number(invoice.pendingIrpfProvision))}</span>
                        <span>Banco {formatCurrency(Number(invoice.expectedBankAmount))}</span>
                      </div>
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
