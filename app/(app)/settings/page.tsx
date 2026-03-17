import {
  createAccountAction,
  deleteAccountAction,
  resetWorkspaceDataAction,
  saveSalaryProfileAction,
  updateAccountAction,
  updateSettingsAction,
} from "@/server/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
            <form action={updateSettingsAction} className="space-y-4">
              <Field label="País">
                <Input name="country" defaultValue={data.settings.country} />
              </Field>
              <Field label="Moneda">
                <Input name="currency" defaultValue={data.settings.currency} />
              </Field>
              <Field label="Día de inicio del mes presupuestario">
                <Input name="budgetMonthStartDay" type="number" min="1" max="28" defaultValue={String(data.settings.budgetMonthStartDay)} />
              </Field>
              <Field label="IVA habitual" hint="Formato decimal: 0.21 = 21%">
                <Input name="defaultVatRate" type="number" step="0.01" defaultValue={String(Number(data.settings.defaultVatRate))} />
              </Field>
              <Field label="IRPF retenido habitual" hint="Formato decimal: 0.15 = 15%">
                <Input name="defaultWithholdingRate" type="number" step="0.01" defaultValue={String(Number(data.settings.defaultWithholdingRate))} />
              </Field>
              <Field label="IRPF real estimado" hint="Tipo efectivo real esperado del autónomo">
                <Input name="effectiveIrpfRate" type="number" step="0.01" defaultValue={String(Number(data.settings.effectiveIrpfRate))} />
              </Field>
              <Field label="Cuota mensual de autónomo">
                <Input name="freelancerMonthlyFee" type="number" step="0.01" defaultValue={String(Number(data.settings.freelancerMonthlyFee))} />
              </Field>
              <Field label="Estimación de neto salarial mensual">
                <Input name="salaryNetMonthlyEstimate" type="number" step="0.01" defaultValue={String(Number(data.settings.salaryNetMonthlyEstimate))} />
              </Field>
              <Field label="Notas de calendario fiscal">
                <Textarea name="fiscalCalendarNotes" defaultValue={data.settings.fiscalCalendarNotes ?? ""} />
              </Field>
              <Button type="submit">Guardar configuración</Button>
            </form>
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
              {data.accounts.length === 0 ? (
                <EmptyState
                  title="No hay cuentas todavía"
                  description="Crea al menos una cuenta para empezar a registrar ingresos, gastos y transferencias."
                />
              ) : (
                <div className="space-y-3">
                  {data.accounts.map((account) => (
                    <form key={account.id} action={updateAccountAction} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_1fr_160px_160px_auto] md:items-center">
                      <input type="hidden" name="id" value={account.id} />
                      <Field label="Nombre">
                        <Input name="name" defaultValue={account.name} />
                      </Field>
                      <Field label="Entidad">
                        <Input name="institution" defaultValue={account.institution ?? ""} />
                      </Field>
                      <Field label="Tipo">
                        <Select name="type" defaultValue={account.type}>
                          <option value="CHECKING">Cuenta corriente</option>
                          <option value="TAX">Cuenta impuestos</option>
                          <option value="SAVINGS">Cuenta ahorro</option>
                          <option value="INVESTMENT">Cuenta inversion</option>
                          <option value="CASH">Efectivo</option>
                        </Select>
                      </Field>
                      <Field label="Saldo inicial">
                        <Input name="openingBalance" type="number" step="0.01" defaultValue={String(Number(account.openingBalance))} />
                      </Field>
                      <div className="flex gap-2">
                        <Button type="submit" variant="secondary">Guardar</Button>
                        <Button type="submit" formAction={deleteAccountAction} variant="ghost" className="text-rose-500">
                          Borrar
                        </Button>
                      </div>
                    </form>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Añadir cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAccountAction} className="space-y-4">
              <Field label="Nombre de la cuenta">
                <Input name="name" placeholder="Ej. Cuenta nómina" required />
              </Field>
              <Field label="Banco o broker">
                <Input name="institution" placeholder="Entidad financiera" />
              </Field>
              <Field label="Saldo inicial">
                <Input name="openingBalance" type="number" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Tipo de cuenta">
                <Select name="type" defaultValue="CHECKING">
                  <option value="CHECKING">Cuenta corriente</option>
                  <option value="TAX">Cuenta impuestos</option>
                  <option value="SAVINGS">Cuenta ahorro</option>
                  <option value="INVESTMENT">Cuenta inversion</option>
                  <option value="CASH">Efectivo</option>
                </Select>
              </Field>
              <Field label="Uso fiscal">
                <label className="flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm">
                  <input type="checkbox" name="isTaxReserved" />
                  Reservada para Hacienda
                </label>
              </Field>
              <Button type="submit">Crear cuenta</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Configurar salario</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSalaryProfileAction} className="space-y-4">
              <Field label="Empresa">
                <Input name="employer" placeholder="Nombre de la empresa" defaultValue={data.salaryProfile?.employer ?? ""} required />
              </Field>
              <Field label="Bruto anual">
                <Input name="grossAnnual" type="number" step="0.01" placeholder="0.00" defaultValue={String(Number(data.salaryProfile?.grossAnnual ?? 0))} required />
              </Field>
              <Field label="Neto mensual">
                <Input name="netMonthly" type="number" step="0.01" placeholder="0.00" defaultValue={String(Number(data.salaryProfile?.netMonthly ?? 0))} required />
              </Field>
              <Field label="Número de pagas">
                <Input name="payPeriods" type="number" min="1" max="14" defaultValue={String(data.salaryProfile?.payPeriods ?? 12)} />
              </Field>
              <Field label="Retención" hint="Formato decimal: 0.18 = 18%">
                <Input name="retentionRate" type="number" step="0.01" placeholder="0.18" defaultValue={String(Number(data.salaryProfile?.retentionRate ?? 0))} />
              </Field>
              <Field label="Bonus mensual">
                <Input name="monthlyBonus" type="number" step="0.01" placeholder="0.00" defaultValue={String(Number(data.salaryProfile?.monthlyBonus ?? 0))} />
              </Field>
              <Field label="Observaciones">
                <Textarea name="notes" placeholder="Notas del perfil salarial" defaultValue={data.salaryProfile?.notes ?? ""} />
              </Field>
              <Button type="submit">Guardar perfil salarial</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vaciar datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Borra cuentas, transacciones, presupuestos, facturas, inversiones y snapshots para empezar desde cero manteniendo categorías y configuración base.
            </p>
            <form action={resetWorkspaceDataAction}>
              <Button type="submit" variant="secondary">Vaciar workspace</Button>
            </form>
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
