import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <CardTitle>Ultimas 100 transacciones</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
