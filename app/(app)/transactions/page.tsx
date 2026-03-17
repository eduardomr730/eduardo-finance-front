import { createTransactionAction } from "@/server/actions";
import {
  deleteTransactionAction,
  updateTransactionAction,
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
import { getTransactionsData } from "@/server/finance-service";

export default async function TransactionsPage() {
  const data = await getTransactionsData();
  if (!data) return null;

  return (
    <section className="space-y-6">
      <Header
        title="Transacciones"
        subtitle="Registro operativo de ingresos, gastos, inversiones, transferencias y pagos fiscales con trazabilidad por cuenta y categoria."
      />
      <Card>
        <CardHeader>
          <CardTitle>Añadir transacción</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTransactionAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Descripción">
              <Input name="description" placeholder="Ej. Compra supermercado" required />
            </Field>
            <Field label="Importe">
              <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
            </Field>
            <Field label="Fecha">
              <Input name="date" type="date" required />
            </Field>
            <Field label="Tipo">
              <Select name="type" defaultValue="EXPENSE">
                <option value="INCOME">Ingreso</option>
                <option value="EXPENSE">Gasto</option>
                <option value="INVESTMENT">Inversion</option>
                <option value="TAX">Impuesto</option>
                <option value="TRANSFER">Transferencia</option>
              </Select>
            </Field>
            <Field label="Cuenta">
              <Select name="accountId" required>
                <option value="">Selecciona cuenta</option>
                {data.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoría">
              <Select name="categoryId">
                <option value="">Sin categoria</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Comercio o cliente">
              <Input name="merchant" placeholder="Ej. Mercadona o Cliente X" />
            </Field>
            <Field label="Frecuencia">
              <label className="flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm">
                <input type="checkbox" name="isRecurring" />
                Marcar como recurrente
              </label>
            </Field>
            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Notas">
                <Textarea name="notes" placeholder="Detalle adicional de la operación" />
              </Field>
            </div>
            <div className="xl:col-span-4">
              <Button type="submit">Guardar transacción</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ultimas 100 transacciones</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.transactions.length === 0 ? (
            <EmptyState
              title="Todavía no hay transacciones"
              description="Empieza registrando ingresos y gastos manualmente. A partir de aquí el dashboard, los presupuestos y el cashflow real empezarán a poblarse."
            />
          ) : null}
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--muted)]">
                <th className="pb-3">Editar transacción</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-[var(--line)]">
                  <td className="py-3">
                    <form action={updateTransactionAction} className="grid gap-2 xl:grid-cols-[140px_1.2fr_1fr_1fr_140px_160px_auto] xl:items-center">
                      <input type="hidden" name="id" value={transaction.id} />
                      <Field label="Fecha">
                        <Input name="date" type="date" defaultValue={transaction.date.toISOString().slice(0, 10)} required />
                      </Field>
                      <Field label="Descripción">
                        <Input name="description" defaultValue={transaction.description} required />
                      </Field>
                      <Field label="Categoría">
                        <Select name="categoryId" defaultValue={transaction.categoryId ?? ""}>
                          <option value="">Sin categoria</option>
                          {data.categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Cuenta">
                        <Select name="accountId" defaultValue={transaction.accountId ?? ""}>
                          {data.accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Tipo">
                        <Select name="type" defaultValue={transaction.type}>
                          <option value="INCOME">Ingreso</option>
                          <option value="EXPENSE">Gasto</option>
                          <option value="INVESTMENT">Inversion</option>
                          <option value="TAX">Impuesto</option>
                          <option value="TRANSFER">Transferencia</option>
                        </Select>
                      </Field>
                      <Field label="Importe">
                        <Input name="amount" type="number" step="0.01" defaultValue={String(Number(transaction.amount))} required />
                      </Field>
                      <div className="flex justify-end gap-2">
                        <Button type="submit" variant="secondary">Guardar</Button>
                        <Button
                          type="submit"
                          formAction={deleteTransactionAction}
                          variant="ghost"
                          className="text-rose-500"
                        >
                          Borrar
                        </Button>
                      </div>
                    </form>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {transaction.merchant ?? "-"} · {formatCurrency(Number(transaction.amount))}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
