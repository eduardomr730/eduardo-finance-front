import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getSettingsData } from "@/server/finance-service";

export default async function SettingsPage() {
  const data = await getSettingsData();
  if (!data) return null;

  return (
    <section className="space-y-6">
      <Header
        title="Configuracion"
        subtitle="Parametros globales del sistema financiero: fiscalidad del autonomo, cuenta por defecto, pais, moneda y perfil salarial."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Parametros financieros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="Pais" value={data.settings.country} />
            <SettingRow label="Moneda" value={data.settings.currency} />
            <SettingRow label="Inicio de mes presupuestario" value={`Dia ${data.settings.budgetMonthStartDay}`} />
            <SettingRow label="IVA habitual" value={`${(Number(data.settings.defaultVatRate) * 100).toFixed(0)}%`} />
            <SettingRow label="Retencion habitual" value={`${(Number(data.settings.defaultWithholdingRate) * 100).toFixed(0)}%`} />
            <SettingRow label="IRPF efectivo estimado" value={`${(Number(data.settings.effectiveIrpfRate) * 100).toFixed(0)}%`} />
            <SettingRow label="Cuota autonomo" value={formatCurrency(Number(data.settings.freelancerMonthlyFee))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Perfil salarial y cuentas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="Neto mensual salarial" value={formatCurrency(Number(data.settings.salaryNetMonthlyEstimate))} />
            <SettingRow label="Bruto anual" value={formatCurrency(Number(data.salaryProfile?.grossAnnual ?? 0))} />
            <SettingRow label="Pagas" value={String(data.salaryProfile?.payPeriods ?? 12)} />
            <div className="rounded-2xl border p-4">
              <p className="mb-3 text-sm text-[var(--muted)]">Cuentas activas</p>
              <div className="space-y-3">
                {data.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between text-sm">
                    <span>{account.name}</span>
                    <span className="text-[var(--muted)]">{account.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
