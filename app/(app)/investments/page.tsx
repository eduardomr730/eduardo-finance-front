import {
  createInvestmentAssetAction,
  createInvestmentTransactionAction,
  deleteInvestmentAssetAction,
  deleteInvestmentTransactionAction,
  updateInvestmentAssetAction,
} from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo activo</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createInvestmentAssetAction} className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre del activo">
                <Input name="name" placeholder="Ej. Vanguard S&P 500" required />
              </Field>
              <Field label="Ticker">
                <Input name="ticker" placeholder="Ej. VUSA" />
              </Field>
              <Field label="Tipo de activo">
                <Input name="assetType" placeholder="ETF, Fondo, Accion..." defaultValue="ETF" />
              </Field>
              <Field label="Cuenta asociada">
                <Select name="accountId">
                  <option value="">Sin cuenta</option>
                  {data.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Participaciones">
                <Input name="units" type="number" step="0.000001" defaultValue="0" />
              </Field>
              <Field label="Coste medio">
                <Input name="averageCost" type="number" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Precio actual">
                <Input name="currentPrice" type="number" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Valor actual">
                <Input name="currentValue" type="number" step="0.01" defaultValue="0" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Notas">
                  <Textarea name="notes" placeholder="Observaciones del activo" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Crear activo</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nuevo movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createInvestmentTransactionAction} className="grid gap-4 md:grid-cols-2">
              <Field label="Activo">
                <Select name="assetId" required>
                  <option value="">Selecciona activo</option>
                  {data.assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Cuenta">
                <Select name="accountId">
                  <option value="">Sin cuenta</option>
                  {data.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tipo de movimiento">
                <Select name="type" defaultValue="CONTRIBUTION">
                  <option value="CONTRIBUTION">Aportacion</option>
                  <option value="BUY">Compra</option>
                  <option value="SELL">Venta</option>
                  <option value="DIVIDEND">Dividendo</option>
                </Select>
              </Field>
              <Field label="Fecha">
                <Input name="tradeDate" type="date" required />
              </Field>
              <Field label="Participaciones">
                <Input name="units" type="number" step="0.000001" defaultValue="0" />
              </Field>
              <Field label="Precio">
                <Input name="price" type="number" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Comisiones">
                <Input name="fees" type="number" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Importe total">
                <Input name="totalAmount" type="number" step="0.01" defaultValue="0" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Notas">
                  <Textarea name="notes" placeholder="Detalle adicional del movimiento" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Registrar movimiento</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.assets.length === 0 ? (
              <EmptyState
                title="Aún no hay activos"
                description="Crea tus activos manuales y su valor actual para que el patrimonio y la evolución empiecen a reflejar tu cartera."
              />
            ) : null}
            {data.assets.map((asset) => (
              <form key={asset.id} action={updateInvestmentAssetAction} className="rounded-2xl border p-4">
                <input type="hidden" name="id" value={asset.id} />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Nombre">
                    <Input name="name" defaultValue={asset.name} />
                  </Field>
                  <Field label="Ticker">
                    <Input name="ticker" defaultValue={asset.ticker ?? ""} />
                  </Field>
                  <Field label="Tipo">
                    <Input name="assetType" defaultValue={asset.assetType} />
                  </Field>
                  <Field label="Cuenta">
                    <Select name="accountId" defaultValue={asset.accountId ?? ""}>
                      <option value="">Sin cuenta</option>
                      {data.accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Participaciones">
                    <Input name="units" type="number" step="0.000001" defaultValue={String(Number(asset.units))} />
                  </Field>
                  <Field label="Coste medio">
                    <Input name="averageCost" type="number" step="0.01" defaultValue={String(Number(asset.averageCost))} />
                  </Field>
                  <Field label="Precio actual">
                    <Input name="currentPrice" type="number" step="0.01" defaultValue={String(Number(asset.currentPrice))} />
                  </Field>
                  <Field label="Valor actual">
                    <Input name="currentValue" type="number" step="0.01" defaultValue={String(Number(asset.currentValue))} />
                  </Field>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Valor actual {formatCurrency(Number(asset.currentValue))} · {Number(asset.units).toFixed(3)} uds
                </p>
                <div className="mt-4 flex gap-2">
                  <Button type="submit" variant="secondary">Guardar</Button>
                  <Button type="submit" formAction={deleteInvestmentAssetAction} variant="ghost" className="text-rose-500">
                    Borrar
                  </Button>
                </div>
              </form>
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
                  <th className="pb-3 text-right">Acciones</th>
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
                    <td className="py-3 text-right">
                      <form action={deleteInvestmentTransactionAction}>
                        <input type="hidden" name="id" value={transaction.id} />
                        <Button type="submit" variant="ghost" className="text-rose-500">
                          Borrar
                        </Button>
                      </form>
                    </td>
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
