import { createTransactionAction } from "@/server/actions";
import { EmptyState } from "@/components/ui/empty-state";
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
            <Input name="description" placeholder="Descripcion" required />
            <Input name="amount" type="number" step="0.01" placeholder="Importe" required />
            <Input name="date" type="date" required />
            <Select name="type" defaultValue="EXPENSE">
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Gasto</option>
              <option value="INVESTMENT">Inversion</option>
              <option value="TAX">Impuesto</option>
              <option value="TRANSFER">Transferencia</option>
            </Select>
            <Select name="accountId" required>
              <option value="">Selecciona cuenta</option>
              {data.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            <Select name="categoryId">
              <option value="">Sin categoria</option>
              {data.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Input name="merchant" placeholder="Comercio o cliente" />
            <label className="flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm">
              <input type="checkbox" name="isRecurring" />
              Recurrente
            </label>
            <div className="md:col-span-2 xl:col-span-4">
              <Textarea name="notes" placeholder="Notas" />
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
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Descripcion</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Cuenta</th>
                <th className="pb-3">Tipo</th>
                <th className="pb-3 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-[var(--line)]">
                  <td className="py-3">{transaction.date.toLocaleDateString("es-ES")}</td>
                  <td className="py-3">{transaction.description}</td>
                  <td className="py-3">{transaction.category?.name ?? "-"}</td>
                  <td className="py-3">{transaction.account?.name ?? "-"}</td>
                  <td className="py-3">{transaction.type}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(Number(transaction.amount))}
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
