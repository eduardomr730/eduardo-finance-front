import { createBudgetAction } from "@/server/actions";
import { deleteBudgetAction, updateBudgetAction } from "@/server/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { getBudgetsData } from "@/server/finance-service";

export default async function BudgetsPage() {
  const data = await getBudgetsData();
  if (!data) return null;

  return (
    <section className="space-y-6">
      <Header
        title="Presupuestos"
        subtitle="Control mensual por categoria con limites, alertas visuales y base preparada para rollover futuro."
      />
      <Card>
        <CardHeader>
          <CardTitle>Crear presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBudgetAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Categoría">
              <Select name="categoryId" required>
                <option value="">Selecciona categoria</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Importe mensual">
              <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
            </Field>
            <Field label="Mes presupuestado">
              <Input
                name="month"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </Field>
            <Field label="Alerta (%)">
              <Input name="alertPercent" type="number" min="1" max="100" defaultValue="80" />
            </Field>
            <div className="xl:col-span-4">
              <Button type="submit">Guardar presupuesto</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Presupuesto actual</CardTitle>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Consumido {formatCurrency(data.totals.spent)} de {formatCurrency(data.totals.budgeted)}
            </p>
          </div>
          <Badge tone="accent">{formatPercent(data.totals.consumptionRate)}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.items.length === 0 ? (
            <EmptyState
              title="No has creado presupuestos aún"
              description="Añade tus límites mensuales por categoría para empezar a medir consumo real frente a objetivo."
            />
          ) : null}
          {data.items.map((item) => (
            <form key={item.category} action={updateBudgetAction} className="rounded-2xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.category}</p>
                  <p className="text-sm text-[var(--muted)]">
                    Restante {formatCurrency(item.remaining)}
                  </p>
                </div>
                <Badge
                  tone={
                    item.status === "danger"
                      ? "danger"
                      : item.status === "warning"
                        ? "warning"
                        : "success"
                  }
                >
                  {formatPercent(item.consumptionRate)}
                </Badge>
              </div>
              <input type="hidden" name="id" value={item.id} />
              <div className="h-2 rounded-full bg-black/5 dark:bg-white/8">
                <div
                  className="h-2 rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.min(item.consumptionRate * 100, 100)}%` }}
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <Field label="Categoría">
                  <Select
                    name="categoryId"
                    defaultValue={item.categoryId ?? ""}
                  >
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Importe">
                  <Input name="amount" type="number" step="0.01" defaultValue={String(item.budgeted)} />
                </Field>
                <Field label="Mes">
                  <Input name="month" type="date" defaultValue={item.month.toISOString().slice(0, 10)} />
                </Field>
                <Field label="Alerta (%)">
                  <Input name="alertPercent" type="number" defaultValue={String(item.alertPercent)} />
                </Field>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit" variant="secondary">Guardar</Button>
                <Button type="submit" formAction={deleteBudgetAction} variant="ghost" className="text-rose-500">
                  Borrar
                </Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
